# Hatch Deployment - Base Mainnet

## Purpose

Deploy to Base mainnet. Only run this after Sepolia testing is complete and signed off.

## Hard gates

Do not proceed if any of the following are true:
- Audit report is missing or shows unresolved CRITICAL/HIGH issues
- Sepolia deployment was not completed and tested
- Owner/admin wallet is a single EOA with no multisig plan
- Contract has no way to pause in an emergency

If any gate is not met, stop and tell the user what needs to be resolved first.

## Pre-mainnet checklist

- [ ] All Sepolia tests passed
- [ ] Audit complete with no unresolved HIGH/CRITICAL
- [ ] Owner transferred to multisig (Safe at https://app.safe.global)
- [ ] Emergency pause function tested
- [ ] Frontend pointed at mainnet RPC + correct contract addresses
- [ ] Token approval flows tested
- [ ] Slippage / deadline params set correctly

## Deployment command

```bash
forge script script/Deploy.s.sol \
  --rpc-url base_mainnet \
  --broadcast \
  --verify \
  -vvvv
```

## Base Mainnet details

- Chain ID: 8453
- RPC: https://mainnet.base.org (public) or Alchemy/QuickNode
- Basescan: https://basescan.org
- Gas: check https://basescan.org/gastracker before deploying

## Post-deploy

- [ ] Verify on Basescan
- [ ] Transfer ownership to multisig
- [ ] Add to DeFiLlama / relevant trackers if applicable
- [ ] Announce on Farcaster / X with contract address
- [ ] Set up monitoring (OpenZeppelin Defender, Tenderly, or custom alerts)

## Monitoring setup

Recommend at minimum:
- Tenderly alert on `Transfer` events above threshold
- Alert on `OwnershipTransferred` or any role changes
- Alert on paused state change
