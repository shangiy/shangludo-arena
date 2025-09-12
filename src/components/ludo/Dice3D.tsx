"use client";

import React, { useState, useEffect } from 'react';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { Dices, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { Button } from '../ui/button';

const DICE_FACE_COLORS: Record<PlayerColor, string> = {
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#f59e0b',
    blue: '#3b82f6',
};

const turnColorClasses: Record<PlayerColor, string> = {
    red: 'turn-red',
    green: 'turn-green',
    yellow: 'turn-yellow',
    blue: 'turn-blue',
};

const DiceIcon = ({ value }: { value: number | null }) => {
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const Icon = value ? icons[value - 1] : Dices;
    return <Icon className="h-16 w-16" />;
}

interface Dice2DProps {
  value: number | null;
  rolling: boolean;
  duration: number;
  color: PlayerColor;
  onClick: () => void;
  isHumanTurn: boolean;
  onDiceRoll: (value: number) => void;
}

export function Dice3D({ value, rolling, duration, color, onClick, isHumanTurn, onDiceRoll }: Dice2DProps) {
  const [displayValue, setDisplayValue] = useState<number | null>(value);
  const [isRolling, setIsRolling] = useState(false);

  const handleRollClick = () => {
    if (isHumanTurn && !isRolling) {
        setIsRolling(true);
        onClick();
    }
  }

  useEffect(() => {
    if (rolling || isRolling) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const randomValue = Math.floor(Math.random() * 6) + 1;
        setDisplayValue(randomValue);

        if (Date.now() - startTime > duration) {
            clearInterval(interval);
            const finalValue = Math.floor(Math.random() * 6) + 1;
            onDiceRoll(finalValue);
            setIsRolling(false);
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
        setDisplayValue(value);
    }
  }, [rolling, isRolling, duration, onDiceRoll]);

   useEffect(() => {
    // For AI turns
    if (rolling && !isHumanTurn) {
        setIsRolling(true);
    }
  }, [rolling, isHumanTurn])


  const actualValueToDisplay = isRolling ? displayValue : value;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
        {isHumanTurn && !isRolling && (
             <Button
                onClick={handleRollClick}
                disabled={!isHumanTurn || isRolling}
                className={cn(
                    'gradient-button text-lg font-bold py-3 px-6 rounded-lg',
                    isHumanTurn && !isRolling && 'animate-pulse',
                    turnColorClasses[color]
                )}
            >
                <Dices className="mr-2" />
                Roll Dice
            </Button>
        )}

      <div className="h-48 w-full relative flex items-center justify-center">
        <div className={cn("transition-transform duration-100", isRolling && "animate-shake")}>
          <DiceIcon value={actualValueToDisplay} />
        </div>
      </div>
      <div id="rolled-value" className="text-md font-bold h-12 capitalize flex flex-col text-center">
        <span>
          {isHumanTurn && !isRolling && !value && "Your turn!"}
        </span>
        <span style={{ color: DICE_FACE_COLORS[color] }}>
          {!isRolling && value ? `${color} rolled a: ${value}` : (isRolling ? 'Rolling...' : '')}
        </span>
      </div>
    </div>
  );
}
