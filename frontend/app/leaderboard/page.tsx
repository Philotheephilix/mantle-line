'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, Footer } from '@/components/layout';
import { NoiseEffect } from '@/components/ui/NoiseEffect';

// Mock leaderboard data
const mockLeaderboardData = [
  {
    rank: 1,
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e5E8',
    username: 'NyanMaster',
    totalPnL: 125420.50,
    winRate: 78.5,
    totalTrades: 156,
    bestTrade: 45000,
    streak: 12,
    avatar: '🐱',
  },
  {
    rank: 2,
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    username: 'LineWhisperer',
    totalPnL: 98750.25,
    winRate: 72.3,
    totalTrades: 203,
    bestTrade: 32000,
    streak: 8,
    avatar: '🎨',
  },
  {
    rank: 3,
    address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    username: 'CurveKing',
    totalPnL: 87340.00,
    winRate: 68.9,
    totalTrades: 178,
    bestTrade: 28500,
    streak: 5,
    avatar: '👑',
  },
  {
    rank: 4,
    address: '0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c',
    username: 'PatternPro',
    totalPnL: 72150.75,
    winRate: 65.2,
    totalTrades: 245,
    bestTrade: 22000,
    streak: 3,
    avatar: '📈',
  },
  {
    rank: 5,
    address: '0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C',
    username: 'DrawMaster',
    totalPnL: 65890.30,
    winRate: 63.8,
    totalTrades: 189,
    bestTrade: 19500,
    streak: 6,
    avatar: '✏️',
  },
  {
    rank: 6,
    address: '0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB',
    username: 'FuturesWizard',
    totalPnL: 58420.00,
    winRate: 61.5,
    totalTrades: 167,
    bestTrade: 17800,
    streak: 4,
    avatar: '🧙',
  },
  {
    rank: 7,
    address: '0x583031D1113aD414F02576BD6afaBfb302140225',
    username: 'TrendRider',
    totalPnL: 51200.45,
    winRate: 59.2,
    totalTrades: 198,
    bestTrade: 15600,
    streak: 2,
    avatar: '🏄',
  },
  {
    rank: 8,
    address: '0xdD870fA1b7C4700F2BD7f44238821C26f7392148',
    username: 'ChartNinja',
    totalPnL: 45670.80,
    winRate: 57.8,
    totalTrades: 223,
    bestTrade: 14200,
    streak: 7,
    avatar: '🥷',
  },
  {
    rank: 9,
    address: '0x0A098Eda01Ce92ff4A4CCb7A4fFFb5A43EBC70DC',
    username: 'PredictionPunk',
    totalPnL: 39850.25,
    winRate: 55.4,
    totalTrades: 176,
    bestTrade: 12800,
    streak: 1,
    avatar: '🎸',
  },
  {
    rank: 10,
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    username: 'LineArtist',
    totalPnL: 34520.60,
    winRate: 53.1,
    totalTrades: 145,
    bestTrade: 11500,
    streak: 3,
    avatar: '🎭',
  },
];

type TimeFilter = 'all' | 'monthly' | 'weekly' | 'daily';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 text-[#0a0014]';
      case 2:
        return 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-400 text-[#0a0014]';
      case 3:
        return 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white';
      default:
        return 'bg-[#1800AD] text-[#C1FF72]';
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  const formatPnL = (pnl: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(pnl);
  };

  return (
    <NoiseEffect opacity={0.12} className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-venite font-bold text-[#C1FF72] mb-4"
              style={{ textShadow: '4px 4px 0 #1800AD' }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🏆 LEADERBOARD 🏆
            </motion.h1>
            <p className="text-lg text-white/70">
              Top traders competing to draw the best futures
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {[
              { label: 'Total Traders', value: '1,247', icon: '👥' },
              { label: 'Total Volume', value: '$2.4M', icon: '💰' },
              { label: 'Positions Today', value: '342', icon: '📊' },
              { label: 'Avg Win Rate', value: '58.2%', icon: '🎯' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="p-4 bg-[#1800AD]/60 border-3 border-[#C1FF72] rounded-xl shadow-[4px_4px_0_0_#C1FF72]"
                whileHover={{ y: -4, boxShadow: '6px 6px 0 0 #C1FF72' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-[#C1FF72]">{stat.value}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Time Filter Tabs */}
          <motion.div
            className="flex justify-center gap-2 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {(['all', 'monthly', 'weekly', 'daily'] as TimeFilter[]).map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-lg font-bold text-sm border-3 transition-all ${
                  timeFilter === filter
                    ? 'bg-[#C1FF72] text-[#1800AD] border-[#0a0014] shadow-[3px_3px_0_0_#0a0014]'
                    : 'bg-[#1800AD]/60 text-[#C1FF72] border-[#C1FF72]/50 hover:border-[#C1FF72]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </motion.button>
            ))}
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            className="rounded-2xl border-4 border-[#C1FF72] bg-[#0a0014]/90 overflow-hidden shadow-[8px_8px_0_0_#1800AD]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-[#1800AD]/80 border-b-3 border-[#C1FF72] text-sm font-bold text-[#C1FF72]">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-3">Trader</div>
              <div className="col-span-2 text-right">Total PnL</div>
              <div className="col-span-1 text-center">Win Rate</div>
              <div className="col-span-2 text-center">Trades</div>
              <div className="col-span-2 text-center">Best Trade</div>
              <div className="col-span-1 text-center">🔥 Streak</div>
            </div>

            {/* Table Body */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {mockLeaderboardData.map((trader) => (
                  <motion.div
                    key={trader.rank}
                    variants={itemVariants}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-[#C1FF72]/20 transition-all cursor-pointer ${
                      hoveredRank === trader.rank ? 'bg-[#1800AD]/40' : ''
                    } ${trader.rank <= 3 ? 'bg-gradient-to-r from-[#1800AD]/20 to-transparent' : ''}`}
                    onMouseEnter={() => setHoveredRank(trader.rank)}
                    onMouseLeave={() => setHoveredRank(null)}
                    whileHover={{ x: 4 }}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getRankStyle(trader.rank)}`}>
                            {getRankBadge(trader.rank)}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{trader.avatar}</span>
                              <span className="font-bold text-[#C1FF72]">{trader.username}</span>
                            </div>
                            <span className="text-xs text-white/50 font-mono">{formatAddress(trader.address)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#C1FF72]">{formatPnL(trader.totalPnL)}</div>
                          <div className="text-xs text-white/50">{trader.winRate}% Win</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-white/70">
                        <span>{trader.totalTrades} trades</span>
                        <span>Best: {formatPnL(trader.bestTrade)}</span>
                        <span>🔥 {trader.streak}</span>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:contents">
                      <div className="col-span-1 flex items-center justify-center">
                        <motion.span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getRankStyle(trader.rank)}`}
                          whileHover={{ scale: 1.1, rotate: trader.rank <= 3 ? [0, -10, 10, 0] : 0 }}
                          animate={trader.rank === 1 ? { scale: [1, 1.1, 1] } : {}}
                          transition={trader.rank === 1 ? { duration: 1.5, repeat: Infinity } : {}}
                        >
                          {getRankBadge(trader.rank)}
                        </motion.span>
                      </div>
                      <div className="col-span-3 flex items-center gap-3">
                        <span className="text-3xl">{trader.avatar}</span>
                        <div>
                          <div className="font-bold text-[#C1FF72]">{trader.username}</div>
                          <div className="text-xs text-white/50 font-mono">{formatAddress(trader.address)}</div>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <span className={`font-bold text-lg ${trader.totalPnL >= 0 ? 'text-[#C1FF72]' : 'text-red-400'}`}>
                          {formatPnL(trader.totalPnL)}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <div className="flex items-center gap-1">
                          <span className="text-white/80">{trader.winRate}%</span>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="text-white/80">{trader.totalTrades}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="text-[#C1FF72]/80">{formatPnL(trader.bestTrade)}</span>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <motion.div
                          className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-full"
                          animate={trader.streak >= 5 ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <span className="text-orange-400 font-bold">{trader.streak}</span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Your Rank Card */}
          <motion.div
            className="mt-8 p-6 rounded-xl border-4 border-[#C1FF72] bg-gradient-to-r from-[#1800AD]/80 to-[#0a0014]/80 shadow-[6px_6px_0_0_#C1FF72]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🎮</div>
                <div>
                  <h3 className="text-xl font-bold text-[#C1FF72]">Your Ranking</h3>
                  <p className="text-white/60">Connect your wallet to see your position</p>
                </div>
              </div>
              <motion.button
                className="px-6 py-3 bg-[#C1FF72] text-[#1800AD] font-bold rounded-lg border-3 border-[#0a0014] shadow-[4px_4px_0_0_#0a0014]"
                whileHover={{ x: -2, y: -2, boxShadow: '6px 6px 0 0 #0a0014' }}
                whileTap={{ x: 2, y: 2, boxShadow: '2px 2px 0 0 #0a0014' }}
              >
                Connect Wallet
              </motion.button>
            </div>
          </motion.div>

          {/* Fun Facts */}
          <motion.div
            className="mt-8 grid md:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[
              { title: '🎨 Most Creative', desc: 'NyanMaster drew a perfect cat pattern', stat: '+45,000 MNT' },
              { title: '🚀 Biggest Win Today', desc: 'LineWhisperer called the pump', stat: '+12,340 MNT' },
              { title: '🔥 Longest Streak', desc: 'NyanMaster on a 12 win streak!', stat: '12 Wins' },
            ].map((fact, i) => (
              <motion.div
                key={fact.title}
                className="p-5 bg-[#1800AD]/40 border-2 border-[#C1FF72]/50 rounded-xl"
                whileHover={{ scale: 1.02, borderColor: '#C1FF72' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                <h4 className="text-lg font-bold text-[#C1FF72] mb-2">{fact.title}</h4>
                <p className="text-sm text-white/70 mb-2">{fact.desc}</p>
                <span className="text-[#C1FF72] font-bold">{fact.stat}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <Footer />
    </NoiseEffect>
  );
}
