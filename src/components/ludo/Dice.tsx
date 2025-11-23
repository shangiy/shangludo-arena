
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const diceIcons = [
  (props: any) => <Dice1 {...props} />,
  (props: any) => <Dice2 {...props} />,
  (props: any) => <Dice3 {...props} />,
  (props: any) => <Dice4 {...props} />,
  (props: any) => <Dice5 {...props} />,
  (props: any) => <Dice6 {...props} />,
];

const turnTextColor: Record<PlayerColor, string> = {
    red: 'text-red-500',
    green: 'text-green-500',
    yellow: 'text-yellow-400',
    blue: 'text-blue-500',
};

const turnBgColor: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-500',
};

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

export function Dice({ rolling, onRollStart, onRollEnd, color, duration, isHumanTurn, diceValue, playerName }: DiceProps) {
  const [isClient, setIsClient] = useState(false);
  const [interimValue, setInterimValue] = useState(1);
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRollingRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRoll = () => {
    if (isRollingRef.current || !isHumanTurn) return;
    onRollStart();
  };
  
  useEffect(() => {
    if (rolling && !isRollingRef.current) {
        isRollingRef.current = true;
        const finalValue = Math.floor(Math.random() * 6) + 1;
        
        rollIntervalRef.current = setInterval(() => {
            setInterimValue(Math.floor(Math.random() * 6) + 1);
        }, 50);

        setTimeout(() => {
            if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
            isRollingRef.current = false;
            onRollEnd(finalValue);
        }, duration);
    }
  }, [rolling, onRollEnd, duration]);

  if (!isClient) {
    return <div className="w-16 h-16 md:w-24 md:h-24" />; // Placeholder for SSR
  }

  const currentTurnColorClass = turnTextColor[color];
  const currentBgColorClass = turnBgColor[color];
  const Icon = diceIcons[rolling ? interimValue - 1 : (diceValue || 1) - 1];
  const showRollResult = !rolling && diceValue !== null;

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      <AnimatePresence mode="popLayout">
        <motion.button
          key={rolling ? interimValue : diceValue}
          onClick={handleRoll}
          disabled={!isHumanTurn || rolling}
          className={cn(
            'w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-md text-white transition-all duration-100',
            currentBgColorClass,
            isHumanTurn && !rolling && "cursor-pointer hover:scale-105 active:scale-95"
          )}
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ duration: 0.15 }}
        >
          <Icon className="w-10 h-10 md:w-16 md:h-16" />
        </motion.button>
      </AnimatePresence>

      <div className="text-center h-8 flex items-center justify-center">
        {isHumanTurn && !rolling && diceValue === null && (
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
