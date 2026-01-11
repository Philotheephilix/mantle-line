import { ethers } from 'ethers';
import logger from '../utils/logger.js';
import config from '../config/config.js';

// MNTPriceOracle contract ABI (only the functions we need)
const ORACLE_ABI = [
  'function storeCommitment(uint256 windowStart, bytes32 commitment) external',
  'function getCommitment(uint256 windowStart) external view returns (bytes32)',
  'function getLatestWindow() external view returns (uint256)',
  'function getWindowsInRange(uint256 start, uint256 end) external view returns (uint256[] memory)',
  'function getWindowCount() external view returns (uint256)',
  'event CommitmentStored(uint256 indexed windowStart, bytes32 commitment, uint256 timestamp)'
];

export class ContractStorage {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private nonce: number | null = null;

  constructor(
    rpcUrl: string = config.mantleRpcUrl,
    privateKey: string = config.mantlePrivateKey,
    contractAddress: string = config.contractAddress
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, ORACLE_ABI, this.wallet);

    logger.info('ContractStorage initialized', {
      rpcUrl,
      contractAddress,
      walletAddress: this.wallet.address
    });
  }

  /**
   * Store a commitment on-chain
   */
  public async storeCommitment(windowStart: number, commitment: string): Promise<string> {
    logger.info('Storing commitment on-chain', {
      windowStart,
      commitment
    });

    try {
      // Ensure commitment is properly formatted as bytes32
      const commitmentBytes32 = this.formatCommitment(commitment);

      // Get current nonce
      if (this.nonce === null) {
        this.nonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');
      }

      // Estimate gas
      const gasEstimate = await this.contract.storeCommitment.estimateGas(
        windowStart,
        commitmentBytes32
      );

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      logger.debug('Transaction parameters', {
        windowStart,
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice?.toString(),
        nonce: this.nonce
      });

      // Send transaction
      const tx = await this.contract.storeCommitment(
        windowStart,
        commitmentBytes32,
        {
          gasLimit,
          gasPrice,
          nonce: this.nonce
        }
      );

      // Increment nonce for next transaction
      this.nonce++;

      logger.info('Transaction sent', {
        windowStart,
        txHash: tx.hash,
        nonce: this.nonce - 1
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      logger.info('Transaction confirmed', {
        windowStart,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return receipt.hash;

    } catch (error) {
      logger.error('Failed to store commitment', error);
      
      // Reset nonce on error to resync
      this.nonce = null;
      
      throw error;
    }
  }

  /**
   * Get a commitment from the contract
   */
  public async getCommitment(windowStart: number): Promise<string> {
    try {
      const commitment = await this.contract.getCommitment(windowStart);
      return commitment;
    } catch (error) {
      logger.error('Failed to get commitment', error);
      throw error;
    }
  }

  /**
   * Get the latest window timestamp
   */
  public async getLatestWindow(): Promise<number> {
    try {
      const latestWindow = await this.contract.getLatestWindow();
      return Number(latestWindow);
    } catch (error) {
      logger.error('Failed to get latest window', error);
      throw error;
    }
  }

  /**
   * Get windows in a time range
   */
  public async getWindowsInRange(start: number, end: number): Promise<number[]> {
    try {
      const windows = await this.contract.getWindowsInRange(start, end);
      return windows.map((w: bigint) => Number(w));
    } catch (error) {
      logger.error('Failed to get windows in range', error);
      throw error;
    }
  }

  /**
   * Get total window count
   */
  public async getWindowCount(): Promise<number> {
    try {
      const count = await this.contract.getWindowCount();
      return Number(count);
    } catch (error) {
      logger.error('Failed to get window count', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  public async getBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Failed to get balance', error);
      throw error;
    }
  }

  /**
   * Test the contract connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const count = await this.getWindowCount();
      logger.info('Contract connection test successful', { windowCount: count });
      return true;
    } catch (error) {
      logger.error('Contract connection test failed', error);
      return false;
    }
  }

  /**
   * Format commitment string to bytes32
   */
  private formatCommitment(commitment: string): string {
    // Remove '0x' prefix if present
    let hex = commitment.startsWith('0x') ? commitment.slice(2) : commitment;
    
    // Pad to 32 bytes (64 hex characters) if needed
    if (hex.length < 64) {
      hex = hex.padStart(64, '0');
    }
    
    // Truncate if too long
    if (hex.length > 64) {
      hex = hex.slice(0, 64);
    }
    
    return '0x' + hex;
  }

  /**
   * Reset nonce (useful after errors)
   */
  public async resetNonce(): Promise<void> {
    this.nonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');
    logger.info('Nonce reset', { nonce: this.nonce });
  }
}

export default ContractStorage;

