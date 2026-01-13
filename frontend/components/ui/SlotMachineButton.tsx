'use client';

import { useState, useEffect, useCallback } from 'react';
import './slot-machine.css';

interface SlotMachineButtonProps {
  onComplete: () => void;
  disabled?: boolean;
}

// Single slot reel component
function SlotReel({ 
  isSpinning, 
  duration,
  onStop
}: { 
  isSpinning: boolean;
  duration: number;
  onStop?: () => void;
}) {
  const symbols = ['🍒', '🍋', '🍊', '💎', '7️⃣', '⭐', '🎰', '💰'];
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (!isSpinning) return;

    let frame = 0;
    const totalFrames = Math.floor(duration / 80);
    
    const interval = setInterval(() => {
      frame++;
      setCurrentIndex(Math.floor(Math.random() * symbols.length));
      
      if (frame >= totalFrames) {
        clearInterval(interval);
        // Land on a random final symbol
        setCurrentIndex(Math.floor(Math.random() * symbols.length));
        onStop?.();
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isSpinning, duration, onStop, symbols.length]);

  return (
    <div className={`slot-reel-container ${isSpinning ? 'spinning' : ''}`}>
      <div className="slot-reel-window">
        <span className="slot-symbol">{symbols[currentIndex]}</span>
      </div>
    </div>
  );
}

export function SlotMachineButton({ 
  onComplete, 
  disabled = false,
}: SlotMachineButtonProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [reelsStopped, setReelsStopped] = useState(0);

  const handlePullLever = useCallback(() => {
    if (disabled || isSpinning) return;
    
    // Pull lever animation
    setLeverPulled(true);
    setReelsStopped(0);
    
    setTimeout(() => {
      setLeverPulled(false);
      setIsSpinning(true);
    }, 300);
  }, [disabled, isSpinning]);

  const handleReelStop = useCallback(() => {
    setReelsStopped(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        // All reels stopped
        setTimeout(() => {
          setIsSpinning(false);
          onComplete();
        }, 200);
      }
      return newCount;
    });
  }, [onComplete]);

  return (
    <div className={`slot-machine ${disabled ? 'disabled' : ''}`}>
      {/* Badge/Header */}
      <div className="slot-badge">
        <span className="slot-badge-text">APPLY</span>
      </div>
      
      {/* Main body */}
      <div className="slot-body">
        {/* Window with reels */}
        <div className="slot-window">
          <div className="slot-reels-container">
            <SlotReel 
              isSpinning={isSpinning} 
              duration={1500}
              onStop={handleReelStop}
            />
            <div className="slot-divider" />
            <SlotReel 
              isSpinning={isSpinning} 
              duration={2000}
              onStop={handleReelStop}
            />
            <div className="slot-divider" />
            <SlotReel 
              isSpinning={isSpinning} 
              duration={2500}
              onStop={handleReelStop}
            />
          </div>
          {/* Shadow overlays */}
          <div className="slot-shadow-top" />
          <div className="slot-shadow-bottom" />
        </div>
        
        {/* Lever/Handle */}
        <div className={`slot-handle ${leverPulled ? 'pulled' : ''} ${isSpinning ? 'spinning' : ''}`}>
          <div className="slot-handle-stick-base" />
          <div className="slot-handle-stick" />
          <button 
            className="slot-handle-ball"
            onClick={handlePullLever}
            disabled={disabled || isSpinning}
            aria-label="Pull lever"
          />
        </div>
      </div>
      
      {/* Instruction text */}
      <div className="slot-instruction">
        {isSpinning ? 'SPINNING...' : disabled ? 'DRAW FIRST' : 'PULL TO APPLY →'}
      </div>
    </div>
  );
}
