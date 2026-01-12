import { createPublicClient, http } from 'viem';
import { mantle } from 'viem/chains';

// Create a public client for Mantle network
export const publicClient = createPublicClient({
  chain: mantle,
  transport: http(process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz'),
});
