'use client';

import { useRef, useState, MouseEvent, TouchEvent, useCallback } from 'react';
import { SlotMachineLeverButton } from '@/components/ui/SlotMachineLever';

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
  const [selectedOffset, setSelectedOffset] = useState(1);

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
  }, []);

  const startDrawing = useCallback((clientX: number, clientY: number) => {
    const coords = getCanvasCoordinates(clientX, clientY);
    if (!coords) return;

    setIsDrawing(true);
    setPoints([coords]);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }, [getCanvasCoordinates]);

  const draw = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing) return;

    const coords = getCanvasCoordinates(clientX, clientY);
    if (!coords) return;

    // Only allow left-to-right drawing
    if (points.length > 0 && coords.x <= points[points.length - 1].x) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }

    setPoints(prev => [...prev, coords]);
  }, [isDrawing, points, getCanvasCoordinates]);

  const finishDrawing = useCallback(() => {
    if (isDrawing && points.length > 1) {
      setIsDrawing(false);
    }
  }, [isDrawing, points]);

  // Mouse events
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    startDrawing(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    draw(e.clientX, e.clientY);
  };

  // Touch events for mobile
  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    finishDrawing();
  };

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
    <div className="relative group">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />

      <div className="relative bg-gradient-to-b from-[#1a1510] to-[#0f0a08] rounded-2xl border border-amber-700/30 p-3 sm:p-4 shadow-[0_2px_0_0_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg shadow-lg shadow-amber-500/20">
              <span className="text-sm">✏️</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white">Draw your futures</h3>
          {points.length > 0 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
              {points.length} pts
            </span>
          )}
        </div>

        {/* Drawing Canvas - Casino card style */}
        <div className="relative mb-4">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/50 to-yellow-600/50 rounded-xl blur-sm opacity-50" />
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="relative w-full h-[100px] sm:h-[130px] bg-gradient-to-b from-[#0a0805] to-[#050402] rounded-xl border border-amber-700/30 cursor-crosshair touch-none shadow-[inset_0_2px_0_0_rgba(0,0,0,0.6)]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={finishDrawing}
            onMouseLeave={finishDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          {/* Current price guide line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[95%] h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent relative">
              <span className="absolute right-0 -top-3 text-[8px] text-amber-400/50 font-medium">current</span>
            </div>
          </div>
          {points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 text-amber-400/40">
                <span className="text-xs font-medium">Draw your prediction</span>
                <span className="animate-pulse">→</span>
              </div>
            </div>
          )}
        </div>

        {/* Time Selector - Pixel Art Casino Chips */}
        <div className="mb-3">
          <p className="text-[15px] text-amber-400/60 font-medium mb-2 uppercase tracking-wider">Choose time horizon and resolve your drawing</p>
          <div className="flex gap-0.5 sm:gap-2 md:gap-3 justify-between">
            {[1, 2, 3, 4, 5].map((min) => (
              <button
                key={min}
                onClick={() => setSelectedOffset(min)}
                className={`
                  relative flex-shrink-0 -my-5
                  w-[60px] h-[60px] 
                  md:w-[160px] md:h-[160px] 
                  transition-all duration-200
                  ${selectedOffset === min
                    ? 'drop-shadow-[0_0_20px_rgba(245,158,11,0.9)] scale-110'
                    : 'opacity-80 hover:opacity-100 hover:scale-105 active:scale-95'
                  }
                `}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                }}
                title={`${min} minute${min > 1 ? 's' : ''}`}
              >
                <img
                  src={`/${min}min.png`}
                  alt={`${min} minute${min > 1 ? 's' : ''}`}
                  className="w-full h-full object-contain"
                  style={{
                    imageRendering: 'pixelated',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons - Slot Machine style */}
        <div className="flex items-center gap-3">
          <SlotMachineLeverButton
            text="RESOLV"
            onClick={handleApply}
            disabled={points.length < 2}
            className="flex-1"
          />
          <button
            onClick={handleClear}
            disabled={points.length === 0}
            className="px-4 py-3 bg-gradient-to-b from-zinc-700/50 to-zinc-900/50 hover:from-zinc-600/50 hover:to-zinc-800/50 active:from-zinc-800/50 disabled:opacity-30 border border-zinc-600/30 rounded-xl text-zinc-300 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
