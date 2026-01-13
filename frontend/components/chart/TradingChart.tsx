'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { usePriceData } from '@/hooks/usePriceData';
import { ChartCanvas, ChartCanvasRef } from './ChartCanvas';
import { PredictionOverlay } from './PredictionOverlay';
import { NyanCat, RainbowPathTrail } from './NyanCat';
import type { PredictionPoint } from '@/types/prediction';
import type { PricePoint } from '@/types/price';
import type { Time } from 'lightweight-charts';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = usePriceData();
  const [overlapPoints, setOverlapPoints] = useState<Array<{ time: number; price: number }>>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [nyanPosition, setNyanPosition] = useState<{ x: number; y: number } | null>(null);
  const [rainbowTrailPoints, setRainbowTrailPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Track client-side mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Get current time from latest data point
  const currentTime = data.length > 0 ? data[data.length - 1].time : undefined;
  const currentPrice = data.length > 0 ? data[data.length - 1].value : null;

  // Update Nyan Cat position and rainbow trail based on price data
  useEffect(() => {
    if (!chartRef.current?.chart || !chartRef.current?.series || data.length === 0) {
      return;
    }

    const updatePositions = () => {
      try {
        const chart = chartRef.current?.chart;
        const series = chartRef.current?.series;
        const chartContainer = chartRef.current?.container;
        if (!chart || !series || !chartContainer) return;

        const timeScale = chart.timeScale();
        
        // Get the chart container's position relative to its parent
        // The parent is the div with position: relative that contains ChartCanvas and overlays
        const chartRect = chartContainer.getBoundingClientRect();
        const parentElement = chartContainer.parentElement;
        if (!parentElement) return;
        
        const parentRect = parentElement.getBoundingClientRect();
        const offsetX = chartRect.left - parentRect.left;
        const offsetY = chartRect.top - parentRect.top;
        
        // Convert ALL price points to pixel coordinates for the rainbow trail
        const trailPoints: Array<{ x: number; y: number }> = [];
        
        // Use ALL data points for the full rainbow trail
        for (const point of data) {
          const x = timeScale.timeToCoordinate(point.time as Time);
          const y = series.priceToCoordinate(point.value);
          
          // Adjust coordinates to be relative to the parent container (where NyanCat is positioned)
          if (x !== null && y !== null) {
            trailPoints.push({ 
              x: x + offsetX, 
              y: y + offsetY 
            });
          }
        }
        
        setRainbowTrailPoints(trailPoints);
        
        // Position cat at the end of the rainbow trail (current price point)
        // Cat's tail should connect seamlessly to the rainbow
        if (trailPoints.length > 0) {
          const lastPoint = trailPoints[trailPoints.length - 1];
          
          // Position cat at the last price point - tail connects to rainbow
          setNyanPosition({
            x: lastPoint.x,
            y: lastPoint.y
          });
        }
      } catch (e) {
        // Chart not ready yet
      }
    };

    // Update immediately and on scroll/zoom
    updatePositions();
    
    const interval = setInterval(updatePositions, 50);
    
    // Also update on visible range changes
    const handleVisibleRangeChange = () => {
      updatePositions();
    };
    
    if (chartRef.current?.chart) {
      chartRef.current.chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    }
    
    return () => {
      clearInterval(interval);
      if (chartRef.current?.chart) {
        chartRef.current.chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      }
    };
  }, [data]);


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
      <div className="flex items-center justify-center w-full h-[250px] sm:h-[300px] md:h-[350px] bg-zinc-900 rounded-lg">
        <div className="text-center px-4">
          <p className="text-red-500 mb-2 text-sm">Error loading price data</p>
          <p className="text-xs text-zinc-400">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-[250px] sm:h-[300px] md:h-[350px] bg-zinc-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-pink-500 mx-auto mb-3" />
          <p className="text-zinc-400 text-xs sm:text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Current Price Display - Top Left (only after hydration to avoid mismatch) */}
      {isMounted && currentPrice && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-30 flex items-center gap-1.5 bg-black/70 backdrop-blur px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-pink-500/30">
          <span className="text-pink-400 font-bold text-sm sm:text-base">
            ${currentPrice.toFixed(4)}
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
        
        {/* Rainbow trail - ends at the cat's pop-tart body like original Nyan Cat */}
        {isMounted && rainbowTrailPoints.length > 1 && nyanPosition && (
          <RainbowPathTrail 
            points={rainbowTrailPoints} 
            catX={nyanPosition.x} 
            strokeWidth={isMobile ? 10 : 14} 
          />
        )}
        
        {/* Nyan Cat at current price - rainbow connects to pop-tart body */}
        {isMounted && nyanPosition && (
          <NyanCat 
            x={nyanPosition.x} 
            y={nyanPosition.y} 
            size={isMobile ? 0.35 : 0.5} 
            isMobile={isMobile}
          />
        )}
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
