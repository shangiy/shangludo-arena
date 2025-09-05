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
    (key: any) => <div key={key} className='w-full h-full flex justify-center items-center'><div className="w-3 h-3 bg-white rounded-full"></div></div>,
    (key: any) => <div key={key} className='w-full h-full flex justify-between p-2'><div className="w-3 h-3 bg-white rounded-full self-start"></div><div className="w-3 h-3 bg-white rounded-full self-end"></div></div>,
    (key: any) => <div key={key} className='w-full h-full flex justify-between p-2'><div className="w-3 h-3 bg-white rounded-full self-start"></div><div className="w-3 h-3 bg-white rounded-full self-center"></div><div className="w-3 h-3 bg-white rounded-full self-end"></div></div>,
    (key: any) => <div key={key} className='w-full h-full flex justify-between p-2'><div className='flex flex-col justify-between'><div className="w-3 h-3 bg-white rounded-full"></div><div className="w-3 h-3 bg-white rounded-full"></div></div><div className='flex flex-col justify-between'><div className="w-3 h-3 bg-white rounded-full"></div><div className="w-3 h-3 bg-white rounded-full"></div></div></div>,
    (key: any) => <div key={key} className='w-full h-full flex justify-between p-2'><div className='flex flex-col justify-between'><div className="w-3 h-3 bg-white rounded-full"></div><div className="w-3 h-3 bg-white rounded-full"></div></div><div className="w-3 h-3 bg-white rounded-full self-center"></div><div className='flex flex-col justify-between'><div className="w-3 h-3 bg-white rounded-full"></div><div className="w-3 h-3 bg-white rounded-full"></div></div></div>,
    (key: any) => <div key={key} className='w-full h-full flex justify-between p-2'><div className='flex flex-col justify-between'><div className="w-3 h-3 bg-white rounded-full"></div><div className="w-3 h-3 bg-white rounded-full"></div></div><div className='flex flex-col justify-between'><div className="w-3 h-3 bg-white rounded-full"></div><div className="w-3 h-3 bg-white rounded-full"></div></div></div>
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
  
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        key={internalValue}
        initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        onClick={handleRoll} 
        disabled={isRolling || isAnimating || currentTurn !== 'red'}
        className={cn(
            "w-24 h-24 rounded-2xl shadow-lg border-4 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-4 ring-offset-background",
            "bg-red-500 border-red-800 ring-red-500"
        )}
      >
        <div className="w-16 h-16 rounded-md bg-red-800 p-1">
            <DiceFace value={internalValue} />
        </div>
      </motion.button>
    </div>
  );
}
