'use client';

import { useEffect, useState, useCallback } from 'react';

interface AsciiTextProps {
  text: string;
  className?: string;
  animateOnHover?: boolean;
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

export function AsciiText({ text, className = '', animateOnHover = true }: AsciiTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);

  const scramble = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }

      iteration += 1 / 2; // Speed of reveal
    }, 30);

    return () => clearInterval(interval);
  }, [text, isAnimating]);

  // Initial animation on mount
  useEffect(() => {
    const timeout = setTimeout(scramble, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <span
      className={`font-mono ${className}`}
      onMouseEnter={animateOnHover ? scramble : undefined}
    >
      {displayText}
    </span>
  );
}

