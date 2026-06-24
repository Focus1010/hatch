# Hatch Skill - Bonding Curve

## Purpose

Guide the user through designing and writing a bonding curve token launch contract on Base. Covers linear, exponential, and Bancor-style curves, with graduation to Uniswap/Aerodrome.

## Questions to ask before writing code

If not already answered in the spec:

1. What curve shape? (linear, exponential, or square root)
2. What is the graduation target? (ETH raised before liquidity is seeded)
3. Where does liquidity graduate to? (Uniswap v3 on Base, Aerodrome)
4. What percentage of raised ETH goes to the liquidity pool vs. treasury?
5. Is there a max buy per wallet to prevent sniping?
6. Is there a creator fee on trades?
7. Should unsold tokens be burned at graduation or kept in treasury?

## Linear bonding curve implementation

Price increases linearly with supply. Simple and predictable.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BondingCurve is Ownable, ReentrancyGuard {
    IERC20 public immutable token;

    uint256 public constant INITIAL_PRICE = 0.000001 ether;  // price at 0 supply
    uint256 public constant SLOPE = 0.0000000001 ether;      // price increase per token sold
    uint256 public constant GRADUATION_TARGET = 24 ether;    // ETH raised to graduate
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;
    uint256 public constant CREATOR_FEE_BPS = 100;           // 1%

    uint256 public totalRaised;
    uint256 public totalSold;
    bool public graduated;

    address public creator;
    address public liquidityRouter;

    event TokensPurchased(address indexed buyer, uint256 ethIn, uint256 tokensOut);
    event TokensSold(address indexed seller, uint256 tokensIn, uint256 ethOut);
    event Graduated(uint256 totalRaised, uint256 liquiditySeeded);

    error AlreadyGraduated();
    error NotGraduated();
    error SlippageExceeded();
    error ZeroAmount();

    constructor(
        address _token,
        address _creator,
        address _liquidityRouter,
        address initialOwner
    ) Ownable(initialOwner) {
        token = IERC20(_token);
        creator = _creator;
        liquidityRouter = _liquidityRouter;
    }

    // Get current price for next token
    function currentPrice() public view returns (uint256) {
        return INITIAL_PRICE + (SLOPE * totalSold / 1e18);
    }

    // Calculate ETH cost for buying `amount` tokens
    function getBuyPrice(uint256 amount) public view returns (uint256) {
        uint256 startPrice = currentPrice();
        uint256 endPrice = INITIAL_PRICE + (SLOPE * (totalSold + amount) / 1e18);
        // Area under linear curve = average price * amount
        return (startPrice + endPrice) * amount / 2 / 1e18;
    }

    // Calculate ETH received for selling `amount` tokens
    function getSellPrice(uint256 amount) public view returns (uint256) {
        require(totalSold >= amount, "Exceeds sold supply");
        uint256 endPrice = currentPrice();
        uint256 startPrice = INITIAL_PRICE + (SLOPE * (totalSold - amount) / 1e18);
        return (startPrice + endPrice) * amount / 2 / 1e18;
    }

    function buy(uint256 minTokensOut) external payable nonReentrant {
        if (graduated) revert AlreadyGraduated();
        if (msg.value == 0) revert ZeroAmount();

        // Calculate tokens out for ETH in
        uint256 tokensOut = _ethToTokens(msg.value);
        if (tokensOut < minTokensOut) revert SlippageExceeded();

        // Creator fee
        uint256 fee = msg.value * CREATOR_FEE_BPS / 10000;
        uint256 netEth = msg.value - fee;

        totalRaised += netEth;
        totalSold += tokensOut;

        // Pay fee to creator
        (bool feeSuccess, ) = creator.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        token.transfer(msg.sender, tokensOut);
        emit TokensPurchased(msg.sender, msg.value, tokensOut);

        // Check graduation
        if (totalRaised >= GRADUATION_TARGET) {
            _graduate();
        }
    }

    function sell(uint256 tokenAmount, uint256 minEthOut) external nonReentrant {
        if (graduated) revert AlreadyGraduated();
        if (tokenAmount == 0) revert ZeroAmount();

        uint256 ethOut = getSellPrice(tokenAmount);
        if (ethOut < minEthOut) revert SlippageExceeded();

        uint256 fee = ethOut * CREATOR_FEE_BPS / 10000;
        uint256 netEth = ethOut - fee;

        totalSold -= tokenAmount;
        totalRaised -= ethOut;

        token.transferFrom(msg.sender, address(this), tokenAmount);

        (bool feeSuccess, ) = creator.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        (bool success, ) = msg.sender.call{value: netEth}("");
        require(success, "ETH transfer failed");

        emit TokensSold(msg.sender, tokenAmount, netEth);
    }

    function _graduate() internal {
        graduated = true;
        // Seed liquidity on Uniswap v3 / Aerodrome
        // Implementation depends on chosen DEX router
        // 80% of ETH + remaining tokens go to LP
        // 20% to protocol treasury
        emit Graduated(totalRaised, address(this).balance * 80 / 100);
    }

    function _ethToTokens(uint256 ethAmount) internal view returns (uint256) {
        // Inverse of getBuyPrice: solve quadratic for token amount
        // Simplified: iterate or use quadratic formula
        // For production: use a proper AMM math library
        uint256 a = SLOPE;
        uint256 b = 2 * currentPrice() * 1e18;
        uint256 c = 2 * ethAmount * 1e18;
        // tokens = (-b + sqrt(b^2 + 4ac)) / (2a)
        // Use PRBMath or similar for safe sqrt
        return c / currentPrice(); // simplified -- replace with proper math
    }
}
```

## Important notes on curve math

The `_ethToTokens` simplified version above is not production-safe. For mainnet:

- Use [PRBMath](https://github.com/PaulRBerg/prb-math) for fixed-point sqrt
- Or pre-compute price increments off-chain and pass them as calldata
- Or use Bancor formula (more gas efficient for exponential curves)
- Always add slippage protection with `minTokensOut` / `minEthOut`

## Graduation to Uniswap v3

```solidity
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

function _graduate() internal {
    graduated = true;
    uint256 ethForLiquidity = address(this).balance * 80 / 100;
    uint256 tokensForLiquidity = token.balanceOf(address(this));

    // Create Uniswap v3 pool and add initial liquidity
    // This requires WETH wrapping + NonfungiblePositionManager call
    // See deployment/uniswap-v3 skill for full implementation
}
```

## Audit flags specific to bonding curves

- Front-running on buys/sells -- slippage params are mandatory
- Creator fee manipulation if creator address is changeable
- Graduation trigger can be sandwiched -- use commit-reveal or oracle
- Integer overflow in price calculation with large supplies
- Re-entrancy on ETH refunds in `buy()` if ETH exceeds needed amount

## Testing checklist

```solidity
- test_Buy()
- test_Sell()
- test_BuySlippageReverts()
- test_SellSlippageReverts()
- test_PriceIncreasesAfterBuy()
- test_GraduationTrigger()
- test_CannotBuyAfterGraduation()
- testFuzz_BuySell(uint256 ethAmount)
- test_CreatorFeeAccrues()
```
