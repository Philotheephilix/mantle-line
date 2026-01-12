export interface PredictionPoint {
  x: number;      // SVG coordinate
  y: number;      // SVG coordinate
  time: number;   // Chart time
  price: number;  // Chart price
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
