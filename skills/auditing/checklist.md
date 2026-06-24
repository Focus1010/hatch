# Hatch Auditing Checklist

## Purpose

Run a structured security review on completed contracts before deployment. This is non-negotiable -- never skip to deployment without completing this phase.

## How to run this

Go through every item. For each one:
- Mark PASS / FAIL / N/A
- If FAIL: describe the issue and provide the fix
- Do not move to deployment until all FAIL items are resolved

---

## Access Control

- [ ] All privileged functions have `onlyOwner` or role-based access
- [ ] Owner is not a single EOA on mainnet (should be multisig or timelock)
- [ ] `renounceOwnership` cannot brick the contract
- [ ] Role assignments are logged with events
- [ ] No function allows arbitrary `delegatecall` or `call` to user-supplied addresses

## Reentrancy

- [ ] All external calls follow checks-effects-interactions pattern
- [ ] ReentrancyGuard applied to any function that transfers ETH or tokens
- [ ] No state changes after external calls
- [ ] ERC-777 / callback tokens not assumed to be safe in balances

## Arithmetic

- [ ] Solidity 0.8+ used (overflow/underflow protection built in)
- [ ] Division rounding direction is intentional (round down for user withdrawals, round up for fees)
- [ ] No precision loss in reward calculations (use 1e18 scaling)
- [ ] uint256 used for token amounts, not uint128 or smaller without justification

## Token interactions

- [ ] ERC-20 `transfer` return value checked (or use SafeERC20)
- [ ] No assumption that balanceOf == internal accounting (rebasing tokens)
- [ ] Fee-on-transfer tokens handled if users can deposit arbitrary tokens
- [ ] Slippage protection on swaps

## Oracle / price feeds

- [ ] No single oracle as sole price source
- [ ] TWAP used instead of spot price where manipulation is a concern
- [ ] Stale price check on Chainlink feeds (`updatedAt` timestamp)
- [ ] Circuit breaker if price moves beyond threshold

## Flash loan attack surface

- [ ] No governance actions executable in single transaction
- [ ] No price-sensitive logic readable from same block as deposit
- [ ] Snapshot-based voting if using token-weighted governance

## Upgrades (if applicable)

- [ ] Storage layout documented and frozen
- [ ] Initializer protected with `initializer` modifier
- [ ] No constructor logic in upgradeable contracts
- [ ] Upgrade function behind timelock

## Deployment hygiene

- [ ] Constructor arguments verified post-deploy
- [ ] Proxy admin ownership transferred from deployer
- [ ] No hardcoded addresses (use config / immutables)
- [ ] Contract verified on Basescan

## Events

- [ ] All state-changing functions emit events
- [ ] Indexed parameters on events used for filtering
- [ ] No sensitive data emitted in events

## Gas

- [ ] No unbounded loops over user-supplied arrays
- [ ] Mappings used instead of arrays where deletion is needed
- [ ] Storage reads cached in memory inside loops

---

## Output

Produce a report in this format:

```
HATCH AUDIT REPORT
------------------
Contract: [name]
Date: [today]

PASS: [N] checks
FAIL: [N] checks
N/A:  [N] checks

Issues found:
[severity: CRITICAL / HIGH / MEDIUM / LOW]
- [issue description]
  Fix: [specific fix]

Cleared for deployment: YES / NO
```

Do not mark "Cleared for deployment: YES" if any CRITICAL or HIGH issues remain.
