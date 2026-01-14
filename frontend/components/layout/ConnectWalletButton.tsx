'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';

export function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <motion.button
                    onClick={openConnectModal}
                    type="button"
                    className="relative group px-4 py-2.5 bg-[#C1FF72] border-3 border-[#0a0014] rounded-lg font-bold text-[#1800AD] uppercase tracking-wider text-sm shadow-[4px_4px_0_0_#0a0014] transition-all"
                    whileHover={{
                      x: -2,
                      y: -2,
                      boxShadow: '6px 6px 0 0 #0a0014'
                    }}
                    whileTap={{
                      x: 2,
                      y: 2,
                      boxShadow: '2px 2px 0 0 #0a0014'
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

              if (chain.unsupported) {
                return (
                  <motion.button
                    onClick={openChainModal}
                    type="button"
                    className="relative px-4 py-2.5 bg-red-500 border-3 border-[#0a0014] rounded-lg font-bold text-white uppercase tracking-wider text-sm shadow-[4px_4px_0_0_#0a0014]"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Wrong network
                  </motion.button>
                );
              }

              return (
                <motion.button
                  onClick={openAccountModal}
                  type="button"
                  className="relative group px-4 py-2.5 bg-[#1800AD] border-3 border-[#C1FF72] rounded-lg font-bold text-[#C1FF72] uppercase tracking-wider text-sm shadow-[4px_4px_0_0_#C1FF72]"
                  whileHover={{
                    x: -2,
                    y: -2,
                    boxShadow: '6px 6px 0 0 #C1FF72'
                  }}
                  whileTap={{
                    x: 2,
                    y: 2,
                    boxShadow: '2px 2px 0 0 #C1FF72'
                  }}
                  style={{ imageRendering: 'pixelated' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border-2 border-[#C1FF72] bg-[#C1FF72] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-sm bg-[#1800AD]" />
                    </div>
                    <span className="text-xs sm:text-sm">
                      {account.displayName}
                      {account.displayBalance ? ` (${account.displayBalance})` : ''}
                    </span>
                  </div>
                </motion.button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
