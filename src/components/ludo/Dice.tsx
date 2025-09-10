'use client';

import { useState, useEffect } from 'react';
import { PlayerColor } from '@/lib/ludo-constants';

type DiceProps = {
  onRoll: (value: number) => void;
  isRolling: boolean;
  value: number | null;
  currentTurn: PlayerColor;
};


const DiceFace = ({ value }: { value: number }) => {
    const dotPositions: { [key: number]: number[][] } = {
        1: [[0.5, 0.5]],
        2: [[0.25, 0.25], [0.75, 0.75]],
        3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
        4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
        5: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75], [0.5, 0.5]],
        6: [[0.25, 0.25], [0.25, 0.5], [0.25, 0.75], [0.75, 0.25], [0.75, 0.5], [0.75, 0.75]]
    };
    
    return (
      <div className="w-full h-full relative">
        {(dotPositions[value] || []).map(([x, y], i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-black rounded-full"
            style={{ 
              top: `calc(${y * 100}% - 6px)`, 
              left: `calc(${x * 100}% - 6px)` 
            }}
          />
        ))}
      </div>
    );
};

export function Dice({ onRoll, isRolling, value: propValue, currentTurn }: DiceProps) {
  const [internalValue, setInternalValue] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRoll = () => {
    if (isRolling || isAnimating) return;
    setIsAnimating(true);
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setInternalValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 10) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        onRoll(finalValue);
        setIsAnimating(false);
      }
    }, 100);
  };
  
  useEffect(() => {
    if (propValue !== null) {
        setInternalValue(propValue);
    }
  }, [propValue]);
  
  const DICE_COLORS: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
  }

  return (
    <div className="flex flex-col items-center gap-2">
        <div
            className={`w-20 h-20 rounded-lg shadow-lg border-2 border-gray-800 p-2 ${DICE_COLORS[currentTurn]}`}
        >
            <div className="w-full h-full rounded-md p-1">
                <DiceFace value={internalValue} />
            </div>
        </div>
        <p id="rolled-value" className="text-md font-bold text-gray-800 h-6">
            {propValue !== null ? `${currentTurn.toUpperCase()} rolled: ${propValue}` : ''}
        </p>
    </div>
  );
}
