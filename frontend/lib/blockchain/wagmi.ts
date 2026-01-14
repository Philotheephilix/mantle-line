import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mantle } from 'viem/chains';
import type { Config } from 'wagmi';

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
      chains: [mantle],
      ssr: false,
    }) as Config;
  }
  
  return config;
}
