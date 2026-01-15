'use client';

import { motion } from 'framer-motion';
import { usePrivy, useWallets } from '@privy-io/react-auth';

function formatAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets[0];

  const address = embeddedWallet?.address ?? '';
  const connected = ready && authenticated && !!embeddedWallet && !!address;
  const isWalletLoading = ready && authenticated && !embeddedWallet;

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
    <motion.button
      onClick={logout}
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
  );
}
