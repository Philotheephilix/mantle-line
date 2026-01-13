'use client';

import { useState } from 'react';
import { TradingChart } from '@/components/chart/TradingChart';
import { PatternDrawingBox } from '@/components/chart/PatternDrawingBox';
import { usePredictionDrawing } from '@/hooks/usePredictionDrawing';
import { usePriceData } from '@/hooks/usePriceData';

// Props are intentionally not used - they're passed by Next.js but we don't need them
export default function PredictPage(_props: { params?: unknown; searchParams?: unknown }) {
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
    const currentTime = priceData[priceData.length - 1].time;

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
    <div
      className="min-h-screen text-white pb-24 relative overflow-hidden"
      style={{
        backgroundImage: "url('/92338017c079bea4f1250ed4a3056117.gif')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center top',
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Subtle glows atop gif */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/3 w-[420px] h-[420px] bg-amber-600/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-5%] right-1/4 w-[360px] h-[360px] bg-red-700/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-[260px] h-[260px] bg-yellow-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header - God Casino style (no chart changes) */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0c0a06]/85 border-b border-amber-700/40 shadow-[0_2px_0_0_rgba(0,0,0,0.6)]">
        <div className="px-4 py-3 sm:py-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Logo with divine glow */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-amber-400/40 blur-lg opacity-60" />
                <h1
                  className="relative text-xl sm:text-2xl font-black tracking-tight"
                  style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(90deg,#f5e8c6,#d4b56a)', WebkitBackgroundClip: 'text', color: 'transparent' }}
                >
                  RESOLV
                </h1>
              </div>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-black rounded-full uppercase tracking-wider">
                Beta
              </span>
            </div>

            {/* Right side - Connect Wallet & Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Connect Wallet Button - Pixelated */}
              <button
                className="relative px-3 py-2 sm:px-4 sm:py-2.5 border-3 border-amber-700/60 bg-[#0f0c14] rounded-lg shadow-[0_2px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all duration-150 group"
                style={{
                  imageRendering: 'pixelated',
                }}
              >
                {/* Pixel art inner border */}
                <div className="absolute inset-[3px] border border-dashed border-amber-600/30 rounded-md pointer-events-none" />

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

                {/* Button content */}
                <div className="relative flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-amber-600/50 bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-amber-900" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                    Connect
                  </span>
                </div>
              </button>

              {/* Status badge */}
              {currentPoints.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-500/50" />
                  <span className="text-xs font-semibold text-amber-400">
                    +{selectedMinute}m
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-3 py-4 sm:px-4 sm:py-6 max-w-6xl mx-auto space-y-4">
        {/* Pattern Drawing Box */}
        <PatternDrawingBox onPatternComplete={handlePatternComplete} />

        {/* Main Chart Card - Casino style */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />

          <div className="relative bg-gradient-to-b from-[#0b0a0f] to-[#0c0a11] rounded-2xl border border-amber-700/30 p-3 sm:p-4 overflow-hidden shadow-[0_2px_0_0_rgba(0,0,0,0.6)]">
            {/* Subtle inner glow (keep chart untouched) */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent pointer-events-none" />

            {/* Drawing Indicator */}
            {isDrawing && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-full shadow-lg shadow-amber-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Live</span>
              </div>
            )}
            
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
        </div>

        {/* Wallet Balance & Profit - pixel art style */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base text-gray-300 font-semibold whitespace-nowrap">My Balance:</span>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-1">
            {/* Wallet pill - pixel look */}
            <div className="flex-1 max-w-sm">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border-2 border-[#5c4a2c] bg-[#0d0b11] shadow-[0_2px_0_0_#000]">
                <img
                  src="/wallet.png"
                  alt="Wallet"
                  className="w-9 h-9 sm:w-10 sm:h-10"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span className="font-mono text-sm sm:text-base text-gray-200 tracking-tight">0.000 SOL</span>
              </div>
            </div>

            {/* Profit pill - pixel look */}
            <div className="flex-1 max-w-sm">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border-2 border-[#b07a1f] bg-[#0d0b11] shadow-[0_2px_0_0_#000]">
                <img
                  src="/coin stack.png"
                  alt="Profit"
                  className="w-9 h-9 sm:w-10 sm:h-10"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span className="font-mono text-sm sm:text-base text-gray-200 tracking-tight">+0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Info */}
        {debugInfo && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 animate-pulse" />
            <div className="relative flex items-center justify-center gap-2 px-4 py-3 bg-black/40 border border-amber-500/30 rounded-xl">
              <span className="text-lg">🎯</span>
              <span className="text-sm font-bold text-amber-400">
                Prediction Set: {debugInfo}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls - God casino bar (chart untouched) */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050308] via-[#07050d]/95 to-transparent" />
        <div className="relative px-4 py-4 sm:py-5 border-t border-amber-700/30 shadow-[0_-2px_0_0_rgba(0,0,0,0.6)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="w-11 h-11 flex items-center justify-center bg-[#0f0c14] border-2 border-amber-700/40 rounded-md text-amber-200 text-xl font-bold transition-all duration-200 shadow-[0_2px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px]"
              >
                −
              </button>
              <button
                onClick={handleZoomIn}
                className="w-11 h-11 flex items-center justify-center bg-[#0f0c14] border-2 border-amber-700/40 rounded-md text-amber-200 text-xl font-bold transition-all duration-200 shadow-[0_2px_0_0_rgba(0,0,0,0.6)] hover:translate-y-[-1px]"
              >
                +
              </button>
            </div>

            {/* Status - Center */}
            <div className="flex-1 text-center">
              {selectedMinute && currentPoints.length > 0 ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-full">
                  <span className="text-amber-400 animate-pulse">●</span>
                  <span className="text-sm font-semibold text-amber-400">
                    +{selectedMinute}m Active
                  </span>
                </div>
              ) : (
                <span className="text-sm text-amber-400/60 font-medium">
                  Draw your prediction ↑
                </span>
              )}
            </div>

            {/* Clear Button - Casino danger style */}
            {currentPoints.length > 0 && (
              <button
                onClick={handleClear}
                className="px-5 py-2.5 bg-gradient-to-b from-red-600/30 to-red-900/30 hover:from-red-500/40 hover:to-red-800/40 active:from-red-700/50 active:to-red-900/50 border border-red-500/40 rounded-xl text-red-400 text-sm font-bold transition-all duration-200 shadow-lg shadow-red-900/20"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
