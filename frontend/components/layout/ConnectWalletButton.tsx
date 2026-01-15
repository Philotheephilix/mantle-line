'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy, useWallets } from '@privy-io/react-auth';

function formatAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);

  // Ensure we use the Privy embedded wallet, not browser extensions
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

  const address = embeddedWallet?.address ?? '';
  const connected = ready && authenticated && !!embeddedWallet && !!address;
  const isWalletLoading = ready && authenticated && !embeddedWallet;

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!ready) {
    return null;
  }

  if (isWalletLoading) {
    return (
      <motion.button
        type="button"
        disabled
        className="relative group px-4 py-2.5 bg-[#1800AD] border-3 border-[#C1FF72] rounded-lg font-bold text-[#C1FF72] uppercase tracking-wider text-sm shadow-[4px_4px_0_0_#C1FF72] opacity-75 cursor-not-allowed"
        style={{ imageRendering: 'pixelated' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border-2 border-[#C1FF72] bg-[#C1FF72] flex items-center justify-center">
            <motion.div
              className="w-2 h-2 rounded-sm bg-[#1800AD]"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </div>
          <span className="text-xs sm:text-sm">Creating wallet...</span>
        </div>
      </motion.button>
    );
  }

  if (!connected) {
    return (
      <motion.button
        onClick={login}
        type="button"
        className="relative group px-4 py-2.5 bg-[#C1FF72] border-3 border-[#0a0014] rounded-lg font-bold text-[#1800AD] uppercase tracking-wider text-sm shadow-[4px_4px_0_0_#0a0014] transition-all"
        whileHover={{
          x: -2,
          y: -2,
          boxShadow: '6px 6px 0 0 #0a0014',
        }}
        whileTap={{
          x: 2,
          y: 2,
          boxShadow: '2px 2px 0 0 #0a0014',
        }}
        style={{ imageRendering: 'pixelated' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border-2 border-[#1800AD] bg-[#1800AD] flex items-center justify-center">
            <div className="w-2 h-2 rounded-sm bg-[#C1FF72]" />
          </div>
          <span>Connect</span>
        </div>
      </motion.button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={handleCopyAddress}
        type="button"
        className="relative group px-4 py-2.5 bg-[#1800AD] border-3 border-[#C1FF72] rounded-lg font-bold text-[#C1FF72] uppercase tracking-wider text-sm shadow-[4px_4px_0_0_#C1FF72]"
        whileHover={{
          x: -2,
          y: -2,
          boxShadow: '6px 6px 0 0 #C1FF72',
        }}
        whileTap={{
          x: 2,
          y: 2,
          boxShadow: '2px 2px 0 0 #C1FF72',
        }}
        style={{ imageRendering: 'pixelated' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border-2 border-[#C1FF72] bg-[#C1FF72] flex items-center justify-center">
            <div className="w-2 h-2 rounded-sm bg-[#1800AD]" />
          </div>
          <div className="text-start">
            <span className="text-xs sm:text-sm">
              {address ? formatAddress(address) : 'Connected'}
            </span>
            <div className="text-[10px] text-white font-venite">
              Privy Wallet
            </div>
          </div>
        </div>
      </motion.button>

      {/* Copied Popover */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#C1FF72] border-2 border-[#0a0014] rounded-lg shadow-[3px_3px_0_0_#0a0014] z-50"
            style={{ imageRendering: 'pixelated' }}
          >
            <span className="text-xs font-bold text-[#1800AD] uppercase tracking-wider whitespace-nowrap">
              Copied!
            </span>
            {/* Arrow pointing up */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#0a0014]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
