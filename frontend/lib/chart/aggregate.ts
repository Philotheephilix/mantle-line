import type { PricePoint } from '@/types/price';

/**
 * Aggregate price data into 5-minute intervals
 * Groups ticks by 5-minute windows and uses the last price (close) of each interval
 */
export function aggregateTo5Minutes(data: PricePoint[]): PricePoint[] {
  if (data.length === 0) return [];

  // Group data points by 5-minute intervals
  const intervals = new Map<number, PricePoint[]>();
  
  // 5 minutes in seconds
  const INTERVAL_SIZE = 300;

  data.forEach((point) => {
    // Round timestamp down to nearest 5-minute interval
    const intervalKey = Math.floor(point.time / INTERVAL_SIZE) * INTERVAL_SIZE;
    
    if (!intervals.has(intervalKey)) {
      intervals.set(intervalKey, []);
    }
    intervals.get(intervalKey)!.push(point);
  });

  // For each interval, use the last price (close price) of that interval
  const aggregated: PricePoint[] = [];
  
  Array.from(intervals.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([intervalKey, points]) => {
      // Use the last price in the interval as the close price
      const lastPoint = points[points.length - 1];
      aggregated.push({
        time: intervalKey,
        value: lastPoint.value,
      });
    });

  return aggregated;
}


