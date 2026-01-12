'use client';

import { useState } from 'react';
import { TradingChart } from '@/components/chart/TradingChart';
import { PatternDrawingBox } from '@/components/chart/PatternDrawingBox';
import { usePredictionDrawing } from '@/hooks/usePredictionDrawing';
import { usePriceData } from '@/hooks/usePriceData';

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
  const [barSpacing, setBarSpacing] = useState(0.2); // Narrower columns by default
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null); // Which future minute to draw on
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

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute);
    clearPrediction(); // Clear any existing drawing when selecting new minute
  };

  const handlePatternComplete = (points: Array<{ x: number; y: number }>, offsetMinutes: number) => {
    if (!priceData || priceData.length === 0 || points.length === 0) return;

    const currentPrice = priceData[priceData.length - 1].value;
    const currentTime = priceData[priceData.length - 1].time;

    // Canvas dimensions from PatternDrawingBox
    const canvasWidth = 600;
    const canvasHeight = 200;

    // Price range: Middle line (Y=100) = current price
    const priceRange = currentPrice * 0.05;
    const minPrice = currentPrice - priceRange; // Bottom of canvas
    const maxPrice = currentPrice + priceRange; // Top of canvas

    // Time: Pattern appears at selected minute and spans 60 seconds
    const futureStartTime = currentTime + (offsetMinutes * 60);

    console.log('=== PATTERN CONVERSION DEBUG ===');
    console.log('Canvas points:', points.length);
    console.log('Current price:', currentPrice.toFixed(4));
    console.log('Price range:', `${minPrice.toFixed(4)} to ${maxPrice.toFixed(4)}`);
    console.log('Current time:', new Date(currentTime * 1000).toLocaleTimeString());
    console.log('Future start time:', new Date(futureStartTime * 1000).toLocaleTimeString());
    console.log('Offset:', offsetMinutes, 'minutes');

    // Sample first, middle, last canvas points
    console.log('Canvas samples:');
    console.log('  First:', points[0]);
    console.log('  Middle:', points[Math.floor(points.length / 2)]);
    console.log('  Last:', points[points.length - 1]);

    // Aggressively sample for speed - max 15 points
    const maxPoints = 15;
    const step = Math.max(1, Math.floor(points.length / maxPoints));
    const sampledPoints = [];
    for (let i = 0; i < points.length; i += step) {
      sampledPoints.push(points[i]);
    }
    // Always include last point
    if (sampledPoints[sampledPoints.length - 1] !== points[points.length - 1]) {
      sampledPoints.push(points[points.length - 1]);
    }

    const predictionPoints = sampledPoints.map((point) => {
      // Map full canvas width (0-600) to 60 seconds - preserves exact shape
      const normalizedX = point.x / canvasWidth; // 0 to 1
      const time = futureStartTime + (normalizedX * 60);

      // Map canvas height to price range - Y=0 is top (maxPrice), Y=200 is bottom (minPrice)
      const normalizedY = point.y / canvasHeight; // 0 to 1
      const price = maxPrice - (normalizedY * (maxPrice - minPrice));

      return {
        x: 0,
        y: 0,
        time: Math.floor(time),
        price: price,
      };
    });

    console.log('Prediction samples:');
    console.log('  First:', { time: new Date(predictionPoints[0].time * 1000).toLocaleTimeString(), price: predictionPoints[0].price.toFixed(4) });
    console.log('  Middle:', { time: new Date(predictionPoints[Math.floor(predictionPoints.length / 2)].time * 1000).toLocaleTimeString(), price: predictionPoints[Math.floor(predictionPoints.length / 2)].price.toFixed(4) });
    console.log('  Last:', { time: new Date(predictionPoints[predictionPoints.length - 1].time * 1000).toLocaleTimeString(), price: predictionPoints[predictionPoints.length - 1].price.toFixed(4) });

    // Show debug info on screen
    setDebugInfo(`Applied ${predictionPoints.length} points. Will appear at ${new Date(futureStartTime * 1000).toLocaleTimeString()} (+${offsetMinutes}min)`);

    console.log('=== APPLYING PREDICTION POINTS ===');
    console.log('Total points:', predictionPoints.length);
    console.log('First point:', predictionPoints[0]);
    console.log('Last point:', predictionPoints[predictionPoints.length - 1]);

    // Apply instantly
    clearPrediction();
    setSelectedMinute(offsetMinutes);

    startDrawing(predictionPoints[0]);
    for (let i = 1; i < predictionPoints.length; i++) {
      addPoint(predictionPoints[i]);
    }
    finishDrawing();
    
    console.log('=== DRAWING COMPLETE ===');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Header - Left aligned like Euphoria */}
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-white">resolv</h1>
        </header>

        {/* Pattern Drawing Box */}
        <PatternDrawingBox onPatternComplete={handlePatternComplete} />

        {/* Main Chart */}
        <div className="bg-[#0a0a0a] rounded-lg border border-pink-500/20 p-4 mb-4 relative">
          {/* Settings Icon - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <button className="w-8 h-8 rounded-full bg-black/60 backdrop-blur border border-pink-500/30 flex items-center justify-center hover:bg-black/80 transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-pink-400"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
              </svg>
            </button>
          </div>
          
          {/* Drawing Indicator - Simplified */}
          {isDrawing && (
            <div className="absolute top-4 right-14 z-20 bg-pink-500/90 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-medium">
              Drawing...
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

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4 text-yellow-400 text-sm">
            {debugInfo}
          </div>
        )}

        {/* Controls - Bottom bar */}
        <div className="flex items-center justify-between bg-black/40 backdrop-blur rounded-lg border border-pink-500/20 p-4">
          <div className="flex items-center gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="w-8 h-8 flex items-center justify-center bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-lg text-pink-400 text-sm font-medium transition-colors"
                title="Zoom Out (Reduce spacing)"
              >
                −
              </button>
              <span className="text-xs text-zinc-400 min-w-[60px] text-center">
                Spacing: {barSpacing.toFixed(1)}
              </span>
              <button
                onClick={handleZoomIn}
                className="w-8 h-8 flex items-center justify-center bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-lg text-pink-400 text-sm font-medium transition-colors"
                title="Zoom In (Increase spacing)"
              >
                +
              </button>
            </div>
            
            {selectedMinute && currentPoints.length > 0 && (
              <>
                <div className="h-4 w-px bg-pink-500/30"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                  <span className="text-sm text-yellow-400">
                    Drawing on +{selectedMinute} min ({currentPoints.length} points)
                  </span>
                </div>
              </>
            )}
            {selectedMinute && currentPoints.length === 0 && (
              <>
                <div className="h-4 w-px bg-pink-500/30"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                  <span className="text-sm text-pink-400">
                    Ready to draw on +{selectedMinute} min
                  </span>
                </div>
              </>
            )}
          </div>
          
          {currentPoints.length > 0 && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-lg text-pink-400 text-sm font-medium transition-colors"
            >
              Clear Drawing
            </button>
          )}

          {currentPoints.length === 0 && !selectedMinute && (
            <div className="text-sm text-zinc-400">
              Select a future minute above to start drawing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
