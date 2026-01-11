import { PriceIngester } from './ingester/priceIngester.js';
import { PriceAggregator } from './aggregator/priceAggregator.js';
import { EigenDASubmitter } from './eigenda/eigendaSubmitter.js';
import { ContractStorage } from './contract/contractStorage.js';
import { RetrievalService } from './retrieval/retrievalService.js';
import { Orchestrator } from './orchestrator/orchestrator.js';
import { HealthMonitor } from './monitor/healthMonitor.js';
import { APIServer } from './api/server.js';
import logger from './utils/logger.js';
import config from './config/config.js';

/**
 * Main application class
 */
class MNTPriceOracleApp {
  private ingester: PriceIngester;
  private aggregator: PriceAggregator;
  private eigenDASubmitter: EigenDASubmitter;
  private contractStorage: ContractStorage;
  private retrievalService: RetrievalService;
  private orchestrator: Orchestrator;
  private healthMonitor: HealthMonitor;
  private apiServer: APIServer;

  constructor() {
    logger.info('Initializing MNT Price Oracle', {
      network: config.network,
      contractAddress: config.contractAddress
    });

    // Initialize components
    this.ingester = new PriceIngester();
    this.aggregator = new PriceAggregator();
    this.eigenDASubmitter = new EigenDASubmitter();
    this.contractStorage = new ContractStorage();
    
    this.retrievalService = new RetrievalService(
      this.contractStorage,
      this.eigenDASubmitter
    );

    this.orchestrator = new Orchestrator(
      this.ingester,
      this.aggregator,
      this.eigenDASubmitter,
      this.contractStorage
    );

    this.healthMonitor = new HealthMonitor(
      this.orchestrator,
      this.contractStorage
    );

    this.apiServer = new APIServer(
      this.retrievalService,
      this.healthMonitor,
      this.orchestrator
    );

    this.setupSignalHandlers();
  }

  /**
   * Start the application
   */
  public async start(): Promise<void> {
    try {
      logger.info('Starting MNT Price Oracle application');

      // Start orchestrator (includes ingester)
      await this.orchestrator.start();

      // Start health monitor
      this.healthMonitor.start();

      // Start API server
      await this.apiServer.start();

      logger.info('MNT Price Oracle application started successfully');
      logger.info('API available at', {
        url: `http://${config.apiHost}:${config.port}`
      });

    } catch (error) {
      logger.error('Failed to start application', error);
      throw error;
    }
  }

  /**
   * Stop the application
   */
  public async stop(): Promise<void> {
    logger.info('Stopping MNT Price Oracle application');

    try {
      // Stop API server
      await this.apiServer.stop();

      // Stop health monitor
      this.healthMonitor.stop();

      // Stop orchestrator
      this.orchestrator.stop();

      logger.info('MNT Price Oracle application stopped successfully');
    } catch (error) {
      logger.error('Error stopping application', error);
      throw error;
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });
  }
}

// Start the application if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new MNTPriceOracleApp();
  
  app.start().catch((error) => {
    logger.error('Fatal error during startup', error);
    process.exit(1);
  });
}

export default MNTPriceOracleApp;

