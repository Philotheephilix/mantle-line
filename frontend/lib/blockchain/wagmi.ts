import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mantle } from 'viem/chains';

export const config = getDefaultConfig({
  appName: 'Resolv',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mantle],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
