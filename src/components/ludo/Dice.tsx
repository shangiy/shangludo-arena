'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

type DiceProps = {
  onRoll: (value: number) => void;
  isRolling: boolean;
  value: number | null;
  currentTurn: string;
};

const diceFaces = [
    (key: any) => <svg key={key} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="4.5" fill="white"/></svg>,
    (key: any) => <svg key={key} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="4.5" fill="white"/><circle cx="31.5" cy="31.5" r="4.5" fill="white"/></svg>,
    (key: any) => <svg key={key} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="4.5" fill="white"/><circle cx="22" cy="22" r="4.5" fill="white"/><circle cx="31.5" cy="31.5" r="4.5" fill="white"/></svg>,
    (key: any) => <svg key={key} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="4.5" fill="white"/><circle cx="31.5" cy="12.5" r="4.5" fill="white"/><circle cx="12.5" cy="31.5" r="4.5" fill="white"/><circle cx="31.5" cy="31.5" r="4.5" fill="white"/></svg>,
    (key: any) => <svg key={key} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="4.5" fill="white"/><circle cx="31.5" cy="12.5" r="4.5" fill="white"/><circle cx="22" cy="22" r="4.5" fill="white"/><circle cx="12.5" cy="31.5" r="4.5" fill="white"/><circle cx="31.5" cy="31.5" r="4.5" fill="white"/></svg>,
    (key: any) => <svg key={key} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="4.5" fill="white"/><circle cx="31.5" cy="12.5" r="4.5" fill="white"/><circle cx="12.5" cy="22" r="4.5" fill="white"/><circle cx="31.5" cy="22" r="4.5" fill="white"/><circle cx="12.5" cy="31.5" r="4.5" fill="white"/><circle cx="31.5" cy="31.5" r="4.5" fill="white"/></svg>
]

const DiceFace = ({ value }: { value: number }) => {
  return diceFaces[value - 1](value);
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
  }, [propValue])
  
  const DICE_COLOR: Record<string, string> = {
    red: 'bg-red-500 border-red-700',
    blue: 'bg-blue-500 border-blue-700',
    yellow: 'bg-yellow-400 border-yellow-600',
    green: 'bg-green-500 border-green-700',
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        key={internalValue}
        initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        onClick={handleRoll} 
        disabled={isRolling || isAnimating}
        className={cn(
            "w-20 h-20 rounded-lg shadow-lg border-4 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-4 focus:ring-accent",
            DICE_COLOR[currentTurn]
        )}
      >
        <DiceFace value={internalValue} />
      </motion.button>
    </div>
  );
}
