'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

type DiceProps = {
  onRoll: (value: number) => void;
  isRolling: boolean;
  value: number | null;
};

const DiceFace = ({ value }: { value: number }) => {
  const pips = Array.from({ length: value }, (_, i) => (
    <div key={i} className="h-3 w-3 bg-black rounded-full" />
  ));
  
  const faceClasses: { [key: number]: string } = {
    1: 'justify-center items-center',
    2: 'justify-between',
    3: 'justify-between items-center',
    4: 'justify-between',
    5: 'justify-between',
    6: 'justify-between',
  };
  
  const pipWrapperClasses: { [key: number]: string } = {
    4: 'flex flex-col justify-between h-full',
    5: 'flex flex-col justify-between h-full items-center',
    6: 'flex flex-col justify-between h-full',
  }

  const FaceContainer = ({children}: {children: React.ReactNode}) => (
    <div className={cn("h-full w-full flex p-2", faceClasses[value])}>{children}</div>
  )

  if (value === 4) return <FaceContainer><div className={pipWrapperClasses[value]}> <div className="flex justify-between w-full">{[pips[0], pips[1]]}</div> <div className="flex justify-between w-full">{[pips[2], pips[3]]}</div> </div></FaceContainer>
  if (value === 5) return <FaceContainer><div className={pipWrapperClasses[value]}> <div className="flex justify-between w-full">{[pips[0], pips[1]]}</div> <div>{pips[2]}</div> <div className="flex justify-between w-full">{[pips[3], pips[4]]}</div> </div></FaceContainer>
  if (value === 6) return <FaceContainer><div className={pipWrapperClasses[value]}> <div className="flex justify-between w-full">{[pips[0], pips[1]]}</div> <div className="flex justify-between w-full">{[pips[2], pips[3]]}</div> <div className="flex justify-between w-full">{[pips[4], pips[5]]}</div> </div></FaceContainer>
  
  return <FaceContainer>{pips}</FaceContainer>;
};

export function Dice({ onRoll, isRolling, value: propValue }: DiceProps) {
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
      <motion.div
        key={internalValue}
        initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        className="w-24 h-24 bg-white rounded-lg shadow-lg border-2 flex items-center justify-center"
      >
        <DiceFace value={internalValue} />
      </motion.div>
      <Button onClick={handleRoll} disabled={isRolling || isAnimating} size="lg">
        <Dices className="mr-2 h-5 w-5" />
        {isAnimating ? 'Rolling...' : 'Roll Dice'}
      </Button>
    </div>
  );
}
