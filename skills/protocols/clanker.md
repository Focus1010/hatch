# Hatch Skill - Clanker

## Purpose

Guide the user through launching a token via Clanker on Base. Clanker is a token deployment protocol native to Farcaster and Base that handles ERC-20 deployment, Uniswap v3 pool creation, and initial liquidity in a single transaction triggered by a Farcaster cast.

## What Clanker does for you

- Deploys a standard ERC-20 token contract
- Creates a Uniswap v3 pool paired with WETH
- Seeds initial liquidity from the cast author's ETH
- Distributes LP fees between the creator and Clanker protocol
- Locks liquidity permanently (no rug pull)

## What Clanker does NOT do

- Custom tokenomics (vesting, emissions schedules, bonding curves)
- Governance functionality
- Staking or utility logic
- Custom mint/burn mechanics

If the user needs any of those, they need a custom contract + Clanker is not the right tool. Redirect to the relevant contract skill.

## Launch flow via Farcaster cast

The simplest Clanker launch is a cast. Tell the user:

1. Go to Warpcast (warpcast.com) or any Farcaster client
2. Tag @clanker in a cast with the following format:

```
@clanker deploy

Name: [Token Name]
Symbol: $[SYMBOL]
Image: [attach an image or leave blank]
```

3. Clanker bot replies with the deployed contract address and Uniswap pool link
4. The creator receives LP fee share automatically

## Clanker API launch (programmatic)

For apps that want to trigger Clanker deployments programmatically:

```typescript
// Clanker v3 API
const response = await fetch("https://www.clanker.world/api/deploy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.CLANKER_API_KEY,
  },
  body: JSON.stringify({
    name: "Token Name",
    symbol: "SYMBOL",
    image: "https://your-image-url.com/image.png",
    requestorAddress: "0x...", // deployer wallet
    // optional
    description: "Token description",
    socialMediaUrls: ["https://warpcast.com/yourprofile"],
  }),
});

const { contractAddress, poolAddress, txHash } = await response.json();
```

Get a Clanker API key at: https://www.clanker.world/

## Fee structure

Clanker splits LP fees from the Uniswap pool:
- 40% to token creator
- 40% to the person who deployed (if via API, can be same as creator)
- 20% to Clanker protocol

These fees accrue automatically and can be claimed from the Clanker dashboard.

## After Clanker launch

Once deployed, the token is a standard ERC-20 on Base. From here the user can:

- Add custom staking on top -- load `contracts/staking`
- Build a Farcaster miniapp around it -- load `frontend/miniapp`
- Build governance on top -- load `contracts/governance`
- The token contract itself cannot be modified post-deploy

## Clanker vs custom ERC-20

Help the user decide:

| | Clanker | Custom ERC-20 |
|---|---|---|
| Speed | Minutes | Hours |
| Cost | Gas only | Gas + dev time |
| Liquidity | Auto-seeded | Manual |
| Customization | None | Full |
| Rug risk | None (locked LP) | Depends on implementation |
| Farcaster native | Yes | No |

## Clanker contract addresses (Base mainnet)

- Clanker v3: `0x375B20AF7541A7762a05D09E3C3A1C4e69F61B1e`
- Always verify current addresses at: https://www.clanker.world/docs

## Common questions

**Can I add vesting to a Clanker token?**
No -- Clanker mints 100% of supply to the Uniswap pool at launch. There is no allocation for team/vesting.

**Can I airdrop a Clanker token?**
Only after buying from the pool. There is no pre-mine.

**Can I change the fee recipient?**
The fee recipient is set at deploy time and is immutable.
