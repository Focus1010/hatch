# Hatch Skill - Vesting Contract

## Purpose

Guide the user through designing and writing a token vesting contract on Base. Covers linear vesting with cliff, multi-beneficiary vesting, and revocable grants.

## Questions to ask before writing code

If not already answered in the spec:

1. Who are the beneficiaries? (team, investors, treasury, advisors)
2. Is there a cliff period? (minimum time before any tokens unlock)
3. What is the total vesting duration after cliff?
4. Is vesting linear (drip) or milestone-based?
5. Can grants be revoked? (yes for employees, usually no for investors)
6. Should unvested tokens on revocation go back to treasury or be burned?
7. Are multiple grants per address allowed?
8. Does the owner need to fund the contract upfront or per grant?

## Standard linear vesting with cliff

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VestingVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    struct Grant {
        uint256 amount;         // total tokens granted
        uint256 claimed;        // tokens already claimed
        uint256 startTime;      // vesting start timestamp
        uint256 cliffDuration;  // seconds before first unlock
        uint256 vestDuration;   // total seconds of vesting (after cliff)
        bool revocable;
        bool revoked;
    }

    mapping(address => Grant[]) public grants;

    event GrantCreated(address indexed beneficiary, uint256 amount, uint256 cliff, uint256 duration);
    event TokensClaimed(address indexed beneficiary, uint256 grantIndex, uint256 amount);
    event GrantRevoked(address indexed beneficiary, uint256 grantIndex, uint256 unvested);

    error NoTokensVested();
    error GrantRevoked();
    error NotRevocable();

    constructor(address _token, address initialOwner) Ownable(initialOwner) {
        token = IERC20(_token);
    }

    function createGrant(
        address beneficiary,
        uint256 amount,
        uint256 cliffDuration,
        uint256 vestDuration,
        bool revocable
    ) external onlyOwner {
        require(amount > 0, "Zero amount");
        require(vestDuration > 0, "Zero duration");

        token.safeTransferFrom(msg.sender, address(this), amount);

        grants[beneficiary].push(Grant({
            amount: amount,
            claimed: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestDuration: vestDuration,
            revocable: revocable,
            revoked: false
        }));

        emit GrantCreated(beneficiary, amount, cliffDuration, vestDuration);
    }

    function vestedAmount(address beneficiary, uint256 grantIndex) public view returns (uint256) {
        Grant memory g = grants[beneficiary][grantIndex];
        if (g.revoked) return g.claimed;

        uint256 cliffEnd = g.startTime + g.cliffDuration;
        if (block.timestamp < cliffEnd) return 0;

        uint256 vestEnd = cliffEnd + g.vestDuration;
        if (block.timestamp >= vestEnd) return g.amount;

        uint256 elapsed = block.timestamp - cliffEnd;
        return g.amount * elapsed / g.vestDuration;
    }

    function claimable(address beneficiary, uint256 grantIndex) public view returns (uint256) {
        Grant memory g = grants[beneficiary][grantIndex];
        return vestedAmount(beneficiary, grantIndex) - g.claimed;
    }

    function claim(uint256 grantIndex) external nonReentrant {
        Grant storage g = grants[msg.sender][grantIndex];
        if (g.revoked) revert GrantRevoked();

        uint256 amount = claimable(msg.sender, grantIndex);
        if (amount == 0) revert NoTokensVested();

        g.claimed += amount;
        token.safeTransfer(msg.sender, amount);
        emit TokensClaimed(msg.sender, grantIndex, amount);
    }

    function claimAll() external nonReentrant {
        Grant[] storage userGrants = grants[msg.sender];
        for (uint256 i = 0; i < userGrants.length; i++) {
            if (userGrants[i].revoked) continue;
            uint256 amount = claimable(msg.sender, i);
            if (amount > 0) {
                userGrants[i].claimed += amount;
                token.safeTransfer(msg.sender, amount);
                emit TokensClaimed(msg.sender, i, amount);
            }
        }
    }

    function revokeGrant(address beneficiary, uint256 grantIndex) external onlyOwner {
        Grant storage g = grants[beneficiary][grantIndex];
        if (!g.revocable) revert NotRevocable();
        if (g.revoked) revert GrantRevoked();

        // Vest everything up to now so beneficiary keeps what they earned
        uint256 vested = vestedAmount(beneficiary, grantIndex);
        uint256 unvested = g.amount - vested;

        g.revoked = true;

        if (unvested > 0) {
            token.safeTransfer(owner(), unvested);
        }

        emit GrantRevoked(beneficiary, grantIndex, unvested);
    }

    function grantCount(address beneficiary) external view returns (uint256) {
        return grants[beneficiary].length;
    }
}
```

## Common vesting schedules

| Role | Cliff | Duration |
|---|---|---|
| Team | 12 months | 36 months |
| Seed investors | 6 months | 24 months |
| Advisors | 6 months | 18 months |
| Treasury | 0 | 48 months |
| Community | 0 | 24 months |

## Audit flags specific to vesting

- Revoke should vest up to current time, not claw back already-earned tokens
- Owner draining contract: `recoverToken` should be blocked for the vesting token itself
- Unbounded grant arrays per address: cap grants per beneficiary
- Timestamp manipulation: negligible risk for vesting (long time horizons), but note it
- Front-running revoke: beneficiary cannot claim between revoke check and revoke execution if checks-effects-interactions is followed correctly

## Testing checklist

```solidity
- test_CreateGrant()
- test_CliffBlocksClaim()
- test_ClaimAfterCliff()
- test_FullVestAfterDuration()
- test_LinearVestingMidway()
- test_RevokeGrant()
- test_RevokeNonRevocable()
- test_ClaimAll()
- testFuzz_VestedAmount(uint256 elapsed)
```
