// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@astrolabs/swapper/contracts/interfaces/ISwapper.sol";
import "./As4626Abstract.sol";

/**            _             _       _
 *    __ _ ___| |_ _ __ ___ | | __ _| |__
 *   /  ` / __|  _| '__/   \| |/  ` | '  \
 *  |  O  \__ \ |_| | |  O  | |  O  |  O  |
 *   \__,_|___/.__|_|  \___/|_|\__,_|_.__/  ©️ 2023
 *
 * @title As4626Abstract - inherited by all strategies
 * @author Astrolab DAO
 * @notice All As4626 calls are delegated to the agent (StrategyV5Agent)
 * @dev Make sure all As4626 state variables here to match proxy/implementation slots
 */
abstract contract StrategyV5Abstract is As4626Abstract {

    // Events
    event Invest(uint256 amount, uint256 timestamp);
    event Harvest(uint256 amount, uint256 timestamp);
    event Compound(uint256 amount, uint256 timestamp);
    event Liquidate(
        uint256 amount,
        uint256 liquidityAvailable,
        uint256 timestamp
    );
    event UnderlyingUpdate(address indexed addr, uint256 spent, uint256 received);
    event InputUpdate(address indexed addr);
    event AgentUpdate(address indexed addr);
    event SwapperUpdate(address indexed addr);
    event SetSwapperAllowance(uint256 amount);
    error InvalidCalldata();

    // State variables (As4626 extension)
    ISwapper public swapper; // Interface for swapping assets
    address public agent; // Address of the agent
    address public stratProxy; // Address of the strategy proxy

    IERC20Metadata[8] public inputs; // Array of ERC20 tokens used as inputs
    uint8[8] internal inputDecimals; // Decimals of the input assets
    uint16[8] public inputWeights; // Array of input weights weights in basis points (100% = 10_000)
    address[8] public rewardTokens; // Array of reward tokens harvested at compound and liquidate times
    mapping(address => uint8) internal rewardTokenIndex; // to keep track of reward token indexes eg. to be aggregated
    uint8 internal inputLength; // Actual length of the inputs array
    uint8 internal rewardLength; // Actual length of the reward tokens array

    /**
     * @param _erc20Metadata ERC20Permit constructor data: name, symbol, version
     */
    constructor(string[3] memory _erc20Metadata) As4626Abstract(_erc20Metadata) {}

    /**
     * @notice Calculates the total pending redemption requests
     * @dev Returns the difference between req.totalClaimableRedemption and req.totalClaimableRedemption
     * @return The total amount of pending redemption requests
     */
    function totalPendingRedemptionRequest() public view returns (uint256) {
        return req.totalRedemption - req.totalClaimableRedemption;
    }

    /**
     * @notice Calculates the total pending underlying requests based on redemption requests
     * @dev Converts the total pending redemption requests to their underlying asset value for precision
     * @return The total amount of underlying assets requested pending redemption
     */
    function totalPendingUnderlyingRequest() public view returns (uint256) {
        return convertToAssets(totalPendingRedemptionRequest());
    }
}
