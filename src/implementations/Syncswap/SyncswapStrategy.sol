// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../libs/AsMaths.sol";

import "./interfaces/IRouter.sol";
import "../../abstract/StrategyV5.sol";

/// @title Syncswap Strategy (v5)
/// @notice This contract is a strategy for Syncswap
/// @dev Basic implementation
contract SyncswapStrategy is StrategyV5 {
    using SafeERC20 for IERC20;

    // Tokens used
    IERC20 public immutable iouToken;
    // Third-party contracts
    IRouter public immutable router;
    IStablePool public immutable pool;

    uint256 constant STAKE_SLIPPAGE = 10; // 1% slippage

    constructor(
        Fees memory _fees, // perfFee, mgmtFee, entryFee, exitFee in bps 100% = 10000
        address _underlying, // The asset we are using
        address[] memory _coreAddresses,
        string[] memory _erc20Metadata, // name, symbol of the share and EIP712 version
        address _router,
        address _pool
    ) StrategyV5(_fees, _underlying, _coreAddresses, _erc20Metadata) {
        router = IRouter(_router);
        pool = IStablePool(pool);
        _setAllowances(MAX_UINT256);
    }

    // Interactions

    /// @notice Invests the underlying asset into the pool
    /// @param _amount Max amount of underlying to invest
    /// @param _minIouReceived Min amount of LP tokens to receive
    /// @param _params Calldata for swap if input != underlying
    function _invest(
        uint256 _amount,
        uint256 _minIouReceived,
        bytes[] memory _params
    ) internal override returns (uint256 investedAmount, uint256 iouReceived) {
        uint256 assetsToLP = underlying.balanceOf(address(this));
        // The amount we add is capped by _amount
        assetsToLP = assetsToLP > _amount ? _amount : assetsToLP;
        if (!((underlying) == (inputs[0]))) {
            (
                address targetRouter,
                uint256 minAmountOut,
                bytes memory swapData
            ) = abi.decode(_params[0], (address, uint256, bytes));
            swapper.swap({
                _input: address(underlying),
                _output: address(inputs[0]),
                _amountIn: underlying.balanceOf(address(this)),
                _minAmountOut: minAmountOut,
                _targetRouter: targetRouter,
                _callData: swapData
            });
        }

        if (assetsToLP > 0) {
            IRouter.TokenInput[] memory tokenInputs = new IRouter.TokenInput[](
                1
            );
            tokenInputs[0].token = address(inputs[0]);
            tokenInputs[0].amount = inputs[0].balanceOf(address(this));
            assetsToLP = AsMaths.min({x: assetsToLP, y: _amount});
            // Adding liquidity to the pool with the asset balance.
            router.addLiquidity({
                pool: address(router),
                inputs: tokenInputs,
                data: abi.encodePacked(address(this)),
                minLiquidity: 0,
                callback: address(0x0),
                callbackData: "0x"
            });
            iouReceived = pool.balanceOf(address(this));
            require(iouReceived >= _minIouReceived, "ERR_MIN_IOU_RECEIVED");
            return (assetsToLP, iouReceived);
        }
    }

    /// @notice Withdraw asset function, can remove all funds in case of emergency
    /// @param _amount The amount of asset to withdraw
    /// @param _params Target router, min amount out and swap data
    /// @return assetsRecovered amount of asset withdrawn
    function _liquidate(
        uint256 _amount,
        bytes[] memory _params
    ) internal override returns (uint256 assetsRecovered) {
        // Calculate the amount of lp token to unstake
        uint256 LPToUnstake = (_amount * stakedLPBalance()) / _invested();
        // calculate minAmounts
        uint minAmount = AsMaths.subBp(_amount, STAKE_SLIPPAGE);
        // Withdraw asset from the pool
        uint256 unstakedAmount = router.burnLiquiditySingle({
            pool: address(pool),
            liquidity: _amount,
            data: abi.encodePacked(address(this)),
            minAmount: minAmount,
            callback: address(0x0),
            callbackData: "0x"
        });

        // swap the unstaked token for the underlying asset if different
        if (inputs[0] != underlying) {
            unstakedAmount = decodeAndSwap(
                inputs[0],
                underlying,
                unstakedAmount,
                _params[0]
            );
        }
        return unstakedAmount;
    }

    // Utils

    /// @notice Set allowances for third party contracts
    function _setAllowances(uint256 _amount) internal override {
        underlying.approve({spender: address(swapper), value: _amount});
        inputs[0].approve({spender: address(router), value: _amount});
    }

    // Getters

    /// @notice Returns the price of a token compared to another.
    function _getRate(address token) internal view return (uint256) {
        //TODO : Use oracle for exchange rate
        return 1;
    }

    /// @notice Returns the investment in asset.
    function _invested() internal view override returns (uint256) {
        // Should return 0 if no lp token is staked
        if (stakedLPBalance() == 0) {
            return 0;
        } else {
                (uint256 reserve0, uint256 reserve1) = pool.getReserves();
                uint256 totalLpBalance = pool.totalSupply();
                uint256 amount0 = (reserve0 * amountLp) / totalLpBalance;
                uint256 amount1 = (reserve1 * amountLp) / totalLpBalance;
                // calculates how much asset (inputs[0]) is to be withdrawn with the lp token balance
                // not the actual ERC4626 underlying invested balance
                return (amount0 + (amount1 * getRate(address(inputs[1]))));
        }
    }

    /// @notice Returns the investment in lp token.
    function stakedLPBalance() public view returns (uint256) {
        return pool.balanceOf(address(this));
}
