'use client';

import { useState, useEffect } from 'react';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type DiceProps = {
  onRoll: () => void;
  isRolling: boolean;
  value: number | null;
  currentTurn: PlayerColor;
  isHumanTurn: boolean;
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

export function Dice({ onRoll, isRolling, value: propValue, currentTurn, isHumanTurn }: DiceProps) {
  const [internalValue, setInternalValue] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRoll = () => {
    if (isRolling || isAnimating || !isHumanTurn) return;
    onRoll();
  };
  
  useEffect(() => {
    if (propValue !== null) {
        setInternalValue(propValue);
    }
  }, [propValue]);
  
  useEffect(() => {
      let animationTimeout: NodeJS.Timeout;
      if (isRolling) {
          setIsAnimating(true);
          animationTimeout = setTimeout(() => setIsAnimating(false), 1000);
      }
      return () => clearTimeout(animationTimeout);
  }, [isRolling]);

  const turnColorClasses: Record<PlayerColor, string> = {
    red: 'shadow-red-500/50',
    green: 'shadow-green-500/50',
    yellow: 'shadow-yellow-400/50',
    blue: 'shadow-blue-500/50',
  };

  return (
    <div className="flex flex-col items-center gap-2">
        <motion.div
            className={cn(
                `w-20 h-20 rounded-lg shadow-lg`,
                 isHumanTurn && !isRolling && 'cursor-pointer animate-pulse',
                 isHumanTurn && !isRolling && turnColorClasses[currentTurn]
            )}
            onClick={handleRoll}
            animate={{ rotateY: isAnimating ? 720 : 0, rotateX: isAnimating ? 360 : 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
            <DiceFace value={isAnimating && propValue === null ? internalValue : (propValue ?? 1)} color={currentTurn} />
        </motion.div>
        <p id="rolled-value" className="text-md font-bold text-gray-800 h-6 capitalize">
            {isHumanTurn && !isRolling && propValue === null && "Click to roll!"}
            {propValue !== null ? `${currentTurn} rolled: ${propValue}` : ''}
        </p>
    </div>
  );
}
