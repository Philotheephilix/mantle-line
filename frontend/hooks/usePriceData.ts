'use client';

import { useEffect, useReducer, useRef } from 'react';
import type { PricePoint, PriceDataState } from '@/types/price';

type Action =
  | { type: 'ADD_PRICE'; payload: PricePoint }
  | { type: 'ERROR'; payload: Error }
  | { type: 'LOADING' }
  | { type: 'CONNECTED' };

// Generate dummy historical data
function generateDummyHistory(): PricePoint[] {
  const history: PricePoint[] = [];
  const now = Math.floor(Date.now() / 1000);
  const basePrice = 0.98;
  
  // Generate 2 minutes of historical data (120 seconds)
  // One point every 2 seconds for smoother display
  for (let i = 120; i >= 0; i -= 2) {
    const timestamp = now - i;
    // Add some realistic price variation around 0.98
    const variation = (Math.sin(i / 20) * 0.01) + (Math.random() - 0.5) * 0.005;
    const price = basePrice + variation;
    
    history.push({
      time: timestamp,
      value: Math.max(0.95, Math.min(1.01, price)), // Keep within reasonable range
    });
  }
  
  return history;
}

const initialState: PriceDataState = {
  data: generateDummyHistory(), // Start with dummy history
  isLoading: true,
  error: null,
};

function priceDataReducer(state: PriceDataState, action: Action): PriceDataState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'CONNECTED':
      return { ...state, isLoading: false, error: null };
    case 'ADD_PRICE': {
      const newData = [...state.data, action.payload];
      // Keep 2 minutes of history (120 seconds, assuming ~1 point per second)
      const maxPoints = 120; // Keep 2 minutes of history
      const trimmedData = newData.length > maxPoints ? newData.slice(-maxPoints) : newData;
      return { data: trimmedData, isLoading: false, error: null };
    }
    case 'ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export function usePriceData() {
  const [state, dispatch] = useReducer(priceDataReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    function connect() {
      const wsUrl = "wss://stream.bybit.com/v5/public/spot";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        dispatch({ type: 'CONNECTED' });

        ws.send(JSON.stringify({
          op: "subscribe",
          args: ["tickers.MNTUSDT"]
        }));
      };

      ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);

          if (!msg.data || !msg.topic) return;
          if (!msg.topic.startsWith("tickers.")) return;

        const t = msg.data;

        if (t.lastPrice) {
            // Ensure unique timestamps by incrementing if same as last
            let timestamp = Math.floor(Date.now() / 1000);
            if (timestamp <= lastTimestampRef.current) {
              timestamp = lastTimestampRef.current + 1;
            }
            lastTimestampRef.current = timestamp;

            const pricePoint: PricePoint = {
              time: timestamp,
            value: Number(t.lastPrice),
            };

            dispatch({ type: 'ADD_PRICE', payload: pricePoint });
        }
      };

      ws.onclose = () => {
        dispatch({ type: 'LOADING' });
        reconnectTimeoutRef.current = setTimeout(connect, 1000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return state;
}
