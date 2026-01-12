import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  network: 'mainnet' | 'testnet' | 'local';
  mantleRpcUrl: string;
  mantlePrivateKey: string;
  contractAddress: string;
  futuresContractAddress: string;
  eigendaProxyUrl: string;
  eigendaCommitmentMode: string;
  port: number;
  apiHost: string;
  bybitWssUrl: string;
  logLevel: string;
  alertWebhookUrl?: string;
  adminApiKey: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config: Config = {
  network: (process.env.NETWORK || 'local') as 'mainnet' | 'testnet' | 'local',
  mantleRpcUrl: getOptionalEnvVar('MANTLE_RPC_URL', 'https://rpc.sepolia.mantle.xyz'),
  mantlePrivateKey: getEnvVar('MANTLE_SEPOLIA_PRIVATE_KEY'),
  contractAddress: getEnvVar('CONTRACT_ADDRESS'),
  futuresContractAddress: getEnvVar('FUTURES_CONTRACT_ADDRESS'),
  eigendaProxyUrl: getOptionalEnvVar('EIGENDA_PROXY_URL', 'http://127.0.0.1:3100'),
  eigendaCommitmentMode: getOptionalEnvVar('EIGENDA_COMMITMENT_MODE', 'standard'),
  port: parseInt(process.env.PORT || '3001', 10),
  apiHost: process.env.API_HOST || '0.0.0.0',
  bybitWssUrl: getOptionalEnvVar('BYBIT_WSS_URL', 'wss://stream.bybit.com/v5/public/spot'),
  logLevel: process.env.LOG_LEVEL || 'info',
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
  adminApiKey: getEnvVar('ADMIN_API_KEY'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
};

export default config;
