import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Chain } from 'viem';
import type { Config } from 'wagmi';

export const mantleSepoliaChain: Chain = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
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
};

let config: Config | null = null;

export function getConfig(): Config {
  if (typeof window === 'undefined') {
    // During SSR/build, return a dummy config that won't be used
    // This prevents browser API access during build
    throw new Error('Wagmi config should only be accessed on the client side');
  }
  
  if (!config) {
    config = getDefaultConfig({
      appName: 'Resolv',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
      chains: [mantleSepoliaChain],
      ssr: false,
    }) as Config;
  }
  
  return config;
}
