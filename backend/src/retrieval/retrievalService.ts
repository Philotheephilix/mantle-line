import { PriceWindowPayload, LiquidationRequest, LiquidationResult } from '../types/index.js';
import { ContractStorage } from '../contract/contractStorage.js';
import { EigenDASubmitter } from '../eigenda/eigendaSubmitter.js';
import { PriceAggregator } from '../aggregator/priceAggregator.js';
import logger from '../utils/logger.js';

export class RetrievalService {
  private contractStorage: ContractStorage;
  private eigenDASubmitter: EigenDASubmitter;

  constructor(
    contractStorage: ContractStorage,
    eigenDASubmitter: EigenDASubmitter
  ) {
    this.contractStorage = contractStorage;
    this.eigenDASubmitter = eigenDASubmitter;
  }

  /**
   * Get the latest price window
   */
  public async getLatestWindow(): Promise<PriceWindowPayload | null> {
    try {
      const latestWindowTimestamp = await this.contractStorage.getLatestWindow();
      
      if (latestWindowTimestamp === 0) {
        logger.info('No windows stored yet');
        return null;
      }

      return await this.getWindow(latestWindowTimestamp);
    } catch (error) {
      logger.error('Failed to get latest window', error);
      throw error;
    }
  }

  /**
   * Get a specific price window by timestamp
   */
  public async getWindow(windowStart: number): Promise<PriceWindowPayload | null> {
    try {
      logger.info('Retrieving window', { windowStart });

      // Get commitment from contract
      const commitment = await this.contractStorage.getCommitment(windowStart);

      if (commitment === '0x' + '0'.repeat(64)) {
        logger.warn('No commitment found for window', { windowStart });
        return null;
      }

      // Retrieve data from EigenDA
      const payload = await this.eigenDASubmitter.retrieveData(commitment);

      logger.info('Window retrieved successfully', {
        windowStart,
        priceCount: payload.prices.length,
        twap: payload.twap
      });

      return payload;
    } catch (error) {
      logger.error('Failed to retrieve window', { windowStart, error });
      throw error;
    }
  }

  /**
   * Get multiple windows in a time range
   */
  public async getWindowsInRange(start: number, end: number): Promise<PriceWindowPayload[]> {
    try {
      logger.info('Retrieving windows in range', { start, end });

      // Get window timestamps from contract
      const windowTimestamps = await this.contractStorage.getWindowsInRange(start, end);

      if (windowTimestamps.length === 0) {
        logger.info('No windows found in range', { start, end });
        return [];
      }

      // Retrieve all windows in parallel
      const windows = await Promise.all(
        windowTimestamps.map(timestamp => this.getWindow(timestamp))
      );

      // Filter out null values
      const validWindows = windows.filter((w): w is PriceWindowPayload => w !== null);

      logger.info('Windows retrieved successfully', {
        start,
        end,
        count: validWindows.length
      });

      return validWindows;
    } catch (error) {
      logger.error('Failed to retrieve windows in range', { start, end, error });
      throw error;
    }
  }

  /**
   * Get price history for a lookback period (in minutes)
   */
  public async getPriceHistory(lookbackMinutes: number): Promise<number[]> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const start = now - (lookbackMinutes * 60);
      
      // Align to minute boundaries
      const startWindow = Math.floor(start / 60) * 60;
      const endWindow = Math.floor(now / 60) * 60;

      const windows = await this.getWindowsInRange(startWindow, endWindow);

      // Flatten all prices from all windows
      const allPrices = windows.flatMap(w => w.prices);

      logger.info('Price history retrieved', {
        lookbackMinutes,
        windowCount: windows.length,
        priceCount: allPrices.length
      });

      return allPrices;
    } catch (error) {
      logger.error('Failed to get price history', { lookbackMinutes, error });
      throw error;
    }
  }

  /**
   * Calculate liquidation price based on historical volatility
   */
  public async calculateLiquidation(request: LiquidationRequest): Promise<LiquidationResult> {
    try {
      logger.info('Calculating liquidation price', request);

      // Get historical prices
      const prices = await this.getPriceHistory(request.lookbackMinutes);

      if (prices.length === 0) {
        throw new Error('No price data available for liquidation calculation');
      }

      // Calculate volatility (standard deviation)
      const stdDev = PriceAggregator.calculateStdDev(prices);
      const mean = PriceAggregator.calculateTWAPStatic(prices);
      const volatilityPercent = (stdDev / mean) * 100;

      // Calculate price range
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      // Calculate liquidation price
      // Formula: entryPrice - (entryPrice / leverage) - (volatility buffer)
      const leverageBuffer = request.entryPrice / request.leverage;
      const volatilityBuffer = stdDev * 2; // 2 standard deviations
      const liqPrice = request.entryPrice - leverageBuffer - volatilityBuffer;

      const result: LiquidationResult = {
        liqPrice: Math.max(0, liqPrice), // Ensure non-negative
        volatility: volatilityPercent,
        priceRange: { min, max }
      };

      logger.info('Liquidation calculated', {
        request,
        result
      });

      return result;
    } catch (error) {
      logger.error('Failed to calculate liquidation', { request, error });
      throw error;
    }
  }

  /**
   * Get summary statistics for recent windows
   */
  public async getSummaryStats(windowCount: number = 10): Promise<{
    avgTwap: number;
    avgVolatility: number;
    minPrice: number;
    maxPrice: number;
    windowCount: number;
  }> {
    try {
      const latestWindowTimestamp = await this.contractStorage.getLatestWindow();
      
      if (latestWindowTimestamp === 0) {
        throw new Error('No windows available');
      }

      const startWindow = latestWindowTimestamp - (windowCount * 60);
      const windows = await this.getWindowsInRange(startWindow, latestWindowTimestamp);

      if (windows.length === 0) {
        throw new Error('No windows found');
      }

      const avgTwap = windows.reduce((sum, w) => sum + w.twap, 0) / windows.length;
      const avgVolatility = windows.reduce((sum, w) => sum + w.volatility, 0) / windows.length;
      
      const allPrices = windows.flatMap(w => w.prices);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);

      return {
        avgTwap,
        avgVolatility,
        minPrice,
        maxPrice,
        windowCount: windows.length
      };
    } catch (error) {
      logger.error('Failed to get summary stats', error);
      throw error;
    }
  }
}

export default RetrievalService;

