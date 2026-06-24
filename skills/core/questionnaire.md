# Hatch Questionnaire

## Purpose

Extract a clear, buildable spec from a raw idea. Run this before any architecture or code work.

## Rules

- Ask questions one group at a time, not all at once
- Be conversational, not form-like
- Infer what you can before asking
- If something is a standard pattern, say so and confirm rather than asking from scratch
- End with a written spec the user confirms before anything is built

## Question groups

### Group 1 - Core idea (always ask)

1. What does this do in one sentence? (if their description is vague, help them sharpen it)
2. Who is the target user -- crypto-native, general consumer, other protocols?
3. Is this meant to make money? If yes, how? (fees, token appreciation, subscription, other)

### Group 2 - Token (always ask)

4. Do you want to launch a token as part of this? (yes / no / not sure)
   - If yes: is it a governance token, a utility token, a memecoin, or a points system?
   - If yes: do you want a fair launch, bonding curve, or standard mint with vesting?
   - If not sure: explain the tradeoffs briefly and ask them to decide

### Group 3 - Chain and deployment (always ask)

5. Base mainnet only, or do you need multichain?
6. Do you want the contracts to be upgradeable? (explain tradeoffs if they are unsure)

### Group 4 - Category-specific questions

Load the relevant sub-questions based on the dapp category:

**DeFi / Yield:**
- What asset do users deposit?
- Where does the yield come from?
- Are there lock-up periods or is it flexible?
- Do you need liquidation logic?

**NFT project:**
- Fixed supply or open edition?
- Reveal mechanic (instant, delayed, on-chain)?
- Royalties on secondary sales?
- Utility beyond the NFT itself (staking, access, etc.)?

**DAO:**
- What decisions will the DAO govern?
- Token-weighted voting or one-member-one-vote?
- Timelock on execution?
- Multisig as a backup?

**Token launch:**
- Total supply?
- Allocation breakdown (team, community, treasury, investors)?
- Vesting schedules?
- Launch mechanism (Clanker, Uniswap pool, bonding curve)?

**Gaming:**
- What is on-chain vs off-chain?
- Is there an in-game currency?
- How do assets transfer between players?
- Is there a house / protocol fee?

**Farcaster miniapp:**
- Frame-based or full miniapp?
- Does it need a wallet connection?
- Is it tied to a specific cast or is it standalone?

### Group 5 - Frontend (always ask last)

- Do you need a frontend, or is this a protocol/contract-only build?
- If yes: full web app, Farcaster miniapp, or both?
- Do you have a design direction in mind or do you want Hatch to decide?

## Output format

After all questions are answered, produce a spec in this format:

```
HATCH SPEC
----------
Project: [name]
Category: [category]
One-liner: [what it does]
Target user: [who]

Contracts needed:
- [contract name]: [what it does]
- ...

Token: [yes/no + details]
Launch mechanism: [if applicable]

Upgradeability: [yes/no + proxy pattern if yes]
Chain: Base mainnet (via Sepolia testnet first)

Frontend: [yes/no + type]

Open questions:
- [anything unresolved]

Ready to build? (yes / change something)
```

Do not proceed past this spec until the user confirms.
