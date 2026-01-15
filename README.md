# Resolv - Draw Your Predictions, Trade the Future

<div align="center">

![Resolv Banner](https://img.shields.io/badge/Mantle-Sepolia-blue?style=for-the-badge)
![EigenDA](https://img.shields.io/badge/EigenDA-Integrated-purple?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A gamified perpetual futures protocol where you draw price predictions instead of placing orders**

[Live Demo](https://resolv.finance) · [Documentation](#technical-architecture) · [Deploy](#deployment-instructions)

</div>

---

## Overview

**Resolv** revolutionizes DeFi trading by transforming complex futures trading into an intuitive drawing experience. Instead of placing traditional long/short orders, users literally draw their price predictions on a canvas. The protocol then calculates PnL based on how accurately your drawn pattern matches actual price movements over a 60-second window.

This creates a unique intersection of **GameFi mechanics** and **DeFi primitives**, making high-leverage futures trading accessible to users who may not understand traditional trading interfaces while maintaining the financial mechanics that sophisticated traders expect.

---

## Table of Contents

- [How to Play](#how-to-play)
- [GameFi Mechanics](#gamefi-mechanics)
- [Technical Architecture](#technical-architecture)
- [Oracle & EigenDA Integration](#oracle--eigenda-integration)
- [Smart Contracts](#smart-contracts)
- [Market Resolution](#market-resolution)
- [Mantle Integration](#mantle-integration)
- [DeFi Innovation & Composability](#defi-innovation--composability)
- [Deployment Instructions](#deployment-instructions)
- [Real-World Applicability](#real-world-applicability)
- [Long-Term Ecosystem Potential](#long-term-ecosystem-potential)
- [Technical Innovation](#technical-innovation)

---

## How to Play

### Step 1: Connect Your Wallet
Connect your Mantle-compatible wallet (MetaMask, WalletConnect, etc.) to the platform. Ensure you're on **Mantle Sepolia** testnet or mainnet.

### Step 2: Draw Your Prediction
Use the interactive canvas to draw your price prediction for MNT/USDT. Draw from **left to right** - your pattern represents how you think the price will move over the next 60 seconds.

### Step 3: Configure Your Position
- **Amount**: Minimum 10 MNT deposit
- **Leverage**: Choose from 100x to 2500x
- **Time Horizon**: Select 1-5 minute windows (batch positions)

### Step 4: Pull the Lever
Click the retro slot machine lever to submit your prediction. Your drawing is:
1. Sampled to 60 data points (one per second)
2. Uploaded to EigenDA for data availability
3. Committed on-chain via the LineFutures contract

### Step 5: Watch & Win
- Real-time chart shows actual price movement with a Nyan Cat animation
- Your prediction overlay displays alongside actual prices
- Directional accuracy determines your PnL
- Position auto-settles after 60 seconds

### Scoring System
- **50% accuracy** = Breakeven (no profit, no loss)
- **100% accuracy** = Maximum profit (full leverage applied)
- **0% accuracy** = Maximum loss (deposit liquidated)
- **Fee**: 2% on profits only

---

## GameFi Mechanics

### The Drawing-to-Trading Innovation

Resolv transforms the abstract concept of "going long" or "going short" into a tangible creative act. This gamification layer provides several advantages:

| Traditional Futures | Resolv |
|---------------------|--------|
| Binary long/short decisions | Nuanced directional predictions |
| Intimidating order books | Intuitive drawing canvas |
| Complex leverage calculations | Simple multiplier selection |
| Stressful position management | Automated 60-second settlements |

### Directional Accuracy Model

Unlike traditional futures where PnL is purely price-delta based, Resolv uses a **Point-by-Point Directional Method**:

```
Accuracy = Correct Directions / 59 comparisons

PnL = (2 × Accuracy - 1) × Max Profit

Where:
  Max Profit = Price Movement × Position Size × Leverage
  Position Size = Deposit Amount / Initial Price
```

This model rewards **pattern recognition** over **magnitude prediction**, creating a more skill-based trading environment.

### Batch Positions

Users can open 1-5 staggered positions with a single transaction:
- Positions open at 60-second intervals
- Equal split of deposited funds
- Same leverage across all positions
- Different market conditions for each

### Leaderboard & Competition

- Global ranking by total PnL
- Win rate statistics
- Best single trade tracking
- User profiles with historical performance

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Drawing Canvas  │  │  Trading Chart  │  │   Wallet UI     │         │
│  │  (60-point      │  │  (Lightweight   │  │  (RainbowKit +  │         │
│  │   sampling)     │  │   Charts + Nyan)│  │   Wagmi)        │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                    │                   │
│           └────────────────────┼────────────────────┘                   │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       BACKEND API       │
                    │  ┌──────────────────┐   │
                    │  │  Price Ingester  │◄──┼──── Bybit WebSocket
                    │  │    (Real-time)   │   │     (MNT/USDT)
                    │  └────────┬─────────┘   │
                    │           │             │
                    │  ┌────────▼─────────┐   │
                    │  │ Price Aggregator │   │
                    │  │  (60-sec TWAP)   │   │
                    │  └────────┬─────────┘   │
                    │           │             │
                    │  ┌────────▼─────────┐   │
                    │  │  EigenDA Client  │───┼──── EigenDA Network
                    │  │   (Commitment)   │   │     (Data Availability)
                    │  └────────┬─────────┘   │
                    │           │             │
                    │  ┌────────▼─────────┐   │
                    │  │ Position Manager │   │
                    │  │  (PnL Calculator)│   │
                    │  └────────┬─────────┘   │
                    │           │             │
                    │  ┌────────▼─────────┐   │
                    │  │  SQLite Database │   │
                    │  │   (Leaderboard)  │   │
                    │  └──────────────────┘   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    MANTLE BLOCKCHAIN    │
                    │  ┌──────────────────┐   │
                    │  │  MNTPriceOracle  │   │
                    │  │  (Commitment     │   │
                    │  │   Storage)       │   │
                    │  └──────────────────┘   │
                    │  ┌──────────────────┐   │
                    │  │   LineFutures    │   │
                    │  │  (Position Mgmt, │   │
                    │  │   PnL Settlement)│   │
                    │  └──────────────────┘   │
                    └─────────────────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | User interface with drawing canvas and real-time charts |
| Backend | Node.js, Express, TypeScript | Price oracle, EigenDA integration, position management |
| Database | SQLite with better-sqlite3 | Leaderboard and closed positions history |
| Contracts | Solidity 0.8.28, Hardhat 3 | On-chain position management and oracle storage |
| Blockchain | Mantle Network | High-throughput, low-cost L2 settlement |
| Data Availability | EigenDA | Off-chain storage for price windows and predictions |

---

## Oracle & EigenDA Integration

### Real-Time Price Feed

The oracle system ingests live MNT/USDT prices from Bybit's WebSocket API:

```typescript
// WebSocket connection to Bybit
wss://stream.bybit.com/v5/public/spot
Subscribe: tickers.MNTUSDT
```

**Features:**
- Sub-second price updates
- Automatic reconnection with exponential backoff
- Heartbeat monitoring (30-second timeout)
- Gap filling for missed seconds

### Price Aggregation

Every 60 seconds, the system creates a **price window**:

```typescript
interface PriceWindow {
  windowStart: number;      // Unix timestamp (minute boundary)
  prices: number[];         // 60 prices (one per second)
  twap: number;             // Time-Weighted Average Price
  volatility: number;       // Standard deviation
  priceCount: number;       // Number of real prices (vs filled)
}
```

### EigenDA Data Availability

Price windows and user predictions are stored on EigenDA for:
- **Cost efficiency**: Store large data off-chain
- **Data availability**: Guaranteed retrieval for verification
- **Scalability**: Handle high-frequency trading data

**Workflow:**
1. Backend creates price window payload
2. Submit to EigenDA proxy → receive commitment hash
3. Store commitment hash on-chain via `MNTPriceOracle.storeCommitment()`
4. Anyone can verify data by retrieving from EigenDA using commitment

```typescript
// EigenDA submission
POST /put?commitment_mode=standard
Body: JSON.stringify(priceWindow)
Response: commitment hash (string)

// EigenDA retrieval
GET /get/{commitment}?commitment_mode=standard
Response: original price window data
```

### Commitment Storage (On-Chain)

The `MNTPriceOracle` contract stores commitment references:

```solidity
// Store commitment for a price window
function storeCommitment(uint256 windowStart, string memory commitment)
    external onlySubmitter
{
    require(windowStart % 60 == 0, "Must be minute boundary");
    commitments[windowStart] = commitment;
    storedAt[windowStart] = block.timestamp;
    // ...
}
```

---

## Smart Contracts

### LineFutures.sol

The main futures contract handling positions and settlements.

**Key Parameters:**
- `MIN_AMOUNT`: 10 MNT minimum deposit
- `MAX_LEVERAGE`: 2500x maximum leverage
- `POSITION_DURATION`: 60 seconds
- `feePercentage`: 2% (200 basis points) on profits only

**Position Lifecycle:**

```solidity
struct Position {
    address user;
    uint256 amount;
    uint16 leverage;
    uint256 openTimestamp;
    string predictionCommitmentId;  // EigenDA commitment
    bool isOpen;
    int256 pnl;
    string actualPriceCommitmentId; // EigenDA commitment
    uint256 closeTimestamp;
}
```

**Core Functions:**

| Function | Description |
|----------|-------------|
| `openPosition(leverage, commitmentId)` | Open single position |
| `batchOpenPositions(leverage, commitmentIds[])` | Open 1-5 staggered positions |
| `closePosition(positionId, pnl, actualCommitmentId)` | Settle position (PnL server only) |
| `canClosePosition(positionId)` | Check if 60 seconds elapsed |
| `getUserPositions(address)` | Get all user position IDs |
| `getUserStats(address)` | Get aggregated user statistics |

### MNTPriceOracle.sol

Oracle contract for storing EigenDA commitment references.

**Core Functions:**

| Function | Description |
|----------|-------------|
| `storeCommitment(windowStart, commitment)` | Store price window commitment |
| `getCommitment(windowStart)` | Retrieve commitment by timestamp |
| `getLatestWindow()` | Get most recent window timestamp |
| `getWindowsInRange(start, end)` | Get all windows in time range |

### Contract Addresses (Mantle Sepolia)

```
MNTPriceOracle: 0xd30d89f5A34D9aF15915dcaeFF8fC11070034982
LineFutures:    0xB57652f87ecc08c8B9d87025f9818818964f7916
```

---

## Market Resolution

### PnL Calculation Algorithm

The backend calculates PnL using a **Point-by-Point Directional Method**:

```typescript
function calculatePnL(
  predictedPrices: number[],
  actualPrices: number[],
  amount: bigint,
  leverage: number
): { pnl: bigint; accuracy: number; fee: bigint } {
  
  // 1. Count correct directional predictions (59 comparisons)
  let correctDirections = 0;
  for (let i = 0; i < 59; i++) {
    const predictedDirection = getDirection(predictedPrices[i], predictedPrices[i + 1]);
    const actualDirection = getDirection(actualPrices[i], actualPrices[i + 1]);
    if (predictedDirection === actualDirection) correctDirections++;
  }
  
  // 2. Calculate accuracy (0 to 1)
  const accuracy = correctDirections / 59;
  
  // 3. Calculate price movement
  const priceMovement = Math.abs(actualPrices[59] - actualPrices[0]);
  
  // 4. Calculate position size
  const positionSize = amount / actualPrices[0];
  
  // 5. Calculate max profit
  const maxProfit = priceMovement * positionSize * leverage;
  
  // 6. Calculate base PnL
  // 50% accuracy = 0 PnL (breakeven)
  // 100% accuracy = +maxProfit
  // 0% accuracy = -maxProfit
  const pnl = (2 * accuracy - 1) * maxProfit;
  
  // 7. Calculate fee (2% on profits only)
  const fee = pnl > 0 ? pnl * 0.02 : 0;
  
  return { pnl, accuracy, fee };
}
```

### Automatic Position Closing

A cron job runs every 10 seconds to:
1. Query all open positions from contract
2. Check if `canClosePosition()` returns true
3. Retrieve user predictions from EigenDA
4. Get actual prices for the position's time window
5. Calculate PnL and close on-chain
6. Save results to SQLite for leaderboard

### Window Extraction Logic

Since positions can start at any second (not just minute boundaries), the system extracts prices from two consecutive windows:

```typescript
// Position starts at second 23 of minute X
// Window 1 (minute X): seconds 23-59 (37 prices)
// Window 2 (minute X+1): seconds 0-22 (23 prices)
// Total: 60 prices
```

---

## Mantle Integration

### Why Mantle?

Resolv is built natively on **Mantle Network** for several key reasons:

1. **High Throughput**: Mantle's modular architecture supports high-frequency position updates
2. **Low Transaction Costs**: Essential for 60-second micro-positions with frequent settlements
3. **Native MNT**: Trading native MNT creates natural network effects
4. **EVM Compatibility**: Standard Solidity contracts with no modifications needed
5. **Data Availability**: Seamless integration with EigenDA for off-chain data storage

### Network Configuration

```typescript
// Mantle Sepolia (Testnet)
{
  chainId: 5003,
  rpc: "https://rpc.sepolia.mantle.xyz"
}

// Mantle Mainnet
{
  chainId: 5000,
  rpc: "https://rpc.mantle.xyz"
}
```

### Gas Optimization

- Transaction queueing prevents nonce conflicts
- Gas estimation with 20% buffer
- Retry logic with exponential backoff
- Batch position opening reduces gas per position

---

## DeFi Innovation & Composability

### Novel DeFi Primitives

1. **Drawing-Based Derivatives**: First protocol to use drawn patterns as trading signals
2. **Directional Accuracy Scoring**: PnL based on pattern matching, not just price delta
3. **Micro-Duration Futures**: 60-second settlement windows for rapid trading cycles
4. **Commitment-Based Verification**: EigenDA commitments enable trustless verification

### Composability Features

**Event Emissions for Integration:**
```solidity
event PositionOpened(
    uint256 indexed positionId,
    address indexed user,
    uint256 amount,
    uint16 leverage,
    uint256 openTimestamp,
    string predictionCommitmentId
);

event PositionClosed(
    uint256 indexed positionId,
    address indexed user,
    int256 pnl,
    uint256 finalAmount,
    string actualPriceCommitmentId,
    uint256 closeTimestamp
);
```

**Integration Points:**
- Other protocols can listen to position events
- Oracle commitments are publicly queryable
- User stats available on-chain via `getUserStats()`
- Position data retrievable via `getPosition()`

### Future Composability Roadmap

- **Vault Integrations**: Allow LPs to provide liquidity for positions
- **ERC20 Support**: Accept stablecoins and other tokens as collateral
- **Cross-Protocol Positions**: Aggregate predictions from multiple users
- **Prediction NFTs**: Mint successful prediction patterns as collectibles

---

## Deployment Instructions

### Prerequisites

- Node.js 20+
- pnpm (package manager)
- Mantle Sepolia testnet MNT (for deployment and testing)
- EigenDA proxy running locally (for backend)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/resolv.git
cd resolv
```

### 2. Deploy Smart Contracts

```bash
cd contracts

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your private key:
# MANTLE_SEPOLIA_PRIVATE_KEY=your_private_key_here

# Compile contracts
pnpm hardhat compile

# Deploy MNTPriceOracle
pnpm hardhat ignition deploy ignition/modules/MNTPriceOracle.ts \
  --network mantleSepolia \
  --parameters '{"submitterAddress": "YOUR_BACKEND_ADDRESS"}'

# Deploy LineFutures (use oracle address from previous deployment)
pnpm hardhat ignition deploy ignition/modules/LineFutures.ts \
  --network mantleSepolia \
  --parameters '{
    "pnlServerAddress": "YOUR_BACKEND_ADDRESS",
    "mntPriceOracleAddress": "DEPLOYED_ORACLE_ADDRESS"
  }'
```

### 3. Set Up Backend

```bash
cd ../backend

# Install dependencies
pnpm install

# Configure environment
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Network Configuration
NETWORK=testnet
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
MANTLE_SEPOLIA_PRIVATE_KEY=your_private_key_here

# Contract Addresses (from deployment)
CONTRACT_ADDRESS=your_oracle_contract_address
FUTURES_CONTRACT_ADDRESS=your_futures_contract_address

# EigenDA Configuration
EIGENDA_PROXY_URL=http://127.0.0.1:3100
EIGENDA_COMMITMENT_MODE=standard

# API Configuration
PORT=3001
API_HOST=0.0.0.0

# Admin Configuration
ADMIN_API_KEY=your_secure_admin_api_key
```

```bash
# Start development server
pnpm dev

# Or build and start production
pnpm build
pnpm start
```

### 4. Set Up Frontend

```bash
cd ../frontend

# Install dependencies
pnpm install

# Configure environment
cat > .env.local << EOF
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_FUTURES_CONTRACT_ADDRESS=your_futures_contract_address
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
EOF

# Start development server
pnpm dev

# Or build for production
pnpm build
pnpm start
```

### 5. Start EigenDA Proxy

Follow [EigenDA documentation](https://docs.eigenda.xyz/) to run a local proxy:

```bash
# The proxy should be available at http://127.0.0.1:3100
eigenda-proxy --port 3100
```

### Verification

1. Open `http://localhost:3000` in your browser
2. Connect your wallet (ensure Mantle Sepolia network)
3. Draw a prediction pattern
4. Configure amount, leverage, and time horizon
5. Submit position and watch real-time settlement

---

## Real-World Applicability

### Target Users

1. **Casual Traders**: Intuitive drawing interface lowers barrier to entry
2. **Prediction Market Enthusiasts**: Familiar with betting on outcomes
3. **Gamers**: Recognizable slot machine and arcade aesthetics
4. **Technical Traders**: High leverage and rapid settlements

### Use Cases

| Use Case | Description |
|----------|-------------|
| **Price Speculation** | Predict MNT price movements with up to 2500x leverage |
| **Hedging** | Quick 60-second hedges against existing positions |
| **Entertainment** | Gamified trading with retro aesthetics |
| **Market Sentiment** | Aggregate drawn patterns reveal crowd predictions |

### Market Opportunities

- **Prediction Markets**: $1B+ TAM growing 10%+ annually
- **Perpetual Futures**: $100B+ daily volume across crypto
- **GameFi**: $10B+ market cap with growing user bases

---

## Long-Term Ecosystem Potential

### Roadmap

**Phase 1: Launch (Current)**
- [x] Core drawing-to-trading mechanics
- [x] Mantle Sepolia deployment
- [x] EigenDA integration
- [x] Basic leaderboard

**Phase 2: Enhancement**
- [ ] Multi-asset support (BTC, ETH, etc.)
- [ ] Mobile-optimized drawing interface
- [ ] Social features (share predictions, follow traders)
- [ ] Prediction NFTs

**Phase 3: Ecosystem**
- [ ] LP vaults for liquidity provision
- [ ] Governance token and DAO
- [ ] Protocol revenue sharing
- [ ] Cross-chain deployment

**Phase 4: Innovation**
- [ ] AI prediction assistance
- [ ] Pattern recognition marketplace
- [ ] Institutional API access
- [ ] Prediction aggregation protocols

### Ecosystem Integrations

- **DeFi Protocols**: Integrate with Mantle DEXes and lending protocols
- **NFT Platforms**: Mint successful predictions as tradeable NFTs
- **Analytics**: Partner with on-chain analytics providers
- **Wallets**: Native integration with popular Mantle wallets

### Network Effects

1. **More Users → Better Leaderboard Data**
2. **More Predictions → Better Sentiment Analysis**
3. **More Volume → Lower Fees → More Users**
4. **More Assets → Broader Market Coverage**

---

## Technical Innovation

### Novel Approaches

| Innovation | Description |
|------------|-------------|
| **Drawing-Based Input** | First protocol to use canvas drawings as trading signals |
| **Directional Accuracy** | PnL model based on pattern matching, not magnitude |
| **EigenDA + Oracle** | Hybrid on-chain/off-chain data architecture |
| **Commitment Scheme** | Trustless verification of predictions and prices |
| **Micro-Duration** | 60-second futures with automated settlement |

### Security Model

1. **Separation of Concerns**: Oracle and Futures contracts are independent
2. **Access Control**: Owner, PnL server, and submitter roles
3. **Pausability**: Emergency stop for new positions
4. **Fee Limits**: Maximum 10% fee cap
5. **Commitment Verification**: EigenDA enables trustless data verification

### Performance Optimizations

- **Transaction Queueing**: Sequential blockchain operations prevent nonce conflicts
- **Batch Operations**: Multiple positions in single transaction
- **Incremental Chart Updates**: Efficient real-time rendering
- **WebSocket Reconnection**: Automatic recovery from network issues

### Code Quality

- **TypeScript**: Full type safety across frontend and backend
- **Hardhat 3**: Latest testing and deployment framework
- **Comprehensive Tests**: Unit tests for all contract functions
- **Event-Driven Architecture**: Clean separation of concerns

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, lightweight-charts |
| **Wallet** | RainbowKit 2, Wagmi 2, Viem 2, ethers.js 6 |
| **Backend** | Node.js, Express, TypeScript, better-sqlite3 |
| **Blockchain** | Solidity 0.8.28, Hardhat 3, Mantle Network |
| **Data Availability** | EigenDA (standard commitment mode) |
| **Real-Time Data** | Bybit WebSocket API |

---

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs to the `develop` branch.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with love for the Mantle ecosystem**

[Website](https://resolv.finance) · [Twitter](https://twitter.com/resolvfinance) · [Discord](https://discord.gg/resolv)

</div>
