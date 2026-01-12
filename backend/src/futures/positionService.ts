import { FuturesContractStorage, Position } from '../contract/futuresContractStorage.js';
import { PredictionService } from './predictionService.js';
import { PNLCalculator, PNLResult } from '../pnl/pnlCalculator.js';
import { EigenDASubmitter } from '../eigenda/eigendaSubmitter.js';
import { ContractStorage } from '../contract/contractStorage.js';
import { RetrievalService } from '../retrieval/retrievalService.js';
import logger from '../utils/logger.js';

/**
 * Position close result
 */
export interface PositionCloseResult {
  success: boolean;
  positionId: number;
  user: string;
  amount: string;
  leverage: number;
  pnl: string;
  fee: string;
  finalAmount: string;
  accuracy: number;
  correctDirections: number;
  totalDirections: number;
  priceMovement: string;
  maxProfit: string;
  actualPriceCommitmentId: string;
  transaction: {
    hash: string;
    blockNumber?: number;
    gasUsed?: string;
  };
  closedAt: number;
}

/**
 * Position details with analytics
 */
export interface PositionDetails extends Position {
  predictions?: number[];
  actualPrices?: number[];
  analytics?: {
    accuracy: number;
    correctDirections: number;
    totalDirections: number;
    priceMovement: number;
    maxProfit: number;
    fee: number;
  };
}

/**
 * Position Service
 * Manages positions, retrieval, and closing
 */
export class PositionService {
  private futuresContract: FuturesContractStorage;
  private predictionService: PredictionService;
  private pnlCalculator: PNLCalculator;
  private eigenDASubmitter: EigenDASubmitter;
  private oracleContract: ContractStorage;
  private retrievalService: RetrievalService;

  constructor(
    futuresContract: FuturesContractStorage,
    predictionService: PredictionService,
    pnlCalculator: PNLCalculator,
    eigenDASubmitter: EigenDASubmitter,
    oracleContract: ContractStorage,
    retrievalService: RetrievalService
  ) {
    this.futuresContract = futuresContract;
    this.predictionService = predictionService;
    this.pnlCalculator = pnlCalculator;
    this.eigenDASubmitter = eigenDASubmitter;
    this.oracleContract = oracleContract;
    this.retrievalService = retrievalService;

    logger.info('PositionService initialized');
  }

  /**
   * Get position by ID
   */
  public async getPosition(positionId: number): Promise<Position> {
    try {
      logger.debug('Getting position', { positionId });
      return await this.futuresContract.getPosition(positionId);
    } catch (error) {
      logger.error('Failed to get position', { positionId, error });
      throw error;
    }
  }

  /**
   * Get position with full details including predictions and analytics
   */
  public async getPositionDetails(
    positionId: number,
    includePredictions: boolean = false,
    includeAnalytics: boolean = true
  ): Promise<PositionDetails> {
    try {
      logger.debug('Getting position details', {
        positionId,
        includePredictions,
        includeAnalytics
      });

      const position = await this.getPosition(positionId);
      const details: PositionDetails = { ...position };

      // Retrieve predictions if requested
      if (includePredictions && position.predictionCommitmentId) {
        try {
          const predictionBlob = await this.predictionService.retrievePredictions(
            position.predictionCommitmentId
          );
          details.predictions = predictionBlob.predictions;
        } catch (error) {
          logger.warn('Failed to retrieve predictions', { positionId, error });
        }
      }

      // Retrieve actual prices and calculate analytics if position is closed
      if (includeAnalytics && !position.isOpen && position.actualPriceCommitmentId) {
        try {
          // Get actual prices from oracle
          const actualPriceData = await this.eigenDASubmitter.retrieveData(
            position.actualPriceCommitmentId
          );
          details.actualPrices = actualPriceData.prices;

          // Calculate analytics if we have both predictions and actual prices
          if (details.predictions && details.actualPrices) {
            const pnlResult = this.pnlCalculator.calculatePNL(
              details.predictions,
              details.actualPrices,
              Number(position.amount.toString()),
              position.leverage,
              200 // Default fee percentage
            );

            details.analytics = {
              accuracy: pnlResult.accuracy,
              correctDirections: pnlResult.correctDirections,
              totalDirections: pnlResult.totalDirections,
              priceMovement: pnlResult.priceMovement,
              maxProfit: pnlResult.maxProfit,
              fee: pnlResult.fee
            };
          }
        } catch (error) {
          logger.warn('Failed to calculate analytics', { positionId, error });
        }
      }

      return details;
    } catch (error) {
      logger.error('Failed to get position details', { positionId, error });
      throw error;
    }
  }

  /**
   * Get all positions for a user
   */
  public async getUserPositions(userAddress: string): Promise<number[]> {
    try {
      logger.debug('Getting user positions', { userAddress });
      return await this.futuresContract.getUserPositions(userAddress);
    } catch (error) {
      logger.error('Failed to get user positions', { userAddress, error });
      throw error;
    }
  }

  /**
   * Get all open positions
   */
  public async getOpenPositions(): Promise<number[]> {
    try {
      logger.debug('Getting open positions');
      return await this.futuresContract.getOpenPositions();
    } catch (error) {
      logger.error('Failed to get open positions', error);
      throw error;
    }
  }

  /**
   * Check if position can be closed
   */
  public async canClosePosition(positionId: number): Promise<boolean> {
    try {
      return await this.futuresContract.canClosePosition(positionId);
    } catch (error) {
      logger.error('Failed to check if position can be closed', { positionId, error });
      throw error;
    }
  }

  /**
   * Close a position (full workflow)
   */
  public async closePosition(positionId: number): Promise<PositionCloseResult> {
    try {
      logger.info('Starting position close workflow', { positionId });

      // Step 1: Fetch position from contract
      const position = await this.getPosition(positionId);

      // Step 2: Validate position is closable
      if (!position.isOpen) {
        throw new Error('Position is already closed');
      }

      const canClose = await this.canClosePosition(positionId);
      if (!canClose) {
        const elapsed = Math.floor(Date.now() / 1000) - Number(position.openTimestamp);
        const remaining = 60 - elapsed;
        throw new Error(`Position cannot be closed yet. ${remaining} seconds remaining`);
      }

      // Step 3: Retrieve user predictions from EigenDA
      logger.info('Retrieving user predictions', {
        positionId,
        commitmentId: position.predictionCommitmentId
      });

      const predictionBlob = await this.predictionService.retrievePredictions(
        position.predictionCommitmentId
      );
      const predictions = predictionBlob.predictions;

      // Step 4: Get actual price data for the position's time window
      const windowStart = Math.floor(Number(position.openTimestamp) / 60) * 60;
      
      logger.info('Retrieving actual prices', {
        positionId,
        windowStart
      });

      // Use RetrievalService to get the full price window data
      const actualPriceWindow = await this.retrievalService.getWindow(windowStart);
      
      if (!actualPriceWindow) {
        throw new Error('Actual price data not found for position window');
      }

      const actualPrices = actualPriceWindow.prices;
      const actualPriceCommitmentId = await this.oracleContract.getCommitment(windowStart);

      if (actualPrices.length !== 60) {
        throw new Error(`Invalid actual prices length: ${actualPrices.length}, expected 60`);
      }

      // Step 5: Calculate PNL
      logger.info('Calculating PNL', { positionId });

      const pnlResult = this.pnlCalculator.calculatePNL(
        predictions,
        actualPrices,
        Number(position.amount.toString()),
        position.leverage,
        200 // 2% fee
      );

      logger.info('PNL calculated', {
        positionId,
        pnl: pnlResult.pnl,
        accuracy: `${(pnlResult.accuracy * 100).toFixed(2)}%`,
        correctDirections: `${pnlResult.correctDirections}/${pnlResult.totalDirections}`
      });

      // Step 6: Call contract closePosition()
      logger.info('Closing position on contract', {
        positionId,
        pnl: pnlResult.pnl,
        actualPriceCommitmentId
      });

      const txHash = await this.futuresContract.closePosition(
        positionId,
        BigInt(pnlResult.pnl),
        actualPriceCommitmentId
      );

      // Step 7: Return result
      const result: PositionCloseResult = {
        success: true,
        positionId,
        user: position.user,
        amount: position.amount.toString(),
        leverage: position.leverage,
        pnl: pnlResult.pnl.toString(),
        fee: pnlResult.fee.toString(),
        finalAmount: pnlResult.finalAmount.toString(),
        accuracy: pnlResult.accuracy,
        correctDirections: pnlResult.correctDirections,
        totalDirections: pnlResult.totalDirections,
        priceMovement: pnlResult.priceMovement.toString(),
        maxProfit: pnlResult.maxProfit.toString(),
        actualPriceCommitmentId: actualPriceCommitmentId,
        transaction: {
          hash: txHash
        },
        closedAt: Math.floor(Date.now() / 1000)
      };

      logger.info('Position closed successfully', {
        positionId,
        txHash,
        pnl: result.pnl,
        finalAmount: result.finalAmount
      });

      return result;
    } catch (error) {
      logger.error('Failed to close position', { 
        positionId, 
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStats(userAddress: string): Promise<{
    totalPositions: number;
    openPositions: number;
    closedPositions: number;
    totalPnl: string;
  }> {
    try {
      const stats = await this.futuresContract.getUserStats(userAddress);
      
      return {
        totalPositions: stats.totalPositions,
        openPositions: stats.openPositions,
        closedPositions: stats.closedPositions,
        totalPnl: stats.totalPnl.toString()
      };
    } catch (error) {
      logger.error('Failed to get user stats', { userAddress, error });
      throw error;
    }
  }
}

export default PositionService;

