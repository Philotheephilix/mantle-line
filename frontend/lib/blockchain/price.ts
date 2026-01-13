/**
 * Calculate price from Merchant Moe Liquidity Book reserves
 * For WMNT/USDT pair on Mantle:
 * - reserveX (reserve0) is WMNT with 18 decimals
 * - reserveY (reserve1) is USDT with 6 decimals
 *
 * Price of WMNT in USDT = (reserveY / 10^6) / (reserveX / 10^18)
 */
export function calculatePrice(reserveX: bigint, reserveY: bigint): number {
  if (reserveX === BigInt(0) || reserveY === BigInt(0)) {
    throw new Error('Invalid reserves: cannot be zero');
  }

  // WMNT has 18 decimals, USDT has 6 decimals
  const WMNT_DECIMALS = 18;
  const USDT_DECIMALS = 6;

  // Convert reserves to float with proper decimal handling
  const wmntReserve = Number(reserveX) / Math.pow(10, WMNT_DECIMALS);
  const usdtReserve = Number(reserveY) / Math.pow(10, USDT_DECIMALS);

  // Calculate price: USDT per WMNT
  const price = usdtReserve / wmntReserve;

  return price;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price === 0) return '0.00';
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
}
