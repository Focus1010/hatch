# Hatch Frontend - Farcaster Miniapp

## Purpose

Scaffold a Farcaster miniapp (formerly Frames v2) connected to deployed Base contracts.

## Stack

- Next.js 14+ (App Router)
- Farcaster MiniApp SDK (`@farcaster/miniapp-sdk`)
- wagmi v2 + viem
- OnchainKit (Coinbase) for Base-specific components
- TailwindCSS

## Setup

```bash
npx create-next-app@latest [app-name] --typescript --tailwind --app
cd [app-name]
npm install @farcaster/miniapp-sdk wagmi viem @coinbase/onchainkit
```

## Miniapp manifest

Create `public/.well-known/farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...",
    "signature": "..."
  },
  "frame": {
    "version": "1",
    "name": "[App Name]",
    "iconUrl": "https://[your-domain]/icon.png",
    "splashImageUrl": "https://[your-domain]/splash.png",
    "splashBackgroundColor": "#000000",
    "homeUrl": "https://[your-domain]"
  }
}
```

## Providers setup

```typescript
// app/providers.tsx
'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';

const config = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} chain={base}>
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## SDK initialization

```typescript
// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    sdk.actions.ready();
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return <YourApp />;
}
```

## Contract interaction pattern

```typescript
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';

export function useStake(amount: bigint) {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const stake = () => writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'stake',
    args: [amount],
  });

  return { stake, isLoading, isSuccess };
}
```

## Deployment

Deploy to Vercel:
```bash
npx vercel --prod
```

Then register at: https://warpcast.com/~/developers/mini-apps

## Design notes

- Dark background (#0a0a0a or similar) -- Farcaster native feel
- Keep primary actions reachable with one thumb
- Show wallet state clearly (connected / not connected)
- Optimistic UI for transactions -- show pending state immediately
- Use OnchainKit's `<Transaction>` component for standard flows
