// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../libs/AsMaths.sol";

import "./interfaces/IPool.sol";
import "../../abstract/StrategyV5.sol";

/// @title AaveV3 Strategy (v5)
/// @notice This contract is a strategy for AaveV3
/// @dev Basic implementation
contract AaveV3Strategy is StrategyV5 {
    using SafeERC20 for IERC20;

    // Tokens used
    IERC20 public iouToken;
    // Third-party contracts
    IPool public pool;

    // constructor(
    //     Fees memory _fees, // perfFee, mgmtFee, entryFee, exitFee in bps 100% = 10000
    //     address _underlying, // The asset we are using
    //     address[] memory _coreAddresses,
    //     string[] memory _erc20Metadata, // name, symbol of the share and EIP712 version
    //     address _iouToken,
    //     address _pool
    // ) StrategyV5(_fees, _underlying, _coreAddresses, _erc20Metadata) {
    //     iouToken = IERC20(_iouToken);
    //     pool = IPool(_pool);
    //     _setAllowances(MAX_UINT256);
    // }

    constructor(
        string[3] memory _erc20Metadata // name, symbol of the share and EIP712 version
    ) StrategyV5(_erc20Metadata) {}

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
        uint256 assetsToLP = available();

        // The amount we add is capped by _amount
        assetsToLP = AsMaths.min(assetsToLP, _amount);

        if (underlying != inputs[0]) {
            swapper.decodeAndSwap({
                _input: address(underlying),
                _output: address(inputs[0]),
                _amount: inputs[0].balanceOf(address(this)),
                _params: _params[0]
            });
        }

        if (assetsToLP > 0) {
            assetsToLP = AsMaths.min(assetsToLP, _amount);
            // Adding liquidity to the pool with the asset balance.
            pool.supply({
                asset: address(inputs[0]),
                amount: _amount,
                onBehalfOf: msg.sender,
                referralCode: 0
            });
            iouReceived = iouToken.balanceOf(address(this));
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
        // Withdraw asset from the pool
        assetsRecovered = pool.withdraw({
            asset: address(inputs[0]),
            amount: _amount,
            to: address(this)
        });

        // swap the unstaked token for the underlying asset if different
        if (inputs[0] != underlying) {
            (assetsRecovered, ) = swapper.decodeAndSwap(
                address(inputs[0]),
                address(underlying),
                assetsRecovered,
                _params[0]
            );
        }
    }

    // Utils

    /// @notice Set allowances for third party contracts
    function _setAllowances(uint256 _amount) internal override {
        underlying.approve(address(swapper), _amount);
        underlying.approve(address(pool), _amount);
    }

    // Getters

    /// @notice Returns the investment in asset.
    function _invested() internal view override returns (uint256) {
        // calculates how much asset (inputs[0]) is to be withdrawn with the lp token balance
        // not the actual ERC4626 underlying invested balance
        return iouToken.balanceOf(address(this));
        // NOTE: When borrow/lending integrated need to sub Debt to Collateral
        // pool.getUserAccountData(address(this)).totalCollateralBase;
        // - pool.getUserAccountData(address(this)).totalDebtBase
    }

    /// @notice Returns the investment in lp token.
    function stakedLPBalance() public view returns (uint256) {
        return iouToken.balanceOf(address(this));
    }
}
