// Merchant Moe Liquidity Book Pair ABI (minimal - just getReserves)
// Liquidity Book uses uint128 and returns only 2 values (no blockTimestampLast)
export const PAIR_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { internalType: 'uint128', name: 'reserveX', type: 'uint128' },
      { internalType: 'uint128', name: 'reserveY', type: 'uint128' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getTokenX',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getTokenY',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Merchant Moe MNT/USDC pair on Mantle
// TODO: Replace with actual Merchant Moe pair address
export const PAIR_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_PAIR_CONTRACT_ADDRESS as `0x${string}`) ||
  '0x0000000000000000000000000000000000000000';
