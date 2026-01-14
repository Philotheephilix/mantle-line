'use client';

import { useEffect, useState } from 'react';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { mantleSepoliaChain } from '@/lib/blockchain/wagmi';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingChart } from '@/components/chart/TradingChart';
import { PatternDrawingBox } from '@/components/chart/PatternDrawingBox';
import { usePredictionDrawing } from '@/hooks/usePredictionDrawing';
import { usePriceData } from '@/hooks/usePriceData';
import {
  samplePredictionPoints,
  uploadSampledPredictionPoints,
} from '@/lib/prediction/samplePredictionPoints';
import { Header, BottomControls } from '@/components/layout';
import { NoiseEffect } from '@/components/ui/NoiseEffect';
import SplashCursor from '@/components/ui/SplashCursor';

export const dynamic = 'force-dynamic';

const LINE_FUTURES_ABI = [
  'function openPosition(uint16 _leverage, string _predictionCommitmentId) external payable returns (uint256)',
  'function batchOpenPositions(uint16 _leverage, string[] _predictionCommitmentIds) external payable returns (uint256[])',
  'function canClosePosition(uint256 _positionId) external view returns (bool)',
  'function getPosition(uint256 _positionId) external view returns (tuple(address user,uint256 amount,uint16 leverage,uint256 openTimestamp,string predictionCommitmentId,bool isOpen,int256 pnl,string actualPriceCommitmentId,uint256 closeTimestamp))',
  'event PositionOpened(uint256 indexed positionId, address indexed user, uint256 amount, uint16 leverage, uint256 timestamp, string predictionCommitmentId)',
];

const DEFAULT_FUTURES_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_FUTURES_CONTRACT_ADDRESS ||
  '0xB57652f87ecc08c8B9d87025f9818818964f7916';

// Props are intentionally not used - they're passed by Next.js but we don't need them
export default function PredictPage(_props: { params?: unknown; searchParams?: unknown }) {
  const { address, isConnected } = useAccount();
  const { data: mntBalance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: mantleSepoliaChain.id,
  });

  const {
    isDrawing,
    currentPoints,
    startDrawing,
    addPoint,
    finishDrawing,
    clearPrediction,
  } = usePredictionDrawing();

  const { data: priceData } = usePriceData();
  const [barSpacing, setBarSpacing] = useState(3);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [amount, setAmount] = useState<number>(10);
  const [leverage, setLeverage] = useState<number>(2500);
  const [positionIds, setPositionIds] = useState<number[]>([]);
  const [positionStatus, setPositionStatus] = useState<'idle' | 'trading' | 'awaiting_settlement' | 'closed'>('idle');
  const [batchPnL, setBatchPnL] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (positionIds.length === 0) return;

    const ethereum = (window as unknown as { ethereum?: unknown }).ethereum;
    if (!ethereum) return;

    let cancelled = false;
    let intervalId: number | null = null;

    const provider = new BrowserProvider(ethereum as any);
    const contract = new Contract(
      DEFAULT_FUTURES_CONTRACT_ADDRESS,
      LINE_FUTURES_ABI,
      provider,
    );

    const tradingMessages = ['Trading...', 'Future booming...', 'Position active...'] as const;

    const poll = async () => {
      if (cancelled) return;
      try {
        const nowSec = Math.floor(Date.now() / 1000);
        let anyOpen = false;
        let anyAwaiting = false;
        let minRemaining: number | null = null;
        let totalClosedPnlWei = BigInt(0);

        for (const pid of positionIds) {
          const position = await contract.getPosition(pid);
          if (position.isOpen) {
            anyOpen = true;
            const openTimestampSec = Number(position.openTimestamp?.toString?.() ?? position.openTimestamp);
            const closeAt = openTimestampSec + 60;
            const remaining = closeAt - nowSec;
            if (minRemaining === null || remaining < minRemaining) {
              minRemaining = remaining;
            }
            const canClose: boolean = await contract.canClosePosition(pid);
            if (canClose) {
              anyAwaiting = true;
            }
          } else {
            const pnlWei = BigInt(position.pnl.toString());
            totalClosedPnlWei += pnlWei;
          }
        }

        setBatchPnL(Number(formatEther(totalClosedPnlWei)));

        if (anyOpen) {
          setPositionStatus(anyAwaiting ? 'awaiting_settlement' : 'trading');
          setTimeRemaining(minRemaining !== null && minRemaining > 0 ? minRemaining : 0);
        } else {
          setPositionStatus('closed');
          setTimeRemaining(0);
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
        }

        setStatusMessageIndex(prev => (prev + 1) % tradingMessages.length);
      } catch (err) {
        console.error('Error polling position status', err);
      }
    };

    // Initial poll
    poll();
    intervalId = window.setInterval(poll, 3000);

    return () => {
      cancelled = true;
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [positionIds]);

  const handleClear = () => {
    clearPrediction();
    setSelectedMinute(null);
    setDebugInfo('');
  };

  const handleZoomIn = () => {
    setBarSpacing(prev => Math.min(prev + 0.5, 10));
  };

  const handleZoomOut = () => {
    setBarSpacing(prev => Math.max(prev - 0.5, 0.1));
  };

  const handlePatternComplete = async (
    points: Array<{ x: number; y: number }>,
    offsetMinutes: number,
  ) => {
    if (!priceData || priceData.length === 0 || points.length === 0) return;

    const currentPrice = priceData[priceData.length - 1].value;

    const canvasWidth = 600;
    const canvasHeight = 300;

    const priceRange = currentPrice * 0.05;
    const minPrice = currentPrice - priceRange;
    const maxPrice = currentPrice + priceRange;

    const nowInSeconds = Math.floor(Date.now() / 1000);
    // Start drawing immediately from current second (position starts at current timestamp)
    const futureStartTime = nowInSeconds;
    const totalDurationSeconds = offsetMinutes * 60;

    let sampledPoints: Array<{ x: number; y: number }>;
    try {
      sampledPoints = samplePredictionPoints(points, 60);
      console.log('sampled prediction canvas points (60):', sampledPoints);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Not enough points to sample the required number of predictions';
      console.error('sampling error:', err);
      alert(
        message.includes('Not enough points')
          ? 'Please draw a longer pattern so we can sample at least 60 points.'
          : `Error sampling prediction points: ${message}`,
      );
      return;
    }

    const commitmentIds: string[] = [];

    if (!address) {
      console.error('wallet not connected; cannot upload predictions or open position');
    } else {
      try {
        // For each minute in the selected horizon, create a separate EigenDA
        // commitment containing 60 predictions.
        for (let i = 0; i < offsetMinutes; i++) {
          const { commitmentId } = await uploadSampledPredictionPoints({
            points,
            userAddress: address,
            desiredCount: 60,
          });
          console.log(`prediction commitment from backend [${i}]:`, commitmentId);
          commitmentIds.push(commitmentId);
        }
      } catch (err) {
        console.error('failed to upload sampled prediction points', err);
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Prediction upload failed';
        alert(`Error uploading predictions: ${message}`);
        return;
      }
    }

    if (commitmentIds.length > 0 && typeof window !== 'undefined' && address) {
      try {
        // Validate inputs
        const lev = Number(leverage);
        if (!Number.isFinite(lev) || lev < 1 || lev > 2500) {
          throw new Error('Leverage must be a number between 1 and 2500');
        }

        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt < 10) {
          throw new Error('Amount must be at least 10 MNT');
        }

        const positionsCount = Math.max(1, offsetMinutes);

        const ethereum = (window as unknown as { ethereum?: unknown }).ethereum;
        if (!ethereum) {
          throw new Error('No injected wallet found. Please install MetaMask.');
        }

        const provider = new BrowserProvider(ethereum as any);
        const signer = await provider.getSigner();

        const contract = new Contract(
          DEFAULT_FUTURES_CONTRACT_ADDRESS,
          LINE_FUTURES_ABI,
          signer,
        );

        // Convert per-position amount to wei
        const valuePerPositionWei = parseEther(amt.toString());

        if (commitmentIds.length === 1) {
          const commitment = commitmentIds[0];
          if (!commitment || commitment.trim().length === 0) {
            throw new Error('Invalid commitment ID: cannot be empty');
          }

          const totalValueWei = valuePerPositionWei;

          console.log('Calling openPosition with:', {
            leverage: lev,
            leverageType: typeof lev,
            commitmentId: commitment,
            commitmentIdLength: commitment.length,
            amount: amt,
            valueInWei: totalValueWei.toString(),
            contractAddress: DEFAULT_FUTURES_CONTRACT_ADDRESS,
          });

          // Estimate gas first to catch any issues early
          try {
            const gasEstimate = await contract.openPosition.estimateGas(
              lev,
              commitment.trim(),
              {
                value: totalValueWei,
              },
            );
            console.log('Gas estimate (openPosition):', gasEstimate.toString());
          } catch (gasErr) {
            console.error('Gas estimation failed:', gasErr);
            throw new Error(
              `Gas estimation failed: ${
                gasErr instanceof Error ? gasErr.message : String(gasErr)
              }`,
            );
          }

          // Call contract - leverage must be uint16, commitmentId must be non-empty string
          const tx = await contract.openPosition(lev, commitment.trim(), {
            value: totalValueWei,
          });

          console.log('openPosition tx sent:', tx.hash);
          const receipt = await tx.wait();
          console.log('openPosition tx confirmed:', receipt);

          // Try to read PositionOpened from logs to get positionId
          let openedPositionId: number | null = null;
          for (const log of receipt.logs || []) {
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed?.name === 'PositionOpened') {
                openedPositionId = Number(parsed.args.positionId.toString());
                break;
              }
            } catch {
              // Not our event, ignore
            }
          }

          if (openedPositionId !== null) {
            setPositionIds([openedPositionId]);
            setPositionStatus('trading');
            setTimeRemaining(60);
            setBatchPnL(null);
          }
        } else {
          // Batch open positions: amount is per position, so total value is
          // per-position value multiplied by the number of positions.
          const totalValueWei = valuePerPositionWei * BigInt(positionsCount);

          console.log('Calling batchOpenPositions with:', {
            leverage: lev,
            leverageType: typeof lev,
            commitmentIds,
            commitmentCount: commitmentIds.length,
            amountPerPosition: amt,
            totalValueWei: totalValueWei.toString(),
            contractAddress: DEFAULT_FUTURES_CONTRACT_ADDRESS,
          });

          // Basic validation on commitment IDs
          if (commitmentIds.some((id) => !id || id.trim().length === 0)) {
            throw new Error('Invalid commitment ID in batch: cannot be empty');
          }

          try {
            const gasEstimate = await contract.batchOpenPositions.estimateGas(
              lev,
              commitmentIds.map((id) => id.trim()),
              {
                value: totalValueWei,
              },
            );
            console.log(
              'Gas estimate (batchOpenPositions):',
              gasEstimate.toString(),
            );
          } catch (gasErr) {
            console.error('Gas estimation failed (batch):', gasErr);
            throw new Error(
              `Gas estimation failed (batch): ${
                gasErr instanceof Error ? gasErr.message : String(gasErr)
              }`,
            );
          }

          const tx = await contract.batchOpenPositions(
            lev,
            commitmentIds.map((id) => id.trim()),
            {
              value: totalValueWei,
            },
          );

          console.log('batchOpenPositions tx sent:', tx.hash);
          const receipt = await tx.wait();
          console.log('batchOpenPositions tx confirmed:', receipt);

          // Collect all opened position IDs from logs for batch tracking
          const openedIds: number[] = [];
          for (const log of receipt.logs || []) {
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed?.name === 'PositionOpened') {
                openedIds.push(Number(parsed.args.positionId.toString()));
              }
            } catch {
              // Not our event, ignore
            }
          }

          if (openedIds.length > 0) {
            setPositionIds(openedIds);
            setPositionStatus('trading');
            setTimeRemaining(60);
            setBatchPnL(null);
          }
        }
      } catch (err) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to open position on LineFutures';
        console.error('failed to open position on LineFutures', err);
        alert(`Error opening position: ${message}`);
      }
    } else {
      if (commitmentIds.length === 0) {
        console.error('Cannot open position: no commitment IDs');
      }
      if (!address) {
        console.error('Cannot open position: wallet not connected');
      }
    }

    const predictionPoints = sampledPoints.map((point) => {
      const normalizedX = point.x / canvasWidth;
      const time = futureStartTime + normalizedX * totalDurationSeconds;

      const normalizedY = point.y / canvasHeight;
      const price = maxPrice - (normalizedY * (maxPrice - minPrice));

      return {
        x: 0,
        y: 0,
        time: Math.floor(time),
        price,
        canvasX: point.x,
        canvasY: point.y,
      };
    });

    setDebugInfo(
      `${offsetMinutes}min window starting @ ${new Date(
        futureStartTime * 1000,
      ).toLocaleTimeString()}`,
    );

    clearPrediction();
    setSelectedMinute(offsetMinutes);

    startDrawing(predictionPoints[0]);
    for (let i = 1; i < predictionPoints.length; i++) {
      addPoint(predictionPoints[i]);
    }
    finishDrawing();
  };

  return (

    <div className="text-white pb-24 relative overflow-hidden">
      {/* <SplashCursor /> */}


      {/* Header */}
      <Header
        showStatus={currentPoints.length > 0}
        statusText={selectedMinute ? `+${selectedMinute}m` : undefined}
      />

      <motion.div
        className="relative z-10 px-3 py-4 sm:px-4 sm:py-6 max-w-6xl mx-auto space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >

        {/* Main Chart Card - Nyan style */}
        <NoiseEffect opacity={0.7} className="">
          <motion.div
            className="relative group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#C1FF72] via-[#1800AD] to-[#C1FF72] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500 animate-pulse" />

            <div className="relative bg-[#0a0014] rounded-2xl border-4 border-[#C1FF72] p-3 sm:p-4 overflow-hidden shadow-[6px_6px_0_0_#1800AD]">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1800AD]/20 to-transparent pointer-events-none" />

              {/* Drawing Indicator */}
              <AnimatePresence>
                {isDrawing && (
                  <motion.div
                    className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-[#C1FF72] rounded-full shadow-[2px_2px_0_0_#1800AD]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-[#1800AD]"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    />
                    <span className="text-[11px] font-bold text-[#1800AD] uppercase tracking-wider">Live</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <TradingChart
                isDark={true}
                isDrawing={isDrawing}
                isConfirmed={false}
                currentPoints={currentPoints}
                selectedMinute={selectedMinute}
                onStartDrawing={startDrawing}
                onAddPoint={addPoint}
                onFinishDrawing={finishDrawing}
                barSpacing={barSpacing}
              />
            </div>
          </motion.div>
        </NoiseEffect>


        {/* Pattern Drawing Box */}
        <NoiseEffect opacity={0.5} className="">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <PatternDrawingBox onPatternComplete={handlePatternComplete} amount={amount} leverage={leverage} onAmountChange={function (amount: number): void {
              setAmount(amount);
            } } onLeverageChange={(leverage) => setLeverage(leverage)} />
          </motion.div>
        </NoiseEffect>




        {/* Wallet Balance & Profit - pixel art style */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-sm sm:text-base text-[#C1FF72] font-bold whitespace-nowrap">My Balance:</span>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-1">
            {/* Wallet pill - pixel look */}
            <motion.div
              className="flex-1 max-w-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-3 border-[#C1FF72] bg-[#1800AD]/50 shadow-[3px_3px_0_0_#C1FF72]">
                <Image
                  src="/wallet.png"
                  alt="Wallet"
                  width={40}
                  height={40}
                  className="w-9 h-9 sm:w-10 sm:h-10"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span className="font-mono text-sm sm:text-base text-gray-200 tracking-tight">
                  {isConnected
                    ? isBalanceLoading
                      ? 'Loading...'
                      : `${Number(mntBalance?.formatted ?? 0).toFixed(3)} ${mntBalance?.symbol ?? 'MNT'}`
                    : '0.000 MNT'}
                </span>
              </div>
            </motion.div>

            {/* Profit pill - pixel look */}
            <motion.div
              className="flex-1 max-w-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-3 border-[#C1FF72] bg-[#1800AD]/50 shadow-[3px_3px_0_0_#C1FF72]">
                <Image
                  src="/coin stack.png"
                  alt="Profit"
                  width={40}
                  height={40}
                  className="w-9 h-9 sm:w-10 sm:h-10"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span
                  className={`font-mono text-sm sm:text-base tracking-tight ${
                    batchPnL !== null
                      ? batchPnL >= 0
                        ? 'text-emerald-300'
                        : 'text-red-300'
                      : 'text-[#C1FF72]'
                  }`}
                >
                  {batchPnL !== null
                    ? `${batchPnL >= 0 ? '+' : ''}${batchPnL.toFixed(4)}`
                    : '+0.00'}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Status Info */}
        <AnimatePresence>
          {(debugInfo || positionStatus !== 'idle') && (
            <motion.div
              className="relative overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#C1FF72]/20 via-[#1800AD]/20 to-[#C1FF72]/20 animate-pulse" />
              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-3 bg-[#0a0014]/60 border-2 border-[#C1FF72] rounded-xl">
                <motion.span
                  className="text-lg"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  🎯
                </motion.span>
                <div className="flex flex-col items-center sm:items-start gap-1">
                  {positionStatus === 'trading' && (
                    <span className="text-sm font-bold text-[#C1FF72]">
                      {['Trading...', 'Future booming...', 'Position active...'][statusMessageIndex]}
                      {timeRemaining !== null && timeRemaining > 0 && (
                        <span className="ml-2 text-xs text-[#C1FF72]/80">
                          ({timeRemaining}s left)
                        </span>
                      )}
                    </span>
                  )}

                  {positionStatus === 'awaiting_settlement' && (
                    <span className="text-sm font-bold text-[#C1FF72]">
                      Awaiting settlement... crunching the future lines
                    </span>
                  )}

                  {positionStatus === 'closed' && batchPnL !== null && (
                    <span
                      className={`text-sm font-bold ${
                        batchPnL >= 0 ? 'text-emerald-300' : 'text-red-300'
                      }`}
                    >
                      PnL:{' '}
                      {batchPnL >= 0 ? '+' : ''}
                      {batchPnL.toFixed(4)} MNT
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Controls */}
      <BottomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        selectedMinute={selectedMinute}
        hasPoints={currentPoints.length > 0}
        onClear={handleClear}
      />
    </div>

  );
}
