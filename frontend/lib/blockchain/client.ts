import { createPublicClient, http } from 'viem';
import { mantleTestnet } from 'viem/chains';

// Create a public client for Mantle network
export const publicClient = createPublicClient({
  chain: mantleTestnet,
  transport: http('https://rpc.sepolia.mantle.xyz',),
});
