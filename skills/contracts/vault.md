# Hatch Skill - Vault (ERC-4626)

## Purpose

Guide the user through designing and writing a tokenized vault on Base using the ERC-4626 standard. Covers yield vaults, strategy vaults, and fee-bearing vaults.

## Questions to ask before writing code

If not already answered in the spec:

1. What asset do users deposit? (USDC, WETH, or another ERC-20)
2. Where does yield come from? (lending protocol, staking, LP fees, manual strategy)
3. Is the strategy on-chain or managed by an off-chain keeper?
4. What are the fees? (management fee % per year, performance fee % of profits)
5. Is there a withdrawal queue or is it instant?
6. Who can trigger yield harvesting?
7. Is there a TVL cap?
8. Can the strategy be upgraded?

## Standard ERC-4626 vault

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract [VaultName] is ERC4626, Ownable, ReentrancyGuard, Pausable {
    uint256 public constant MAX_TVL = [cap] * 1e6; // USDC has 6 decimals
    uint256 public constant PERFORMANCE_FEE_BPS = 1000; // 10%
    uint256 public constant MANAGEMENT_FEE_BPS = 200;   // 2% per year

    address public feeRecipient;
    uint256 public lastHarvestTime;
    uint256 public totalProfit;

    event Harvested(uint256 profit, uint256 fee);
    event TVLCapUpdated(uint256 newCap);

    error TVLCapExceeded();
    error ZeroAssets();

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _feeRecipient,
        address initialOwner
    )
        ERC4626(_asset)
        ERC20(_name, _symbol)
        Ownable(initialOwner)
    {
        feeRecipient = _feeRecipient;
        lastHarvestTime = block.timestamp;
    }

    // Override deposit to enforce TVL cap and pause
    function deposit(uint256 assets, address receiver)
        public override nonReentrant whenNotPaused
        returns (uint256)
    {
        if (assets == 0) revert ZeroAssets();
        if (totalAssets() + assets > MAX_TVL) revert TVLCapExceeded();
        return super.deposit(assets, receiver);
    }

    function mint(uint256 shares, address receiver)
        public override nonReentrant whenNotPaused
        returns (uint256)
    {
        uint256 assets = previewMint(shares);
        if (totalAssets() + assets > MAX_TVL) revert TVLCapExceeded();
        return super.mint(shares, receiver);
    }

    function withdraw(uint256 assets, address receiver, address owner)
        public override nonReentrant
        returns (uint256)
    {
        return super.withdraw(assets, receiver, owner);
    }

    function redeem(uint256 shares, address receiver, address owner)
        public override nonReentrant
        returns (uint256)
    {
        return super.redeem(shares, receiver, owner);
    }

    // Harvest yield -- call this from a keeper or manually
    function harvest() external onlyOwner {
        uint256 currentAssets = totalAssets();
        // implement strategy-specific harvest logic here
        // e.g., claim rewards from lending protocol, compound, etc.

        // Management fee
        uint256 elapsed = block.timestamp - lastHarvestTime;
        uint256 managementFee = totalAssets() * MANAGEMENT_FEE_BPS * elapsed / (10000 * 365 days);

        lastHarvestTime = block.timestamp;

        if (managementFee > 0) {
            IERC20(asset()).transfer(feeRecipient, managementFee);
        }

        emit Harvested(currentAssets, managementFee);
    }

    // ERC-4626 requires this to reflect actual deployed assets
    function totalAssets() public view override returns (uint256) {
        // Override this to include assets deployed to strategy
        // e.g., return IERC20(asset()).balanceOf(address(this)) + strategyBalance();
        return IERC20(asset()).balanceOf(address(this));
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // Emergency withdrawal -- bypass strategy, pull all assets back
    function emergencyWithdraw() external onlyOwner {
        // Implement based on strategy
        _pause();
    }
}
```

## Inflation attack protection

ERC-4626 vaults are vulnerable to share price inflation attacks on first deposit. Always add virtual shares:

```solidity
function _decimalsOffset() internal pure override returns (uint8) {
    return 6; // adds 10^6 virtual shares offset
}
```

OpenZeppelin's ERC4626 includes this offset mechanism in v5.

## Strategy integration pattern

```solidity
// For a lending protocol like Aave:
function _deployToStrategy(uint256 amount) internal {
    IERC20(asset()).approve(address(aavePool), amount);
    aavePool.supply(asset(), amount, address(this), 0);
}

function _withdrawFromStrategy(uint256 amount) internal {
    aavePool.withdraw(asset(), amount, address(this));
}

function totalAssets() public view override returns (uint256) {
    return IERC20(aToken).balanceOf(address(this));
}
```

## Audit flags specific to vaults

- Inflation attack: always add `_decimalsOffset()` override
- `totalAssets()` must be accurate -- stale values break share price
- Reentrancy on withdraw if strategy does external calls
- Fee-on-transfer assets: balance checks before and after deposit
- Strategy can be griefed if `totalAssets()` can be manipulated by attacker
- Withdrawal queue: if assets are deployed, instant withdrawal may fail

## Testing checklist

```solidity
- test_Deposit()
- test_Mint()
- test_Withdraw()
- test_Redeem()
- test_SharePriceAfterYield()
- test_TVLCapReverts()
- test_PauseBlocksDeposit()
- test_InflationAttack()
- test_ManagementFeeAccrues()
- testFuzz_DepositWithdraw(uint256 assets)
- testFuzz_MultipleDepositors(address[3] users, uint256[3] amounts)
```
