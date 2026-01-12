'use client';

import { useRef, useState, MouseEvent, useCallback } from 'react';

interface PatternPoint {
  x: number;
  y: number;
}

interface PatternDrawingBoxProps {
  onPatternComplete: (points: PatternPoint[], offsetMinutes: number) => void;
}

export function PatternDrawingBox({ onPatternComplete }: PatternDrawingBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<PatternPoint[]>([]);
  const [selectedOffset, setSelectedOffset] = useState(1); // Default 1 minute

  const startDrawing = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setPoints([{ x, y }]);

    // Draw initial point
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const draw = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Only allow left-to-right drawing
    if (points.length > 0 && x <= points[points.length - 1].x) {
      return;
    }

    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    setPoints(prev => [...prev, { x, y }]);
  }, [isDrawing, points]);

  const finishDrawing = useCallback(() => {
    if (isDrawing && points.length > 1) {
      setIsDrawing(false);
    }
  }, [isDrawing, points]);

  const handleApply = () => {
    if (points.length > 1) {
      onPatternComplete(points, selectedOffset);
      handleClear();
    }
  };

  const handleClear = () => {
    setPoints([]);
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-pink-500/20 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white mb-2">Draw Pattern</h3>
        <p className="text-xs text-zinc-400 mb-3">
          Draw your price pattern. Middle line = current price (±5% range). Select when it should appear (1-5 min).
        </p>
      </div>

      {/* Drawing Canvas */}
      <div className="relative mb-3">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-[200px] bg-black/60 rounded-lg border border-pink-500/30 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
        />
        {/* Current price guide line */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-pink-500/30 relative">
            <span className="absolute right-2 -top-4 text-[10px] text-pink-500/50">← Current Price</span>
          </div>
        </div>
        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-zinc-500">Click and drag to draw pattern →</p>
          </div>
        )}
      </div>

      {/* Time Offset Selector */}
      <div className="mb-3">
        <label className="text-xs text-zinc-400 mb-2 block">When should this pattern appear?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((minutes) => (
            <button
              key={minutes}
              onClick={() => setSelectedOffset(minutes)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedOffset === minutes
                  ? 'bg-pink-500 text-white'
                  : 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/50'
              }`}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={points.length < 2}
          className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-500/20 disabled:text-pink-400/50 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
        >
          Apply to Chart
        </button>
        <button
          onClick={handleClear}
          disabled={points.length === 0}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
