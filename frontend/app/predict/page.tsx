'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingChart } from '@/components/chart/TradingChart';
import { PatternDrawingBox } from '@/components/chart/PatternDrawingBox';
import { usePredictionDrawing } from '@/hooks/usePredictionDrawing';
import { usePriceData } from '@/hooks/usePriceData';
import { Header, BottomControls } from '@/components/layout';
import { NoiseEffect } from '@/components/ui/NoiseEffect';
import SplashCursor from '@/components/ui/SplashCursor';

export const dynamic = 'force-dynamic';

// Props are intentionally not used - they're passed by Next.js but we don't need them
export default function PredictPage() {
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

  const handlePatternComplete = (points: Array<{ x: number; y: number }>, offsetMinutes: number) => {
    if (!priceData || priceData.length === 0 || points.length === 0) return;

    const currentPrice = priceData[priceData.length - 1].value;

    const canvasWidth = 600;
    const canvasHeight = 200;

    const priceRange = currentPrice * 0.05;
    const minPrice = currentPrice - priceRange;
    const maxPrice = currentPrice + priceRange;

    // Use current REAL time instead of data timestamp
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const futureStartTime = nowInSeconds + (offsetMinutes * 60);

    const maxPoints = 15;
    const step = Math.max(1, Math.floor(points.length / maxPoints));
    const sampledPoints = [];
    for (let i = 0; i < points.length; i += step) {
      sampledPoints.push(points[i]);
    }
    if (sampledPoints[sampledPoints.length - 1] !== points[points.length - 1]) {
      sampledPoints.push(points[points.length - 1]);
    }

    const predictionPoints = sampledPoints.map((point) => {
      const normalizedX = point.x / canvasWidth;
      const time = futureStartTime + (normalizedX * 60);

      const normalizedY = point.y / canvasHeight;
      const price = maxPrice - (normalizedY * (maxPrice - minPrice));

      return {
        x: 0,
        y: 0,
        time: Math.floor(time),
        price: price,
        canvasX: point.x,
        canvasY: point.y,
      };
    });

    setDebugInfo(`+${offsetMinutes}min @ ${new Date(futureStartTime * 1000).toLocaleTimeString()}`);

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
            <PatternDrawingBox onPatternComplete={handlePatternComplete} />
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
                <span className="font-mono text-sm sm:text-base text-[#C1FF72] tracking-tight">0.000 MNT</span>
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
                <span className="font-mono text-sm sm:text-base text-[#C1FF72] tracking-tight">+0.00</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Status Info */}
        <AnimatePresence>
          {debugInfo && (
            <motion.div
              className="relative overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#C1FF72]/20 via-[#1800AD]/20 to-[#C1FF72]/20 animate-pulse" />
              <div className="relative flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0014]/60 border-2 border-[#C1FF72] rounded-xl">
                <motion.span
                  className="text-lg"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  🎯
                </motion.span>
                <span className="text-sm font-bold text-[#C1FF72]">
                  Prediction Set: {debugInfo}
                </span>
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
