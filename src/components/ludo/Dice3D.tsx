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

const DiceIcon = ({ value, color }: { value: number | null, color: PlayerColor }) => {
    if (!value) return <Dices className={cn("h-16 w-16", `text-${color}-500`)} />;
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const Icon = icons[value - 1];
    return <Icon className="h-16 w-16" />;
}

const DiceFace = ({ value, faceClass }: { value: number, faceClass: string }) => {
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const Icon = icons[value - 1];
    return (
        <div className={cn("dice-face", faceClass)}>
            <Icon className="h-10 w-10" />
        </div>
    );
};

interface Dice3DProps {
  value: number | null;
  rolling: boolean;
  duration: number;
  color: PlayerColor;
  onClick: () => void;
  isHumanTurn: boolean;
  onDiceRoll: (value: number) => void;
}

export function Dice3D({ value, rolling, duration, color, onClick, isHumanTurn, onDiceRoll }: Dice3DProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [finalValue, setFinalValue] = useState<number | null>(value);

  const handleRollClick = () => {
    if (isHumanTurn && !isRolling) {
        setIsRolling(true);
        setFinalValue(null);
        onClick(); // This should set phase to 'MOVING'
        
        const rollTimeout = setTimeout(() => {
            const finalRoll = Math.floor(Math.random() * 6) + 1;
            onDiceRoll(finalRoll);
            setFinalValue(finalRoll);
            setIsRolling(false);
        }, duration);

        return () => clearTimeout(rollTimeout);
    }
  }

  useEffect(() => {
    if (rolling) {
        setIsRolling(true);
        setFinalValue(null);
    } else {
        setIsRolling(false);
        setFinalValue(value);
    }
  }, [rolling, value]);

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
        {isRolling ? (
             <div className="dice-3d dice-3d-rolling">
                <DiceFace value={1} faceClass="face-1" />
                <DiceFace value={2} faceClass="face-2" />
                <DiceFace value={3} faceClass="face-3" />
                <DiceFace value={4} faceClass="face-4" />
                <DiceFace value={5} faceClass="face-5" />
                <DiceFace value={6} faceClass="face-6" />
            </div>
        ) : (
            <button
              onClick={handleRollClick}
              disabled={!isHumanTurn || isRolling}
              className="disabled:cursor-not-allowed"
            >
              <DiceIcon value={finalValue} color={color}/>
            </button>
        )}
      </div>
      <div id="rolled-value" className="text-md font-bold h-12 capitalize flex flex-col text-center">
        <span>
          {isHumanTurn && !isRolling && !finalValue && "Your turn!"}
        </span>
        <span style={{ color: DICE_FACE_COLORS[color] }}>
          {isRolling ? 'Rolling...' : (finalValue ? `${color} rolled a: ${finalValue}` : '')}
        </span>
      </div>
    </div>
  );
}
