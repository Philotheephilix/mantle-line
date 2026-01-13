export interface PredictionPoint {
  x: number;      // SVG coordinate (rendered)
  y: number;      // SVG coordinate (rendered)
  time: number;   // Chart time
  price: number;  // Chart price
  canvasX?: number;  // Original canvas X (0-600)
  canvasY?: number;  // Original canvas Y (0-200)
}

export interface PredictionPath {
  id: string;
  points: PredictionPoint[];
  createdAt: number;
  confirmedAt?: number;
}

export interface DrawingState {
  isDrawing: boolean;
  isConfirmed: boolean;
  currentPoints: PredictionPoint[];
  confirmedPath: PredictionPath | null;
}
