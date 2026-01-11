import express, { Request, Response, NextFunction } from 'express';
import { RetrievalService } from '../retrieval/retrievalService.js';
import { HealthMonitor } from '../monitor/healthMonitor.js';
import { Orchestrator } from '../orchestrator/orchestrator.js';
import { LiquidationRequest } from '../types/index.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

export class APIServer {
  private app: express.Application;
  private retrievalService: RetrievalService;
  private healthMonitor: HealthMonitor;
  private orchestrator: Orchestrator;
  private server: any = null;

  constructor(
    retrievalService: RetrievalService,
    healthMonitor: HealthMonitor,
    orchestrator: Orchestrator
  ) {
    this.app = express();
    this.retrievalService = retrievalService;
    this.healthMonitor = healthMonitor;
    this.orchestrator = orchestrator;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json());

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      logger.info('API request', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', this.handleHealth.bind(this));

    // Get latest price window
    this.app.get('/api/latest', this.handleLatest.bind(this));

    // Get specific window by timestamp
    this.app.get('/api/window/:timestamp', this.handleWindow.bind(this));

    // Get price history
    this.app.get('/api/history', this.handleHistory.bind(this));

    // Calculate liquidation price
    this.app.post('/api/liquidation', this.handleLiquidation.bind(this));

    // Get summary statistics
    this.app.get('/api/stats', this.handleStats.bind(this));

    // Get metrics
    this.app.get('/api/metrics', this.handleMetrics.bind(this));

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'MNT Price Oracle API',
        version: '1.0.0',
        endpoints: [
          'GET /api/health',
          'GET /api/latest',
          'GET /api/window/:timestamp',
          'GET /api/history?start=<timestamp>&end=<timestamp>',
          'POST /api/liquidation',
          'GET /api/stats',
          'GET /api/metrics'
        ]
      });
    });
  }

  /**
   * Handle health check
   */
  private async handleHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = this.healthMonitor.getHealthStatus();
      const status = healthStatus.healthy ? 200 : 503;

      res.status(status).json({
        status: healthStatus.healthy ? 'healthy' : 'unhealthy',
        ...healthStatus
      });
    } catch (error) {
      logger.error('Health check failed', error);
      res.status(500).json({ error: 'Health check failed' });
    }
  }

  /**
   * Handle latest window request
   */
  private async handleLatest(req: Request, res: Response): Promise<void> {
    try {
      const window = await this.retrievalService.getLatestWindow();

      if (!window) {
        res.status(404).json({ error: 'No windows available yet' });
        return;
      }

      res.json({
        windowStart: window.windowStart,
        windowEnd: window.windowEnd,
        twap: window.twap,
        lastPrice: window.lastPrice,
        volatility: window.volatility,
        priceCount: window.prices.length,
        confidence: this.calculateConfidence(window.prices.length)
      });
    } catch (error) {
      logger.error('Failed to get latest window', error);
      res.status(500).json({ error: 'Failed to retrieve latest window' });
    }
  }

  /**
   * Handle window request by timestamp
   */
  private async handleWindow(req: Request, res: Response): Promise<void> {
    try {
      const timestamp = parseInt(req.params.timestamp, 10);

      if (isNaN(timestamp)) {
        res.status(400).json({ error: 'Invalid timestamp' });
        return;
      }

      const window = await this.retrievalService.getWindow(timestamp);

      if (!window) {
        res.status(404).json({ error: 'Window not found' });
        return;
      }

      res.json({
        windowStart: window.windowStart,
        windowEnd: window.windowEnd,
        prices: window.prices,
        twap: window.twap,
        lastPrice: window.lastPrice,
        bid: window.bid,
        ask: window.ask,
        volatility: window.volatility
      });
    } catch (error) {
      logger.error('Failed to get window', error);
      res.status(500).json({ error: 'Failed to retrieve window' });
    }
  }

  /**
   * Handle history request
   */
  private async handleHistory(req: Request, res: Response): Promise<void> {
    try {
      const startParam = req.query.start as string;
      const endParam = req.query.end as string;

      let start: number;
      let end: number;

      // Parse start parameter
      if (startParam) {
        if (startParam.endsWith('h')) {
          const hours = parseInt(startParam.slice(0, -1), 10);
          start = Math.floor(Date.now() / 1000) - (hours * 3600);
        } else if (startParam.endsWith('m')) {
          const minutes = parseInt(startParam.slice(0, -1), 10);
          start = Math.floor(Date.now() / 1000) - (minutes * 60);
        } else {
          start = parseInt(startParam, 10);
        }
      } else {
        start = Math.floor(Date.now() / 1000) - 3600; // Default: 1 hour ago
      }

      // Parse end parameter
      if (endParam && endParam !== 'now') {
        end = parseInt(endParam, 10);
      } else {
        end = Math.floor(Date.now() / 1000);
      }

      if (isNaN(start) || isNaN(end)) {
        res.status(400).json({ error: 'Invalid start or end parameter' });
        return;
      }

      // Align to minute boundaries
      start = Math.floor(start / 60) * 60;
      end = Math.floor(end / 60) * 60;

      const windows = await this.retrievalService.getWindowsInRange(start, end);

      const avgPrice = windows.length > 0
        ? windows.reduce((sum, w) => sum + w.twap, 0) / windows.length
        : 0;

      res.json({
        start,
        end,
        windowCount: windows.length,
        windows: windows.map(w => ({
          windowStart: w.windowStart,
          twap: w.twap,
          volatility: w.volatility,
          priceCount: w.prices.length
        })),
        avgPrice
      });
    } catch (error) {
      logger.error('Failed to get history', error);
      res.status(500).json({ error: 'Failed to retrieve history' });
    }
  }

  /**
   * Handle liquidation calculation request
   */
  private async handleLiquidation(req: Request, res: Response): Promise<void> {
    try {
      const { entryPrice, leverage, lookbackMinutes } = req.body as LiquidationRequest;

      // Validate input
      if (!entryPrice || !leverage || !lookbackMinutes) {
        res.status(400).json({
          error: 'Missing required fields: entryPrice, leverage, lookbackMinutes'
        });
        return;
      }

      if (entryPrice <= 0 || leverage <= 0 || lookbackMinutes <= 0) {
        res.status(400).json({
          error: 'All values must be positive'
        });
        return;
      }

      const result = await this.retrievalService.calculateLiquidation({
        entryPrice,
        leverage,
        lookbackMinutes
      });

      res.json(result);
    } catch (error) {
      logger.error('Failed to calculate liquidation', error);
      res.status(500).json({ error: 'Failed to calculate liquidation' });
    }
  }

  /**
   * Handle stats request
   */
  private async handleStats(req: Request, res: Response): Promise<void> {
    try {
      const windowCount = parseInt(req.query.windows as string, 10) || 10;
      const stats = await this.retrievalService.getSummaryStats(windowCount);

      res.json(stats);
    } catch (error) {
      logger.error('Failed to get stats', error);
      res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
  }

  /**
   * Handle metrics request
   */
  private handleMetrics(req: Request, res: Response): void {
    try {
      const metrics = this.healthMonitor.getMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled error', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Calculate confidence score based on price count
   */
  private calculateConfidence(priceCount: number): number {
    const expected = 60;
    const ratio = priceCount / expected;
    return Math.min(ratio, 1.0);
  }

  /**
   * Start the API server
   */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(config.port, config.apiHost, () => {
        logger.info('API server started', {
          host: config.apiHost,
          port: config.port
        });
        resolve();
      });
    });
  }

  /**
   * Stop the API server
   */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err: Error) => {
        if (err) {
          logger.error('Failed to stop API server', err);
          reject(err);
        } else {
          logger.info('API server stopped');
          resolve();
        }
      });
    });
  }
}

export default APIServer;

