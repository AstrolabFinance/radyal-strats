// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@astrolabs/swapper/contracts/interfaces/ISwapper.sol";
import "./StrategyV5Abstract.sol";
import "./AsProxy.sol";
import "../libs/AsArrays.sol";
import "../libs/AsMaths.sol";

/**            _             _       _
 *    __ _ ___| |_ _ __ ___ | | __ _| |__
 *   /  ` / __|  _| '__/   \| |/  ` | '  \
 *  |  O  \__ \ |_| | |  O  | |  O  |  O  |
 *   \__,_|___/.__|_|  \___/|_|\__,_|_.__/  ©️ 2023
 *
 * @title StrategyV5 Abstract - implemented by all strategies
 * @author Astrolab DAO
 * @notice All StrategyV5 calls are delegated to the agent (StrategyV5Agent)
 * @dev Make sure all state variables are in StrategyV5Abstract to match proxy/implementation slots
 */
abstract contract StrategyV5 is StrategyV5Abstract, AsProxy {
    using AsMaths for uint256;
    using AsMaths for int256;
    using AsArrays for bytes[];
    using SafeERC20 for IERC20;

    /**
     * @param _erc20Metadata ERC20Permit constructor data: name, symbol, version
     */
    constructor(
        string[3] memory _erc20Metadata
    ) StrategyV5Abstract(_erc20Metadata) {}

    /**
     * @notice Initialize the strategy
     * @param _params StrategyBaseParams struct containing strategy parameters
     */
    function _init(StrategyBaseParams calldata _params) internal onlyAdmin {
        // setExemption(msg.sender, true);
        // done in As4626 but required for swapper
        stratProxy = address(this);
        underlying = ERC20(_params.underlying);
        agent = _params.coreAddresses[2];
        if (agent == address(0)) revert AddressZero();
        _delegateWithSignature(
            agent,
            "init(((uint64,uint64,uint64,uint64),address,address[3],address[],uint16[],address[]))" // StrategyV5Agent.init(_params)
        );
    }
 
    /**
     * @notice Returns the StrategyV5Agent proxy initialization state
     */
    function initialized() public view override returns (bool) {
        return agent != address(0) && address(underlying) != address(0);
    }

    /**
     * @notice Returns the address of the implementation
     */
    function _implementation() internal view override returns (address) {
        return agent;
    }

    /**
     * @notice Changes the strategy underlying token (automatically pauses the strategy)
     * called from oracle implementations
     * @param _underlying Address of the token
     * @param _swapData Swap callData oldUnderlying->newUnderlying
     */
    function _updateUnderlying(
        address _underlying,
        bytes calldata _swapData
    ) internal {
        _delegateWithSignature(
            agent,
            "updateUnderlying(address,bytes)" // StrategyV5Agent.updateUnderlying(_underlying, _swapData)
        );
    }

    /**
     * @notice Sets the agent (StrategyV5Agent implementation)
     * @param _agent The new agent address
     */
    function updateAgent(address _agent) external onlyAdmin {
        if (_agent == address(0)) revert AddressZero();
        agent = _agent;
        emit AgentUpdate(_agent);
    }

    /**
     * @notice Withdraw asset function, can remove all funds in case of emergency
     * @param _amounts Amounts of asset to withdraw
     * @param _params Swaps calldata
     * @return assetsRecovered Amount of asset withdrawn
     */
    function _liquidate(
        uint256[8] calldata _amounts, // from previewLiquidate()
        bytes[] memory _params
    ) internal virtual returns (uint256 assetsRecovered) {}

    /**
     * @dev Reverts if slippage is too high unless panic is true. Extends the functionality of the _liquidate function.
     * @param _amounts Amount of inputs to liquidate (in underlying)
     * @param _minLiquidity Minimum amount of assets to receive
     * @param _panic Set to true to ignore slippage when unfolding
     * @param _params Generic callData (e.g., SwapperParams)
     * @return liquidityAvailable Amount of assets available to unfold
     * @return Total assets in the strategy after unfolding
     */
    function liquidate(
        uint256[8] calldata _amounts,
        uint256 _minLiquidity,
        bool _panic,
        bytes[] memory _params
    )
        external
        onlyKeeper
        nonReentrant
        returns (uint256 liquidityAvailable, uint256)
    {
        // pre-liquidation sharePrice
        uint256 price = sharePrice();
        uint256 underlyingRequests = totalPendingRedemptionRequest().mulDiv(
            price,
            weiPerShare
        );

        _minLiquidity = AsMaths.min(
            _minLiquidity,
            underlyingRequests // pending underlying requests
        );

        // liquidate protocol positions
        uint256 liquidated = _liquidate(_amounts, _params);
        uint256 claimable = availableClaimable();

        req.totalClaimableUnderlying = AsMaths.min(
            req.totalUnderlying,
            req.totalClaimableUnderlying + liquidated
        );

        req.totalClaimableRedemption = AsMaths.min(
            req.totalClaimableRedemption,
            req.totalClaimableUnderlying.mulDiv(weiPerShare, price)
        );

        uint256 cash = claimable - req.totalClaimableUnderlying - minLiquidity;

        if ((cash < _minLiquidity) && !_panic)
            revert AmountTooLow(liquidityAvailable);

        last.liquidate = block.timestamp;

        emit Liquidate(liquidated, liquidityAvailable, block.timestamp);
        return (liquidityAvailable, totalAssets());
    }

    /**
     * @dev Internal function to liquidate a specified amount, to be implemented by strategies
     * @param _amount Amount to be liquidated
     * @return Amount that was liquidated
     */
    function _liquidateRequest(
        uint256 _amount
    ) internal virtual returns (uint256) {}

    /**
     * @notice Order the withdrawal request in strategies with lock
     * @param _amount Amount of debt to unfold
     * @return assetsRecovered Amount of assets recovered
     */
    function liquidateRequest(
        uint256 _amount
    ) external onlyKeeper returns (uint256) {
        return _liquidateRequest(_amount);
    }

    /**
     * @dev Internal function to harvest rewards, to be implemented by strategies
     * @param _params Generic callData (e.g., SwapperParams)
     * @return amount Amount of underlying assets received (after swap)
     */
    function _harvest(
        bytes[] memory _params
    ) internal virtual returns (uint256 amount) {}

    /**
     * @notice Harvest rewards from the protocol
     * @param _params Generic callData (e.g., SwapperParams)
     * @return amount Amount of underlying assets received (after swap)
     */
    function harvest(bytes[] memory _params) public returns (uint256 amount) {
        amount = _harvest(_params);
        // reset expected profits to updated value + amount
        expectedProfits =
            AsAccounting.unrealizedProfits(
                last.harvest,
                expectedProfits,
                profitCooldown
            ) +
            amount;
        last.harvest = block.timestamp;
        emit Harvest(amount, block.timestamp);
    }

    /**
     * @notice Invests the underlying asset into the pool
     * @param _amounts Amounts of underlying to invest in each input
     * @param _params Swaps calldata
     * @return investedAmount Amount invested
     * @return iouReceived Amount of LP tokens received
     */
    function _invest(
        uint256[8] calldata _amounts, // from previewInvest()
        bytes[] memory _params
    ) internal virtual returns (uint256 investedAmount, uint256 iouReceived) {}

    /**
     * @notice Invests the underlying asset into the pool
     * @param _amounts Amounts of underlying to invest in each input
     * @param _params Swaps calldata
     * @return investedAmount Amount invested
     * @return iouReceived Amount of LP tokens received
     */
    function invest(
        uint256[8] calldata _amounts, // from previewInvest()
        bytes[] memory _params
    ) public onlyManager returns (uint256 investedAmount, uint256 iouReceived) {
        (investedAmount, iouReceived) = _invest(_amounts, _params);
        emit Invest(investedAmount, block.timestamp);
        return (investedAmount, iouReceived);
    }

    /**
     * @notice Compounds the strategy using SwapData for both harvest and invest
     * @dev Pass a conservative _amount (e.g., available() + 90% of rewards valued in underlying)
     * to ensure the underlying->inputs swaps
     * @param _amounts Amount of inputs to invest (in underlying, after harvest-> should include rewards)
     * @param _params Generic callData (harvest+invest SwapperParams)
     * @return iouReceived IOUs received from the compound operation
     * @return harvestedRewards Amount of rewards harvested
     */
    function _compound(
        uint256[8] calldata _amounts,
        bytes[] memory _params // rewardTokens(0...n)->underling() / underlying()->inputs(0...n) with underlyingWeights(0...n)
    ) internal virtual returns (uint256 iouReceived, uint256 harvestedRewards) {
        // we expect the SwapData to cover harvesting + investing
        if (_params.length != (rewardLength + inputLength))
            revert InvalidCalldata();

        // harvest using the first calldata bytes (swap rewards->underlying)
        harvestedRewards = harvest(_params.slice(0, rewardLength));
        (, iouReceived) = _invest(
            _amounts,
            _params.slice(rewardLength, _params.length)
        ); // invest using the second calldata bytes (swap underlying->inputs)
        return (iouReceived, harvestedRewards);
    }

    /**
     * @notice Executes the compound operation in the strategy
     * @param _amounts Amounts of inputs to compound (in underlying, after harvest-> should include rewards)
     * @param _params Generic callData for the compound operation
     * @return iouReceived IOUs received from the compound operation
     * @return harvestedRewards Amount of rewards harvested
     */
    function compound(
        uint256[8] calldata _amounts,
        bytes[] memory _params
    )
        external
        onlyKeeper
        returns (uint256 iouReceived, uint256 harvestedRewards)
    {
        (iouReceived, harvestedRewards) = _compound(_amounts, _params);
        emit Compound(iouReceived, block.timestamp);
    }

    /**
     * @dev Internal virtual function to set allowances, to be implemented by specific strategies
     * @param _amount Amount for which to set the allowances
     */
    function _setAllowances(uint256 _amount) internal virtual {}

    /**
     * @notice Converts underlying wei amount to input wei amount
     * @return Input amount in wei
     * @dev Abstract function to be implemented by the oracle or the strategy
     */
    function _underlyingToInput(
        uint256 _amount,
        uint8 _index
    ) internal view virtual returns (uint256) {}

    /**
     * @notice Converts input wei amount to underlying wei amount
     * @return Underlying amount in wei
     * @dev Abstract function to be implemented by the oracle or the strategy
     */
    function _inputToUnderlying(
        uint256 _amount,
        uint8 _index
    ) internal view virtual returns (uint256) {}

    /**
     * @notice Convert LP/staked LP to input
     * @return Input value of the LP amount
     * @dev Abstract function to be implemented by the oracle or the strategy
     */
    function _stakeToInput(
        uint256 _amount,
        uint8 _index
    ) internal view virtual returns (uint256) {}

    /**
     * @notice Convert input to LP/staked LP
     * @return LP value of the input amount
     * @dev Abstract function to be implemented by the oracle or the strategy
     */
    function _inputToStake(
        uint256 _amount,
        uint8 _index
    ) internal view virtual returns (uint256) {}

    /**
     * @notice Returns the invested input converted from the staked LP token
     * @return Input value of the LP/staked balance
     * @dev Abstract function to be implemented by the oracle or the strategy
     */
    function _stakedInput(
        uint8 _index
    ) internal view virtual returns (uint256) {}

    /**
     * @notice Returns the investment in underlying asset
     * @return total Amount invested
     */
    function invested() public view virtual override returns (uint256 total) {
        for (uint8 i = 0; i < inputLength; i++)
            total += invested(i);
    }

    /**
     * @notice Convert LP/staked LP to input
     * @return Input value of the LP amount
     */
    function _stakeToUnderlying(
        uint256 _amount,
        uint8 _index
    ) internal view returns (uint256) {
        return _inputToUnderlying(_stakeToInput(_amount, _index), _index);
    }

    /**
     * @notice Convert underlying to LP/staked LP
     * @return LP value of the underlying amount
     */
    function _underlyingToStake(
        uint256 _amount,
        uint8 _index
    ) internal view returns (uint256) {
        return _inputToStake(_underlyingToInput(_amount, _index), _index);
    }

    /**
     * @dev Calculate the excess weight for a given input index.
     * @param _index Index of the input
     * @param _total Total invested amount
     * @return int256 Excess weight (/10_000)
     */
    function _excessWeight(
        uint8 _index,
        uint256 _total
    ) internal view returns (int256) {
        if (_total == 0) _total = invested();
        return
            int256(invested(_index).mulDiv(10_000, _total)) -
            int256(uint256(inputWeights[_index]));
    }

    /**
     * @dev Calculate the excess weights for all inputs.
     * @param _total Total invested amount
     * @return excessWeights int256[8] Excess weights for each input
     */
    function _excessWeights(
        uint256 _total
    ) internal view returns (int256[8] memory excessWeights) {
        if (_total == 0) _total = invested();
        for (uint8 i = 0; i < inputLength; i++)
            excessWeights[i] = _excessWeight(i, _total);
    }

    /**
     * @dev Calculate the excess liquidity for a given input
     * @param _index Index of the input
     * @param _total Total invested amount in underlying (0 == invested())
     * @return int256 Excess liquidity
     */
    function _excessInputLiquidity(
        uint8 _index,
        uint256 _total
    ) internal view returns (int256) {
        if (_total == 0) _total = invested();
        return
            int256(investedInput(_index)) -
            int256(_underlyingToInput(_total.mulDiv(uint256(inputWeights[_index]), 10_000), _index));
    }

    /**
     * @dev Calculate the excess liquidity for all inputs
     * @param _total Total invested amount in underlying (0 == invested())
     * @return excessLiquidity int256[8] Excess liquidity for each input
     */
    function _excessInputLiquidity(
        uint256 _total
    ) internal view returns (int256[8] memory excessLiquidity) {
        if (_total == 0) _total = invested();
        for (uint8 i = 0; i < inputLength; i++)
            excessLiquidity[i] = _excessInputLiquidity(i, _total);
    }

    /**
     * @dev Preview the amounts that would be liquidated based on the given amount.
     * @param _amount Amount of underlying to liquidate with (0 == totalPendingUnderlyingRequest() + allocated.bp(100))
     * @return amounts uint256[8] Previewed liquidation amounts for each input
     */
    function previewLiquidate(
        uint256 _amount
    ) public view returns (uint256[8] memory amounts) {
        uint256 allocated = invested();
        if (_amount == 0)
            _amount = AsMaths.min(totalPendingUnderlyingRequest() + allocated.bp(100), allocated); // defaults to requests + 1% offset to buffer flows
        int256[8] memory excessInput = _excessInputLiquidity(allocated - _amount);
        for (uint8 i = 0; i < inputLength; i++) {
            if (_amount < 10) break; // no leftover
            if (excessInput[i] > 0) {
                uint256 need = _inputToUnderlying(excessInput[i].abs(), i);
                if (need > _amount)
                    need = _amount;
                amounts[i] = _underlyingToInput(need, i);
                _amount -= need;
            }
        }
    }

    /**
     * @dev Preview the amounts that would be invested based on the given amount.
     * @param _amount Amount of underlying to invest with
     * @return amounts uint256[8] Previewed investment amounts for each input
     */
    function previewInvest(
        uint256 _amount
    ) public view returns (uint256[8] memory amounts) {
        if (_amount == 0)
            _amount = available().subBp(1_000); // only invest 90% of liquidity for buffered flows
        int256[8] memory excessInput = _excessInputLiquidity(invested() + _amount);
        for (uint8 i = 0; i < inputLength; i++) {
            if (_amount < 10) break; // no leftover
            if (excessInput[i] < 0) {
                uint256 need = _inputToUnderlying(excessInput[i].abs(), i);
                if (need > _amount)
                    need = _amount;
                amounts[i] = need;
                _amount -= need;
            }
        }
    }

    /**
     * @notice Amount of rewards available to harvest
     * @dev Abstract function to be implemented by the strategy
     * @return amounts Amount of reward tokens available
     */
    function rewardsAvailable()
        public
        view
        virtual
        returns (uint256[] memory amounts)
    {}
}
