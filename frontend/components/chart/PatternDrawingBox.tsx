'use client';

import { useRef, useState, MouseEvent, TouchEvent, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { SlotMachineLeverButton } from '@/components/ui/SlotMachineLever';

interface PatternPoint {
  x: number;
  y: number;
}

interface PatternDrawingBoxProps {
  onPatternComplete: (points: PatternPoint[], offsetMinutes: number) => void;
  amount: number;
  leverage: number;
  onAmountChange: (amount: number) => void;
  onLeverageChange: (leverage: number) => void;
}

export function PatternDrawingBox({
  onPatternComplete,
  amount,
  leverage,
  onAmountChange,
  onLeverageChange,
}: PatternDrawingBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
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
    ctx.fillStyle = '#C1FF72';
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

    ctx.strokeStyle = '#C1FF72';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#C1FF72';
    ctx.shadowBlur = 10;

    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }

    setPoints(prev => [...prev, coords]);
  }, [isDrawing, points, getCanvasCoordinates]);

  const redrawCanvas = useCallback((pointsToDraw: PatternPoint[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || pointsToDraw.length === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pointsToDraw.length === 1) {
      // Draw single point
      ctx.fillStyle = '#C1FF72';
      ctx.shadowColor = '#C1FF72';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(pointsToDraw[0].x, pointsToDraw[0].y, 4, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    // Draw path
    ctx.strokeStyle = '#C1FF72';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#C1FF72';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);
    for (let i = 1; i < pointsToDraw.length; i++) {
      ctx.lineTo(pointsToDraw[i].x, pointsToDraw[i].y);
    }
    ctx.stroke();
  }, []);

  // Easing function for smooth animation (ease-out cubic)
  const easeOutCubic = useCallback((t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  const finishDrawing = useCallback(() => {
    if (isDrawing && points.length > 1) {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsDrawing(false);
        return;
      }

      // Calculate the current x range of the drawing
      const xValues = points.map(p => p.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const xRange = maxX - minX;

      // If the drawing already spans the full width (or very close), don't stretch
      if (xRange < 10) {
        setIsDrawing(false);
        return;
      }

      // Calculate stretched points
      const canvasWidth = canvas.width;
      const originalPoints = [...points];
      const stretchedPoints: PatternPoint[] = points.map(point => {
        // Normalize x to 0-1 range based on current min/max
        const normalizedX = (point.x - minX) / xRange;
        // Scale to full canvas width
        const stretchedX = normalizedX * canvasWidth;
        // Keep y coordinate unchanged
        return { x: stretchedX, y: point.y };
      });

      setIsDrawing(false);

      // Animate the stretch transition
      const duration = 400; // milliseconds
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        // Interpolate between original and stretched points
        const animatedPoints: PatternPoint[] = originalPoints.map((point, index) => {
          const originalX = point.x;
          const stretchedX = stretchedPoints[index].x;
          const animatedX = originalX + (stretchedX - originalX) * easedProgress;
          return { x: animatedX, y: point.y };
        });

        // Redraw canvas with animated points
        redrawCanvas(animatedPoints);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete - set final stretched points
          setPoints(stretchedPoints);
          animationFrameRef.current = null;
        }
      };

      // Cancel any existing animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isDrawing, points, redrawCanvas, easeOutCubic]);

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
    // Cancel any ongoing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
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

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <motion.div 
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#C1FF72] via-[#1800AD] to-[#C1FF72] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500 animate-pulse" />

      <div className="relative bg-[#0a0014] rounded-2xl border-4 border-[#C1FF72] p-3 sm:p-4 shadow-[6px_6px_0_0_#1800AD]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-8 h-8 flex items-center justify-center bg-[#C1FF72] rounded-lg shadow-[2px_2px_0_0_#1800AD]"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <span className="text-sm">✏️</span>
            </motion.div>
          </div>
          <h3 
            className="text-xl font-bold text-[#C1FF72]"
            style={{ textShadow: '2px 2px 0 #1800AD' }}
          >
            Draw your futures
          </h3>
          <AnimatePresence>
            {points.length > 0 && (
              <motion.span 
                className="text-[10px] font-bold text-[#1800AD] bg-[#C1FF72] px-2.5 py-1 rounded-full border-2 border-[#1800AD]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {points.length} pts
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Drawing Canvas - Nyan style */}
        <div className="relative mb-4">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C1FF72]/50 to-[#1800AD]/50 rounded-xl blur-sm opacity-50" />
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="relative w-full h-[150px] sm:h-[200px] bg-[#1800AD]/30 rounded-xl border-3 border-[#C1FF72]/50 cursor-crosshair touch-none shadow-[inset_0_2px_0_0_rgba(0,0,0,0.6)]"
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
            <div className="w-[95%] h-[1px] bg-gradient-to-r from-transparent via-[#C1FF72]/40 to-transparent relative">
              <span className="absolute right-0 -top-3 text-[8px] text-[#C1FF72]/50 font-medium">current</span>
            </div>
          </div>
          <AnimatePresence>
            {points.length === 0 && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2 text-[#C1FF72]/60">
                  <span className="text-xs font-bold">Draw your prediction</span>
                  <motion.span 
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    →
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time Selector - Pixel Art Casino Chips */}
        <div className="mb-3">
          <p className="text-[13px] text-[#C1FF72]/70 font-bold mb-2 uppercase tracking-wider">
            Choose time horizon and resolve your drawing
          </p>
          <div className="flex gap-0.5 sm:gap-2 md:gap-3 justify-between">
            {[1, 2, 3, 4, 5].map((min) => (
              <motion.button
                key={min}
                onClick={() => setSelectedOffset(min)}
                className={`
                  relative flex-shrink-0 -my-5
                  w-[60px] h-[60px] 
                  md:w-[160px] md:h-[160px] 
                  transition-all duration-200
                  ${selectedOffset === min
                    ? 'drop-shadow-[0_0_20px_#C1FF72] scale-110'
                    : 'opacity-70 hover:opacity-100'
                  }
                `}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                }}
                title={`${min} minute${min > 1 ? 's' : ''}`}
                whileHover={{ scale: selectedOffset === min ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={`/${min}min.png`}
                  alt={`${min} minute${min > 1 ? 's' : ''}`}
                  width={160}
                  height={160}
                  className="w-full h-full object-contain"
                  style={{
                    imageRendering: 'pixelated',
                  }}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action Buttons - Nyan style */}
        <div className="flex items-center gap-3">
          <SlotMachineLeverButton
            text="RESOLV"
            onClick={handleApply}
            disabled={points.length < 2}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <motion.input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => onAmountChange(Number(e.target.value) || 0)}
              className="w-20 px-3 py-2 bg-[#1800AD] hover:bg-[#1800AD]/80 border-3 border-[#C1FF72] rounded-xl text-[#C1FF72] text-sm font-bold shadow-[3px_3px_0_0_#C1FF72] focus:outline-none focus:bg-[#1800AD]/90"
              whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
              whileFocus={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
            />
            <motion.select
              value={leverage}
              onChange={(e) => onLeverageChange(Number(e.target.value))}
              className="px-3 py-2 bg-[#1800AD] hover:bg-[#1800AD]/80 border-3 border-[#C1FF72] rounded-xl text-[#C1FF72] text-sm font-bold shadow-[3px_3px_0_0_#C1FF72] focus:outline-none focus:bg-[#1800AD]/90 [&>option]:bg-[#1800AD] [&>option]:text-[#C1FF72]"
              whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
              whileFocus={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
            >
              {[100, 200, 500, 1000, 1500, 2000, 2500].map((lev) => (
                <option key={lev} value={lev}>
                  {lev}x
                </option>
              ))}
            </motion.select>
          </div>
          <motion.button
            onClick={handleClear}
            disabled={points.length === 0}
            className="px-4 py-3 bg-[#1800AD] hover:bg-[#1800AD]/80 border-3 border-[#C1FF72] rounded-xl text-[#C1FF72] text-sm font-bold shadow-[3px_3px_0_0_#C1FF72] disabled:opacity-30 disabled:cursor-not-allowed"
            whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 0 #C1FF72' }}
            whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 0 #C1FF72' }}
          >
            ✕
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
