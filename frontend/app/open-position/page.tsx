'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import { Header, Footer } from '@/components/layout';
import { NoiseEffect } from '@/components/ui/NoiseEffect';

const LINE_FUTURES_ABI = [
  'function openPosition(uint16 _leverage, string _predictionCommitmentId) external payable returns (uint256)',
  'event PositionOpened(uint256 indexed positionId, address indexed user, uint256 amount, uint16 leverage, uint256 timestamp, string predictionCommitmentId)',
];

const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const DEFAULT_FUTURES_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_FUTURES_CONTRACT_ADDRESS ||
  '0xb7784EC48266EB7A6155910139025f35918Ac21F';

type StepStatus = 'idle' | 'in-progress' | 'done' | 'error';

export default function OpenPositionPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [leverage, setLeverage] = useState('2500');
  const [amount, setAmount] = useState('10.0'); // in MNT
  const [predictionsInput, setPredictionsInput] = useState(
    '0.50, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59,\n' +
    '0.60, 0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69,\n' +
    '0.70, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79,\n' +
    '0.80, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89,\n' +
    '0.90, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99,\n' +
    '1.00, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09'
  );

  const [commitmentId, setCommitmentId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<number | null>(null);

  const [uploadStatus, setUploadStatus] = useState<StepStatus>('idle');
  const [txStatus, setTxStatus] = useState<StepStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function connectWallet() {
    try {
      setConnecting(true);
      setError(null);

      if (typeof window === 'undefined' || !(window as unknown as { ethereum?: unknown }).ethereum) {
        throw new Error('No injected wallet found. Please install MetaMask.');
      }

      const provider = new BrowserProvider(
        (window as unknown as { ethereum: import('ethers').Eip1193Provider }).ethereum
      );
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in wallet');
      }
      setWalletAddress(accounts[0]);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to connect wallet';
      setError(message);
    } finally {
      setConnecting(false);
    }
  }

  function parsePredictions(raw: string): number[] {
    // Try JSON first
    try {
      const asJson = JSON.parse(raw);
      if (Array.isArray(asJson)) {
        return asJson.map((v) => Number(v));
      }
    } catch {
      // ignore, fall back to CSV parsing
    }

    // Fallback: comma/whitespace separated list
    const parts = raw
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    return parts.map((p) => Number(p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUploadStatus('idle');
    setTxStatus('idle');
    setCommitmentId(null);
    setPositionId(null);

    try {
      if (!walletAddress) {
        throw new Error('Please connect your wallet first');
      }

      const lev = Number(leverage);
      if (!Number.isFinite(lev) || lev < 1 || lev > 2500) {
        throw new Error('Leverage must be a number between 1 and 2500');
      }

      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt < 10) {
        throw new Error('Amount must be at least 10 MNT');
      }

      // 1) Parse predictions
      const predictions = parsePredictions(predictionsInput);
      if (predictions.length !== 60) {
        throw new Error(
          `Predictions must contain exactly 60 numbers, got ${predictions.length}`
        );
      }

      // 2) Upload predictions to backend (EigenDA + oracle)
      setUploadStatus('in-progress');

      const uploadRes = await fetch(
        `${DEFAULT_BACKEND_URL}/api/predictions/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            predictions,
            userAddress: walletAddress,
          }),
        }
      );

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(
          body.error || `Prediction upload failed with ${uploadRes.status}`
        );
      }

      const uploadJson = await uploadRes.json();
      const commitment = uploadJson.commitmentId as string | undefined;

      if (!commitment) {
        throw new Error('Backend did not return a commitmentId');
      }

      setCommitmentId(commitment);
      setUploadStatus('done');

      // 3) Call LineFutures.openPosition from the connected wallet
      setTxStatus('in-progress');

      if (
        typeof window === 'undefined' ||
        !(window as unknown as { ethereum?: unknown }).ethereum
      ) {
        throw new Error('No injected wallet found. Please install MetaMask.');
      }

      const provider = new BrowserProvider(
        (window as unknown as { ethereum: import('ethers').Eip1193Provider }).ethereum
      );
      const signer = await provider.getSigner();

      const contract = new Contract(
        DEFAULT_FUTURES_CONTRACT_ADDRESS,
        LINE_FUTURES_ABI,
        signer
      );

      const tx = await contract.openPosition(lev, commitment, {
        value: parseEther(amt.toString()),
      });

      const receipt = await tx.wait();

      // Try to read PositionOpened from logs
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
        setPositionId(openedPositionId);
      }

      setTxStatus('done');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Unexpected error';
      setError(message);
      if (uploadStatus === 'in-progress') {
        setUploadStatus('error');
      } else if (txStatus === 'in-progress') {
        setTxStatus('error');
      }
    }
  }

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'done': return 'bg-[#C1FF72]';
      case 'in-progress': return 'bg-yellow-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-[#1800AD]';
    }
  };

  return (
    <NoiseEffect opacity={0.12} className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          className="w-full max-w-3xl rounded-2xl border-4 border-[#C1FF72] bg-[#0a0014]/90 p-8 shadow-[8px_8px_0_0_#1800AD]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#C1FF72]" style={{ textShadow: '2px 2px 0 #1800AD' }}>
                Open LineFutures Position
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Configure leverage, upload your 60-point prediction line to
                EigenDA, and open a position on the 2500x contract.
              </p>
            </div>
            <motion.button
              type="button"
              onClick={connectWallet}
              disabled={connecting}
              className="rounded-lg border-3 border-[#C1FF72] bg-[#1800AD] px-4 py-2 text-sm font-bold text-[#C1FF72] shadow-[3px_3px_0_0_#C1FF72] disabled:opacity-60"
              whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
              whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 0 #C1FF72' }}
            >
              {walletAddress
                ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
                : connecting
                  ? 'Connecting…'
                  : '🔗 Connect Wallet'}
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-[#C1FF72]">
                  Leverage (1 – 2500x)
                </label>
                <input
                  type="number"
                  min={1}
                  max={2500}
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  className="mt-1 w-full rounded-lg border-3 border-[#C1FF72] bg-[#1800AD]/50 px-3 py-2 text-sm text-white focus:border-[#C1FF72] focus:outline-none focus:ring-2 focus:ring-[#C1FF72]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#C1FF72]">
                  Deposit Amount (MNT)
                </label>
                <input
                  type="number"
                  min={10}
                  step="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border-3 border-[#C1FF72] bg-[#1800AD]/50 px-3 py-2 text-sm text-white focus:border-[#C1FF72] focus:outline-none focus:ring-2 focus:ring-[#C1FF72]/50"
                />
                <p className="mt-1 text-xs text-white/50">
                  Minimum required by contract: 10 MNT
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#C1FF72]">
                Predictions (60 values)
              </label>
              <p className="mt-1 text-xs text-white/50">
                Paste 60 comma-separated numbers or a JSON array. These will be
                uploaded to EigenDA and referenced by the commitment when opening
                your position.
              </p>
              <textarea
                rows={6}
                value={predictionsInput}
                onChange={(e) => setPredictionsInput(e.target.value)}
                className="mt-2 w-full rounded-lg border-3 border-[#C1FF72] bg-[#1800AD]/50 px-3 py-2 text-sm text-white font-mono focus:border-[#C1FF72] focus:outline-none focus:ring-2 focus:ring-[#C1FF72]/50"
              />
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-[#1800AD]/30 border-2 border-[#C1FF72]/30">
              <div className="flex items-center gap-3">
                <motion.span
                  className={`inline-flex h-3 w-3 rounded-full ${getStatusColor(uploadStatus)}`}
                  animate={uploadStatus === 'in-progress' ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
                <span className="font-bold text-[#C1FF72]">
                  1. Store predictions &amp; commitment (backend + EigenDA)
                </span>
                {commitmentId && (
                  <span className="truncate text-xs text-white/50">
                    Commitment: {commitmentId}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <motion.span
                  className={`inline-flex h-3 w-3 rounded-full ${getStatusColor(txStatus)}`}
                  animate={txStatus === 'in-progress' ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
                <span className="font-bold text-[#C1FF72]">
                  2. Open position on LineFutures contract
                </span>
                {positionId !== null && (
                  <span className="text-xs text-white/50">
                    Position ID: {positionId}
                  </span>
                )}
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="rounded-lg border-2 border-red-500 bg-red-500/20 px-4 py-3 text-sm text-red-200"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={uploadStatus === 'in-progress' || txStatus === 'in-progress'}
                className="rounded-lg bg-[#C1FF72] px-6 py-3 text-sm font-bold text-[#1800AD] border-3 border-[#0a0014] shadow-[4px_4px_0_0_#0a0014] disabled:opacity-60"
                whileHover={{ x: -2, y: -2, boxShadow: '6px 6px 0 0 #0a0014' }}
                whileTap={{ x: 2, y: 2, boxShadow: '2px 2px 0 0 #0a0014' }}
              >
                {uploadStatus === 'in-progress' || txStatus === 'in-progress'
                  ? '⏳ Processing…'
                  : '🚀 Store Commitment & Open Position'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>

      <Footer />
    </NoiseEffect>
  );
}
