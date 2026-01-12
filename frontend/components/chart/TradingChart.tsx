'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { usePriceData } from '@/hooks/usePriceData';
import { ChartCanvas, ChartCanvasRef } from './ChartCanvas';
import { PredictionOverlay } from './PredictionOverlay';
import type { PredictionPoint } from '@/types/prediction';
import type { PricePoint } from '@/types/price';

interface TradingChartProps {
  isDark?: boolean;
  isDrawing: boolean;
  isConfirmed: boolean;
  currentPoints: PredictionPoint[];
  selectedMinute?: number | null; // Which future minute to draw on
  onStartDrawing: (point: PredictionPoint) => void;
  onAddPoint: (point: PredictionPoint) => void;
  onFinishDrawing: () => void;
  barSpacing?: number;
  onPriceRangeReady?: (currentPrice: number, priceRange: number) => void;
}

export function TradingChart({
  isDark = false,
  isDrawing,
  isConfirmed,
  currentPoints,
  selectedMinute,
  onStartDrawing,
  onAddPoint,
  onFinishDrawing,
  barSpacing = 0.5,
}: TradingChartProps) {
  const chartRef = useRef<ChartCanvasRef>(null);
  const { data, isLoading, error } = usePriceData();
  const [overlapPoints, setOverlapPoints] = useState<Array<{ time: number; price: number }>>([]);
  
  // Get current time from latest data point
  const currentTime = data.length > 0 ? data[data.length - 1].time : undefined;


  // Interpolate prediction curve to get predicted price at a specific time
  const interpolatePrediction = useCallback((time: number, points: PredictionPoint[]): number | null => {
    if (points.length === 0) return null;
    
    // Sort points by time to ensure correct interpolation
    const sortedPoints = [...points].sort((a, b) => a.time - b.time);
    
    // Check if time is outside prediction range
    if (time < sortedPoints[0].time || time > sortedPoints[sortedPoints.length - 1].time) {
      return null;
    }
    
    // Find the two points to interpolate between
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];
      
      if (time >= p1.time && time <= p2.time) {
        // Linear interpolation
        const t = (time - p1.time) / (p2.time - p1.time);
        const predictedPrice = p1.price + (p2.price - p1.price) * t;
        return predictedPrice;
      }
    }
    
    return null;
  }, []);

  // Detect overlap between prediction and actual prices
  useEffect(() => {
    if (currentPoints.length === 0 || data.length === 0 || currentTime === undefined) {
      setOverlapPoints([]);
      return;
    }

    // Sort prediction points by time
    const sortedPredictionPoints = [...currentPoints].sort((a, b) => a.time - b.time);
    const predictionStartTime = sortedPredictionPoints[0]?.time;
    const predictionEndTime = sortedPredictionPoints[sortedPredictionPoints.length - 1]?.time;
    
    if (!predictionStartTime || !predictionEndTime) {
      setOverlapPoints([]);
      return;
    }

    const overlaps: Array<{ time: number; price: number }> = [];
    const priceTolerance = 0.005; // 0.5% price tolerance (tighter)
    const minTimeGap = 5; // Minimum 5 seconds between overlap marks (prevents excessive marking)
    
    // Filter data to only check points that are in the prediction time range
    // We check all prices within the prediction window, regardless of current time
    const relevantData = data.filter((p) => 
      p.time >= predictionStartTime && 
      p.time <= predictionEndTime
    );
    
    let lastMarkedTime: number | null = null;
    
    // Track previous state to detect crossings
    let prevActualPrice: number | null = null;
    let prevPredictedPrice: number | null = null;
    
    for (const pricePoint of relevantData) {
      const predictedPrice = interpolatePrediction(pricePoint.time, sortedPredictionPoints);
      
      if (predictedPrice === null) continue;
      
      const priceDiff = Math.abs(predictedPrice - pricePoint.value);
      const pricePercent = priceDiff / pricePoint.value;
      
      // Detect if price is close to prediction
      const isClose = pricePercent < priceTolerance;
      
      // Detect crossing: price goes from above to below or vice versa
      let isCrossing = false;
      if (prevActualPrice !== null && prevPredictedPrice !== null) {
        const wasAbove = prevActualPrice > prevPredictedPrice;
        const isAbove = pricePoint.value > predictedPrice;
        isCrossing = wasAbove !== isAbove;
      }
      
      // Mark overlap if:
      // 1. Price is close to prediction AND
      // 2. (It's a crossing OR it's the first point close to prediction) AND
      // 3. Enough time has passed since last mark
      if (isClose && (isCrossing || lastMarkedTime === null) && 
          (lastMarkedTime === null || (pricePoint.time - lastMarkedTime) >= minTimeGap)) {
        overlaps.push({
          time: pricePoint.time,
          price: pricePoint.value,
        });
        lastMarkedTime = pricePoint.time;
      }
      
      prevActualPrice = pricePoint.value;
      prevPredictedPrice = predictedPrice;
    }

    setOverlapPoints(overlaps);
  }, [currentPoints, data, currentTime, interpolatePrediction]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-[600px] bg-zinc-100 dark:bg-zinc-900 rounded-lg">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading price data</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-[600px] bg-zinc-100 dark:bg-zinc-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading price data...</p>
        </div>
      </div>
    );
  }

  const currentPrice = data.length > 0 ? data[data.length - 1].value : null;

  return (
    <div className="relative w-full">
      {/* Current Price Display - Top Left */}
      {currentPrice && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-pink-500/30">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="text-pink-400"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-pink-400 font-semibold text-lg">
            {currentPrice.toFixed(2)}
          </span>
        </div>
      )}

            <div className="relative" style={{ position: 'relative', zIndex: 1 }}>
              <ChartCanvas ref={chartRef} data={data} isDark={isDark} barSpacing={barSpacing} />
              <PredictionOverlay
              chartRef={chartRef as React.RefObject<{ chart: any; series: any }>}
              isDrawing={isDrawing}
              isConfirmed={isConfirmed}
              points={currentPoints}
              overlapPoints={overlapPoints}
              currentTime={currentTime}
              currentPrice={currentPrice ?? undefined}
              selectedMinute={selectedMinute}
              onStartDrawing={onStartDrawing}
              onAddPoint={onAddPoint}
              onFinishDrawing={onFinishDrawing}
            />
            </div>

      {/* Overlap counter */}
      {overlapPoints.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-pink-500/90 backdrop-blur px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg">
          ✓ {overlapPoints.length} match{overlapPoints.length !== 1 ? 'es' : ''}
        </div>
      )}
    </div>
  );
}
