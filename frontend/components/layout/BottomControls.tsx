'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface BottomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  selectedMinute: number | null;
  hasPoints: boolean;
  onClear: () => void;
  mntBalance?: bigint | null;
  isBalanceLoading?: boolean;
  isConnected?: boolean;
  batchPnL?: number | null;
}

export function BottomControls({
  onZoomIn,
  onZoomOut,
  selectedMinute,
  hasPoints,
  onClear,
  mntBalance,
  isBalanceLoading = false,
  isConnected = false,
  batchPnL = null,
}: BottomControlsProps) {
  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="relative bg-[#1800AD]/95 backdrop-blur-xl border-t-4 border-[#C1FF72] shadow-[0_-4px_0_0_#0a0014]">
        <div className="px-2 py-2 sm:px-4 sm:py-5">
          <div className="max-w-6xl mx-auto">
            {/* Controls Row */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-4 w-full">
              {/* Left: Zoom Controls */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <motion.button
                  onClick={onZoomOut}
                  className="w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center bg-[#0a0014] border-2 sm:border-3 border-[#C1FF72] rounded-lg text-[#C1FF72] text-base sm:text-xl font-bold shadow-[2px_2px_0_0_#C1FF72] sm:shadow-[3px_3px_0_0_#C1FF72]"
                  whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
                  whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 0 #C1FF72' }}
                >
                  −
                </motion.button>
                <motion.button
                  onClick={onZoomIn}
                  className="w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center bg-[#0a0014] border-2 sm:border-3 border-[#C1FF72] rounded-lg text-[#C1FF72] text-base sm:text-xl font-bold shadow-[2px_2px_0_0_#C1FF72] sm:shadow-[3px_3px_0_0_#C1FF72]"
                  whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
                  whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 0 #C1FF72' }}
                >
                  +
                </motion.button>
              </div>

              {/* Center: Wallet & Profit */}
              <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center">
                {/* Wallet pill - pixel look */}
                <motion.div
                  className="min-w-0"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg border-2 sm:border-3 border-[#C1FF72] bg-[#1800AD]/50 shadow-[2px_2px_0_0_#C1FF72] sm:shadow-[3px_3px_0_0_#C1FF72]">
                    <Image
                      src="/wallet.png"
                      alt="Wallet"
                      width={40}
                      height={40}
                      className="w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="font-mono text-xs sm:text-sm md:text-base text-gray-200 tracking-tight truncate">
                      {isConnected && mntBalance !== null
                        ? `${Number((mntBalance ?? 0n) / 10_000_000_000_000_000n) / 100}`
                        : '0.00'}
                    </span>
                  </div>
                </motion.div>

                {/* Profit pill - pixel look */}
                <motion.div
                  className="min-w-0"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg border-2 sm:border-3 border-[#C1FF72] bg-[#1800AD]/50 shadow-[2px_2px_0_0_#C1FF72] sm:shadow-[3px_3px_0_0_#C1FF72]">
                    <Image
                      src="/coin stack.png"
                      alt="Profit"
                      width={40}
                      height={40}
                      className="w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span
                      className={`font-mono text-xs sm:text-sm md:text-base tracking-tight truncate ${batchPnL !== null
                        ? batchPnL >= 0
                          ? 'text-emerald-300'
                          : 'text-red-300'
                        : 'text-[#C1FF72]'
                        }`}
                    >
                      {batchPnL !== null
                        ? `${batchPnL >= 0 ? '+' : ''}${batchPnL.toFixed(2)}`
                        : '+0.00'}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Right: Status & Clear */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Status */}
                {selectedMinute && hasPoints ? (
                  <motion.div
                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-[#C1FF72]/20 border-2 border-[#C1FF72] rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <motion.span
                      className="text-[#C1FF72] text-xs sm:text-sm"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      ●
                    </motion.span>
                    <span className="text-xs sm:text-sm font-bold text-[#C1FF72] whitespace-nowrap">
                      +{selectedMinute}m
                    </span>
                  </motion.div>
                ) : (
                  <span className="text-xs sm:text-sm text-[#C1FF72]/60 font-medium hidden sm:inline">
                    Draw ↑
                  </span>
                )}

                {/* Clear Button */}
                <AnimatePresence>
                  {hasPoints && (
                    <motion.button
                      onClick={onClear}
                      className="px-2 sm:px-5 py-1.5 sm:py-2.5 bg-red-500 border-2 sm:border-3 border-[#0a0014] rounded-lg text-white text-xs sm:text-sm font-bold shadow-[2px_2px_0_0_#0a0014] sm:shadow-[4px_4px_0_0_#0a0014] shrink-0"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ x: -2, y: -2, boxShadow: '6px 6px 0 0 #0a0014' }}
                      whileTap={{ x: 2, y: 2, boxShadow: '2px 2px 0 0 #0a0014' }}
                    >
                      <span className="hidden sm:inline">Clear</span>
                      <span className="sm:hidden">✕</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
