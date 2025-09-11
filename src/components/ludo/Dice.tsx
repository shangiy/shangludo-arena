'use client';

import { useState, useEffect } from 'react';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type DiceProps = {
  onRoll: (value: number) => void;
  isRolling: boolean;
  value: number | null;
  currentTurn: PlayerColor;
};

const DICE_FACE_COLORS: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-500',
};

const DiceFace = ({ value, color }: { value: number; color: PlayerColor }) => {
    const dotPositions: { [key: number]: number[][] } = {
        1: [[0.5, 0.5]],
        2: [[0.25, 0.25], [0.75, 0.75]],
        3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
        4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
        5: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75], [0.5, 0.5]],
        6: [[0.25, 0.25], [0.25, 0.5], [0.25, 0.75], [0.75, 0.25], [0.75, 0.5], [0.75, 0.75]]
    };
    
    return (
      <div className={cn("w-full h-full relative p-2 rounded-lg", DICE_FACE_COLORS[color])}>
        {(dotPositions[value] || []).map(([x, y], i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-white rounded-full"
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
  
  const turnColorClasses: Record<PlayerColor, string> = {
    red: 'bg-gradient-to-br from-red-400 to-red-600',
    green: 'bg-gradient-to-br from-green-400 to-green-600',
    yellow: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
    blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
  };

  return (
    <div className="flex flex-col items-center gap-2">
        <motion.div
            className={cn(`w-20 h-20 rounded-lg shadow-lg`)}
            animate={{ rotateY: isAnimating ? 720 : 0, rotateX: isAnimating ? 360 : 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
            <DiceFace value={isAnimating ? internalValue : (propValue ?? 1)} color={currentTurn} />
        </motion.div>
        <p id="rolled-value" className="text-md font-bold text-gray-800 h-6 capitalize">
            {propValue !== null ? `${currentTurn} rolled: ${propValue}` : ''}
        </p>
    </div>
  );
}
