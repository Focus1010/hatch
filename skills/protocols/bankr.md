# Hatch Skill - Bankr

## Purpose

Guide the user through launching and managing tokens via Bankr on Base. Bankr is a social token launchpad and trading platform built for Farcaster, focused on creator tokens and community coins.

## What Bankr does

- Token launches with bonding curve mechanics
- Social token creation tied to Farcaster identity
- Built-in trading interface for token holders
- Creator monetization through trading fees
- Integration with Farcaster social graph for distribution

## Bankr vs Clanker

| | Bankr | Clanker |
|---|---|---|
| Launch mechanic | Bonding curve | Uniswap v3 pool |
| Liquidity | Gradual (curve) | Instant pool |
| Price discovery | Curve-based | Market-based |
| Social integration | Deep Farcaster | Farcaster cast |
| Fee model | Creator fee on trades | LP fee share |
| Graduation | Graduates to DEX | Already on DEX |

Use Bankr when the user wants a gradual price discovery mechanism or creator-focused token. Use Clanker when they want immediate DEX liquidity.

## Launch flow

1. Go to https://bankr.bot
2. Connect Farcaster account
3. Fill in token details:
   - Name, symbol, image
   - Description
   - Initial buy (optional -- creator can buy first)
4. Confirm and deploy

## Programmatic integration

Bankr exposes a bot interface via Farcaster. To trigger a launch via cast:

```
@bankr create

Name: [Token Name]
Ticker: $[SYMBOL]
```

For API integration, check current documentation at https://bankr.bot/docs as the API evolves frequently.

## After Bankr launch

Post-launch, the token is a standard ERC-20. You can build on top of it:

- Staking rewards for holders -- load `contracts/staking`
- Holder-gated content / access -- load `frontend/miniapp`
- Trading bot for monitoring -- reference PhantomEdge architecture

## Monitoring a Bankr token

Track new launches and price movements:
- DexScreener: https://dexscreener.com/base
- GeckoTerminal: https://www.geckoterminal.com/base
- Bankr dashboard: https://bankr.bot

## Common questions

**Can I set a custom bonding curve?**
No -- Bankr uses its own curve. For a custom curve, use `contracts/bonding-curve`.

**What happens at graduation?**
When the bonding curve reaches its target, liquidity graduates to a DEX (typically Uniswap or Aerodrome on Base).

**Can I integrate Bankr launches into my dapp?**
Yes, via the Bankr API. Check current docs as endpoints change.

**Is the contract audited?**
Bankr contracts are maintained by the Bankr team. Do not assume audit status -- direct users to check Bankr's official security disclosures.
