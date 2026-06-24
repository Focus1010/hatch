# Hatch Frontend - Web App (wagmi)

## Purpose

Scaffold a standard web dapp frontend connected to deployed Base contracts.

## Stack

- Next.js 14+ (App Router)
- wagmi v2 + viem
- OnchainKit for wallet connection + Base components
- TailwindCSS

## Setup

```bash
npx create-next-app@latest [app-name] --typescript --tailwind --app
cd [app-name]
npm install wagmi viem @tanstack/react-query @coinbase/onchainkit
```

## Config

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({ appName: '[Your App]' }),
    metaMask(),
    injected(),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
```

## Contract config pattern

```typescript
// lib/contracts.ts
export const STAKING_CONTRACT = {
  address: '[deployed-address]' as `0x${string}`,
  abi: [...] as const,
};
```

## Standard page structure

```
app/
  layout.tsx      ← providers, nav
  page.tsx        ← landing / home
  stake/
    page.tsx      ← main app action
  dashboard/
    page.tsx      ← user portfolio view
lib/
  wagmi.ts        ← config
  contracts.ts    ← ABIs + addresses
  utils.ts        ← formatting helpers
components/
  WalletButton.tsx
  StatsBar.tsx
  [Feature].tsx
```

## Wallet button (OnchainKit)

```typescript
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Avatar, Name } from '@coinbase/onchainkit/identity';

export function WalletButton() {
  return (
    <ConnectWallet>
      <Avatar className="h-6 w-6" />
      <Name />
    </ConnectWallet>
  );
}
```
