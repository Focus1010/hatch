# Hatch Architecture

## Purpose

Take a confirmed Hatch spec and produce a concrete contract architecture before writing any code.

## Process

### Step 1 - Contract inventory

List every contract needed with:
- Contract name
- Inherits from (OpenZeppelin base if applicable)
- Key state variables
- Key functions (external interface only)
- Who can call what (access control map)

### Step 2 - Contract relationships

Draw the dependency graph:
- Which contracts call which
- Where tokens flow
- Where permissions are checked

Use ASCII diagrams:

```
User
 └─→ StakingVault.deposit()
       └─→ RewardToken.mint()
       └─→ NFT.ownerOf() [read]
```

### Step 3 - Storage layout

For each contract, list the storage slots that matter for:
- Upgradeability (if using proxy pattern)
- Gas optimization
- Attack surface (anything that tracks balances or permissions)

### Step 4 - Event map

List all events that need to be emitted for:
- Frontend indexing
- Subgraph / The Graph compatibility
- Audit trail

### Step 5 - Confirm before coding

Present the full architecture to the user. Get confirmation on:
- Contract count and names
- Access control decisions
- Any tradeoffs made (e.g. gas vs flexibility)

## Standards to default to

- OpenZeppelin v5 contracts
- Foundry for testing
- Solidity ^0.8.24
- UUPS proxy if upgradeability is needed (not Transparent -- explain why if asked)
- EIP-2981 for royalties
- EIP-4626 for vaults
- EIP-712 for typed signatures

## Red flags to call out

If the spec has any of these, flag them before architecture:
- Centralized admin with no timelock on critical functions
- Mint functions with no cap
- Fee-on-transfer tokens interacting with AMMs
- Oracle dependence without fallback
- Cross-contract calls with unchecked return values
