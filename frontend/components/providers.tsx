'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { defineChain } from 'viem';

const queryClient = new QueryClient();

// Define Mantle Sepolia chain for Privy
const mantleSepoliaChain = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  network: 'mantle-sepolia',
  nativeCurrency: {
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MANTLE_RPC_URL ||
          'https://mantle-sepolia.drpc.org',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://explorer.sepolia.mantle.xyz',
    },
  },
  testnet: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    console.warn(
      'NEXT_PUBLIC_PRIVY_APP_ID is not set. PrivyProvider will not initialize correctly.',
    );
  }

  return (
    <PrivyProvider
      appId={appId ?? ''}
      config={{
        embeddedWallets: {
          createOnLogin: 'all-users',
          noPromptOnSignature: true,
          showWalletUIs: false,
        },
        defaultChain: mantleSepoliaChain,
        supportedChains: [mantleSepoliaChain],
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PrivyProvider>
  );
}
