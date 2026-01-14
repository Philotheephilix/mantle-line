export type CanvasPoint = { x: number; y: number };

export function samplePredictionPoints(
  points: CanvasPoint[],
  desiredCount = 60,
): CanvasPoint[] {
  if (points.length === 0) return [];

  const maxY = points.reduce((max, p) => (p.y > max ? p.y : max), points[0].y);

  if (points.length <= desiredCount) {
    return points.map((p) => ({ x: p.x, y: maxY - p.y }));
  }

  const result: CanvasPoint[] = [];
  const lastIndex = points.length - 1;

  for (let i = 0; i < desiredCount; i++) {
    const t = desiredCount === 1 ? 0 : i / (desiredCount - 1);
    const index = Math.round(t * lastIndex);
    const point = points[index];
    result.push({ x: point.x, y: maxY - point.y });
  }

  return result;
}

