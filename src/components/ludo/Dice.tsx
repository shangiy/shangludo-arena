
"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';

type DiceProps = {
  rolling: boolean;
  onRollStart: () => void;
  onRollEnd: (value: number) => void;
  color: PlayerColor;
  duration: number;
  isHumanTurn: boolean;
  diceValue: number | null;
  playerName: string;
};

const DiceDot = ({ className }: { className?: string }) => (
  <div className={cn("w-3 h-3 md:w-4 md:h-4 rounded-full bg-current", className)} />
);

const faceLayouts: Record<number, React.ReactNode> = {
  1: (
    <div className="flex items-center justify-center h-full">
      <DiceDot />
    </div>
  ),
  2: (
    <div className="flex justify-between h-full p-2">
      <DiceDot className="self-start" />
      <DiceDot className="self-end" />
    </div>
  ),
  3: (
    <div className="flex justify-between h-full p-2">
      <DiceDot className="self-start" />
      <DiceDot className="self-center" />
      <DiceDot className="self-end" />
    </div>
  ),
  4: (
    <div className="grid grid-cols-2 grid-rows-2 h-full gap-2 p-2">
      <DiceDot />
      <DiceDot />
      <DiceDot />
      <DiceDot />
    </div>
  ),
  5: (
    <div className="grid grid-cols-3 grid-rows-3 h-full p-2">
      <DiceDot className="col-start-1 row-start-1" />
      <DiceDot className="col-start-3 row-start-1" />
      <DiceDot className="col-start-2 row-start-2" />
      <DiceDot className="col-start-1 row-start-3" />
      <DiceDot className="col-start-3 row-start-3" />
    </div>
  ),
  6: (
    <div className="grid grid-cols-2 h-full gap-2 p-2">
      <DiceDot />
      <DiceDot />
      <DiceDot />
      <DiceDot />
      <DiceDot />
      <DiceDot />
    </div>
  ),
};

export function Dice({ rolling, onRollStart, onRollEnd, color, duration, isHumanTurn, diceValue, playerName }: DiceProps) {
  const [isClient, setIsClient] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(diceValue || 1);
  const [isRollingInternal, setIsRollingInternal] = useState(false);
  const isRollingRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (diceValue !== null) {
      setDisplayValue(diceValue);
    }
  }, [diceValue]);

  const handleRoll = () => {
    if (isRollingRef.current || !isHumanTurn) return;
    
    isRollingRef.current = true;
    setIsRollingInternal(true);
    onRollStart();

    const finalRoll = Math.floor(Math.random() * 6) + 1;
    const rollCount = 10 + Math.floor(Math.random() * 5);
    let currentRoll = 0;

    const interval = setInterval(() => {
      let randomFace: number;
      do {
        randomFace = Math.floor(Math.random() * 6) + 1;
      } while (randomFace === displayValue);
      setDisplayValue(randomFace);
      
      currentRoll++;
      if (currentRoll >= rollCount) {
        clearInterval(interval);
        setDisplayValue(finalRoll);
        setTimeout(() => {
          setIsRollingInternal(false);
          isRollingRef.current = false;
          onRollEnd(finalRoll);
        }, 300);
      }
    }, duration / rollCount);
  };
  
  useEffect(() => {
      if (rolling && !isRollingRef.current) {
          isRollingRef.current = true;
          setIsRollingInternal(true);
          const finalRoll = Math.floor(Math.random() * 6) + 1;
          const rollCount = 10 + Math.floor(Math.random() * 5);
          let currentRoll = 0;

          const interval = setInterval(() => {
            let randomFace: number;
            do {
              randomFace = Math.floor(Math.random() * 6) + 1;
            } while (randomFace === displayValue);
            setDisplayValue(randomFace);
            
            currentRoll++;
            if (currentRoll >= rollCount) {
              clearInterval(interval);
              setDisplayValue(finalRoll);
              setTimeout(() => {
                setIsRollingInternal(false);
                isRollingRef.current = false;
                onRollEnd(finalRoll);
              }, 300);
            }
          }, duration / rollCount);
      }
  }, [rolling]);


  if (!isClient) {
    return <div className="w-16 h-16 md:w-24 md:h-24" />; // Placeholder for SSR
  }

  const turnTextColor: Record<PlayerColor, string> = {
    red: 'text-red-500',
    green: 'text-green-500',
    yellow: 'text-yellow-400',
    blue: 'text-blue-500',
  };

  const currentTurnColorClass = turnTextColor[color];
  const showRollResult = !isRollingInternal && diceValue !== null;

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      <motion.div
        key={displayValue}
        initial={{ rotate: Math.random() * 180 - 90, scale: 0.5, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: Math.random() * 180 - 90, scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={cn(
          "w-16 h-16 md:w-24 md:h-24 rounded-lg shadow-md flex items-center justify-center border-2 border-black/20 bg-white",
          currentTurnColorClass
        )}
        onClick={handleRoll}
        style={{ cursor: isHumanTurn && !isRollingInternal ? 'pointer' : 'default' }}
      >
        {faceLayouts[displayValue]}
      </motion.div>
       <div className="text-center h-8 flex items-center justify-center">
        {isHumanTurn && !isRollingInternal && diceValue === null && (
          <button
            onClick={handleRoll}
            className={cn("font-bold text-sm animate-pulse", currentTurnColorClass)}
          >
            Click to Roll
          </button>
        )}
        {showRollResult && (
          <p className={cn("text-sm font-semibold capitalize", currentTurnColorClass)}>
            {playerName} Rolled: {diceValue}
          </p>
        )}
      </div>
    </div>
  );
}

    