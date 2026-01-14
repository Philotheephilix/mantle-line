'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ConnectWalletButton } from './ConnectWalletButton';

interface HeaderProps {
  showStatus?: boolean;
  statusText?: string;
}

export function Header({ showStatus, statusText }: HeaderProps) {
  return (
    <motion.header
      className="sticky top-0 z-50 backdrop-blur-xl bg-[#1800AD]/90 border-b-4 border-[#C1FF72] shadow-[0_4px_0_0_#0a0014]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="px-4 py-3 sm:py-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 rounded-lg bg-[#C1FF72]/40 blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/logo.png"
                alt="Resolv Logo"
                width={48}
                height={48}
                className="relative drop-shadow-lg rounded-lg"
                style={{ imageRendering: 'pixelated' }}
              />
            </motion.div>
            <div className="flex flex-col">
              <motion.h1
                className="relative font-venite text-xl sm:text-2xl font-black tracking-[0.15em] text-[#C1FF72]"
                style={{
                  textShadow: '2px 2px 0 #0a0014, -1px -1px 0 #0a0014'
                }}
                whileHover={{ scale: 1.02 }}
              >
                RESOLV
              </motion.h1>
              <span className="text-[10px] font-bold text-[#C1FF72]/70 uppercase tracking-wider">
                Draw Your Futures
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center md:gap-10 gap-4 uppercase italic font-venite">
            <Link href="/predict" className="border-b-2 border-[#C1FF72] text-sm font-bold text-white/80 hover:text-[#C1FF72] transition-colors">
              Play
            </Link>
            <Link href="/leaderboard" className="border-b-2 border-[#C1FF72] text-sm font-bold text-white/80 hover:text-[#C1FF72] transition-colors">
              Leaderboard
            </Link>
            <Link href="/history" className="border-b-2 border-[#C1FF72] text-sm font-bold text-white/80 hover:text-[#C1FF72] transition-colors">
              History
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ConnectWalletButton />

            {/* Status badge */}
            {showStatus && statusText && (
              <motion.div
                className="flex items-center gap-2 px-3 py-1.5 bg-[#C1FF72]/20 border-2 border-[#C1FF72] rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-[#C1FF72]"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-xs font-bold text-[#C1FF72]">
                  {statusText}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
