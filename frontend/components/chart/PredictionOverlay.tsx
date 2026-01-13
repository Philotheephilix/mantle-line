'use client';

import { useRef, useCallback, MouseEvent, useState, useEffect } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { PredictionPoint } from '@/types/prediction';

interface PredictionOverlayProps {
  chartRef: React.RefObject<{
    chart: IChartApi | null;
    series: ISeriesApi<any> | null;
  }>;
  isDrawing: boolean;
  isConfirmed: boolean;
  points: PredictionPoint[];
  overlapPoints?: Array<{ time: number; price: number }>;
  currentTime?: number; // Current time from latest price data
  currentPrice?: number; // Current price for calculating Y coordinates
  selectedMinute?: number | null; // Which future minute to draw on
  onStartDrawing: (point: PredictionPoint) => void;
  onAddPoint: (point: PredictionPoint) => void;
  onFinishDrawing: () => void;
}

export function PredictionOverlay({
  chartRef,
  isDrawing,
  isConfirmed,
  points,
  overlapPoints = [],
  currentTime,
  currentPrice,
  selectedMinute,
  onStartDrawing,
  onAddPoint,
  onFinishDrawing,
}: PredictionOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate the time range for the selected minute
  const getDrawingTimeRange = useCallback(() => {
    if (!currentTime || !selectedMinute) return null;

    const startTime = currentTime + (selectedMinute * 60); // Start of selected minute
    const endTime = startTime + 60; // End of selected minute

    return { startTime, endTime };
  }, [currentTime, selectedMinute]);

  const convertToChartCoordinates = useCallback(
    (clientX: number, clientY: number): PredictionPoint | null => {
      if (!svgRef.current) return null;

      const rect = svgRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Try to get chart coordinates if available
      if (chartRef.current?.chart && chartRef.current?.series) {
        try {
          const timeScale = chartRef.current.chart.timeScale();
          const time = timeScale.coordinateToTime(x);
          const logicalPrice = chartRef.current.series.coordinateToPrice(y);

          if (time !== null && logicalPrice !== null) {
            const timeNum = time as number;

            // Check if time is within selected minute range
            const timeRange = getDrawingTimeRange();
            if (timeRange) {
              // Only allow drawing within the selected minute
              if (timeNum < timeRange.startTime || timeNum > timeRange.endTime) {
                return null; // Outside selected minute, reject
              }
            }

            return {
              x,
              y,
              time: timeNum,
              price: logicalPrice,
            };
          }
        } catch (error) {
          console.error('Error converting coordinates:', error);
        }
      }

      return null; // No fallback - require proper chart coordinates
    },
    [chartRef, getDrawingTimeRange]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      if (isConfirmed || !selectedMinute) return; // Must have selected minute

      const point = convertToChartCoordinates(e.clientX, e.clientY);
      if (!point) return; // Point outside selected minute range

      onStartDrawing(point);
    },
    [isConfirmed, selectedMinute, convertToChartCoordinates, onStartDrawing]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      if (!isDrawing || isConfirmed) return;

      const point = convertToChartCoordinates(e.clientX, e.clientY);
      if (!point) return;

      // Validate: X must always increase (no backtracking)
      if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        if (point.x <= lastPoint.x) {
          // Skip this point - only allow forward movement
          return;
        }
      }

      onAddPoint(point);
    },
    [isDrawing, isConfirmed, points, convertToChartCoordinates, onAddPoint]
  );

  const handleMouseUp = useCallback(
    () => {
      if (isDrawing && !isConfirmed) {
        onFinishDrawing();
      }
    },
    [isDrawing, isConfirmed, onFinishDrawing]
  );

  // Convert prediction point to pixel coordinates, preserving exact drawn shape
  const convertToPixelCoordinates = useCallback(
    (point: PredictionPoint, allPoints: PredictionPoint[]): { x: number; y: number } | null => {
      if (!chartRef.current?.chart || !svgRef.current) {
        return null;
      }

      try {
        const timeScale = chartRef.current.chart.timeScale();
        const chartWidth = svgRef.current.clientWidth;
        const chartHeight = svgRef.current.clientHeight;

        // If we have original canvas coordinates, use them to preserve exact shape
        if (point.canvasX !== undefined && point.canvasY !== undefined && allPoints.length > 0) {
          // Find the X position where the drawing should start (based on first point's time)
          const firstPoint = allPoints[0];
          const visibleRange = timeScale.getVisibleRange();
          
          if (visibleRange && firstPoint.time) {
            const timeRangeWidth = (visibleRange.to as number) - (visibleRange.from as number);
            const firstPointOffset = firstPoint.time - (visibleRange.from as number);
            const startX = (firstPointOffset / timeRangeWidth) * chartWidth;
            
            // Original canvas was 600x200, scale to fit chart while preserving aspect ratio
            const canvasWidth = 600;
            const canvasHeight = 200;
            
            // Scale factor: fit the drawing within a reasonable portion of the chart
            // Use the time range to determine X scale
            const drawingDuration = 60; // 1 minute of drawing
            const drawingWidthOnChart = (drawingDuration / timeRangeWidth) * chartWidth;
            const scaleX = drawingWidthOnChart / canvasWidth;
            
            // Use same scale for Y to maintain aspect ratio
            const scaleY = scaleX;
            
            // Calculate X: offset from first point's canvas position + start position
            const relativeCanvasX = point.canvasX - (firstPoint.canvasX ?? 0);
            const xCoord = startX + (relativeCanvasX * scaleX);
            
            // Calculate Y: center the drawing vertically on the chart
            // Canvas Y=100 (middle) should map to chart center
            const canvasMidY = 100;
            const chartMidY = chartHeight / 2;
            const relativeCanvasY = point.canvasY - canvasMidY;
            const yCoord = chartMidY + (relativeCanvasY * scaleY);
            
            return { x: xCoord, y: yCoord };
          }
        }

        // Fallback to time/price based conversion
        const visibleRange = timeScale.getVisibleRange();
        if (visibleRange) {
          const timeRangeWidth = (visibleRange.to as number) - (visibleRange.from as number);
          const timeOffset = point.time - (visibleRange.from as number);
          const xCoord = (timeOffset / timeRangeWidth) * chartWidth;
          const yCoord = chartHeight / 2; // Default to center if no canvas coords
          return { x: xCoord, y: yCoord };
        }

        return null;
      } catch (error) {
        console.error('Error converting coordinates:', error);
        return null;
      }
    },
    [chartRef]
  );

  // Generate smooth Catmull-Rom spline curve like the reference image
  const generateSmoothPath = useCallback((points: PredictionPoint[]): string => {
    if (points.length === 0) return '';

    // Convert all points to current pixel coordinates, passing all points for reference
    const pixelPoints = points
      .map(p => convertToPixelCoordinates(p, points))
      .filter(p => p !== null) as { x: number; y: number }[];

    if (pixelPoints.length === 0) return '';
    if (pixelPoints.length === 1) return `M ${pixelPoints[0].x},${pixelPoints[0].y}`;
    if (pixelPoints.length === 2) return `M ${pixelPoints[0].x},${pixelPoints[0].y} L ${pixelPoints[1].x},${pixelPoints[1].y}`;

    // Sample points for smooth curve
    const sampledPoints = [];
    const sampleRate = Math.max(1, Math.floor(pixelPoints.length / 20)); // Sample every N points
    for (let i = 0; i < pixelPoints.length; i += sampleRate) {
      sampledPoints.push(pixelPoints[i]);
    }
    if (sampledPoints[sampledPoints.length - 1] !== pixelPoints[pixelPoints.length - 1]) {
      sampledPoints.push(pixelPoints[pixelPoints.length - 1]);
    }

    // Generate smooth Bezier curve path
    let d = `M ${sampledPoints[0].x},${sampledPoints[0].y}`;

    for (let i = 0; i < sampledPoints.length - 1; i++) {
      const current = sampledPoints[i];
      const next = sampledPoints[i + 1];

      // Use quadratic bezier for smoothness
      const cp1x = current.x + (next.x - current.x) / 2;
      const cp1y = current.y + (next.y - current.y) / 2;

      d += ` Q ${cp1x},${cp1y} ${next.x},${next.y}`;
    }

    return d;
  }, [convertToPixelCoordinates]);

  // Get control points to display (start, middle, end)
  const getControlPoints = useCallback((points: PredictionPoint[]) => {
    if (points.length === 0) return [];

    // Select which points to show as control points
    let selectedPoints: PredictionPoint[];
    if (points.length === 1) {
      selectedPoints = [points[0]];
    } else if (points.length === 2) {
      selectedPoints = points;
    } else if (points.length <= 5) {
      selectedPoints = [points[0], points[points.length - 1]];
    } else {
      // Show first, last, and some middle points
      const controlPoints = [points[0]];
      const step = Math.max(1, Math.floor(points.length / 4));
      for (let i = step; i < points.length - 1; i += step) {
        controlPoints.push(points[i]);
      }
      controlPoints.push(points[points.length - 1]);
      selectedPoints = controlPoints;
    }

    // Convert to pixel coordinates, passing all points for reference
    return selectedPoints
      .map(p => convertToPixelCoordinates(p, points))
      .filter(p => p !== null) as { x: number; y: number }[];
  }, [convertToPixelCoordinates]);

  const controlPoints = getControlPoints(points);

  // Calculate x coordinates for the selected minute zone using state and effect
  const [zoneStartX, setZoneStartX] = useState<number | null>(null);
  const [zoneEndX, setZoneEndX] = useState<number | null>(null);
  
  useEffect(() => {
    if (!currentTime || !selectedMinute) {
      setZoneStartX(null);
      setZoneEndX(null);
      return;
    }

    const startTime = currentTime + (selectedMinute * 60);
    const endTime = startTime + 60;
    
    const updateCoordinates = () => {
      if (!chartRef.current?.chart) {
        setZoneStartX(null);
        setZoneEndX(null);
        return;
      }

      try {
        const timeScale = chartRef.current.chart.timeScale();
        const startX = timeScale.timeToCoordinate(startTime as Time);
        const endX = timeScale.timeToCoordinate(endTime as Time);
        
        // Only update if coordinates are valid (not null)
        if (startX !== null && endX !== null) {
          setZoneStartX(startX);
          setZoneEndX(endX);
        } else {
          // If coordinates are null, the times might be outside visible range
          // Try again after a short delay to allow chart to update
          return setTimeout(() => {
            if (chartRef.current?.chart) {
              const timeScale = chartRef.current.chart.timeScale();
              const retryStartX = timeScale.timeToCoordinate(startTime as Time);
              const retryEndX = timeScale.timeToCoordinate(endTime as Time);
              if (retryStartX !== null && retryEndX !== null) {
                setZoneStartX(retryStartX);
                setZoneEndX(retryEndX);
              }
            }
          }, 100);
        }
      } catch (error) {
        // Ignore conversion errors
        setZoneStartX(null);
        setZoneEndX(null);
      }
      return null;
    };
    
    const timeoutId = updateCoordinates();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentTime, selectedMinute]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{
        cursor: isConfirmed ? 'not-allowed' : 'crosshair',
        zIndex: 1000,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Drawing zone - highlight the selected minute area */}
      {zoneStartX !== null && zoneEndX !== null && selectedMinute && (
        <>
          {/* Highlighted zone - more visible */}
          <rect
            x={zoneStartX}
            y={0}
            width={Math.max(0, zoneEndX - zoneStartX)}
            height="100%"
            fill="#fbbf24"
            opacity={0.25}
          />
          {/* Left border - solid and prominent */}
          <line
            x1={zoneStartX}
            y1={0}
            x2={zoneStartX}
            y2="100%"
            stroke="#fbbf24"
            strokeWidth={3}
            opacity={0.9}
          />
          {/* Right border - solid and prominent */}
          <line
            x1={zoneEndX}
            y1={0}
            x2={zoneEndX}
            y2="100%"
            stroke="#fbbf24"
            strokeWidth={3}
            opacity={0.9}
          />
          {/* Label - more prominent */}
          {points.length === 0 && (
            <>
              <rect
                x={(zoneStartX + zoneEndX) / 2 - 80}
                y={15}
                width={160}
                height={25}
                fill="rgba(251, 191, 36, 0.9)"
                rx={4}
              />
              <text
                x={(zoneStartX + zoneEndX) / 2}
                y={32}
                fill="#0a0a0a"
                fontSize={14}
                fontWeight="bold"
                textAnchor="middle"
              >
                Draw here (+{selectedMinute} min)
              </text>
            </>
          )}
        </>
      )}

      {points.length > 0 && (
        <>
          {/* Smooth curve path - Yellow like Euphoria predictions */}
          <path
            d={generateSmoothPath(points)}
            stroke="#fbbf24"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={1}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
            }}
          />

          {/* Control points (yellow circles like Euphoria) */}
          {controlPoints.map((point, index) => (
            <g key={index}>
              {/* Outer glow */}
              <circle
                cx={point.x}
                cy={point.y}
                r={8}
                fill="rgba(251, 191, 36, 0.3)"
              />
              {/* Main circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={6}
                fill="#fbbf24"
                stroke="#0a0a0a"
                strokeWidth={2}
              />
            </g>
          ))}
        </>
      )}

      {/* Overlap points - highlight where prediction matches actual price */}
      {overlapPoints.length > 0 && chartRef.current?.chart && chartRef.current?.series && (
        <>
          {overlapPoints.map((overlap, index) => {
            try {
              const timeScale = chartRef.current!.chart!.timeScale();
              const x = timeScale.timeToCoordinate(overlap.time as Time);
              const y = chartRef.current!.series!.priceToCoordinate(overlap.price);

              if (x === null || y === null) return null;

              return (
                <g key={`overlap-${index}`}>
                  {/* Pulsing outer ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={12}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    opacity={0.6}
                    className="animate-ping"
                  />
                  {/* Inner glow */}
                  <circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill="rgba(251, 191, 36, 0.4)"
                  />
                  {/* Center dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={5}
                    fill="#fbbf24"
                    stroke="#0a0a0a"
                    strokeWidth={2}
                  />
                </g>
              );
            } catch (error) {
              return null;
            }
          })}
        </>
      )}
    </svg>
  );
}
