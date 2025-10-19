"use client";

import React, { useState, useEffect } from 'react';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { Dices, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { Button } from '../ui/button';

export const DICE_FACE_COLORS: Record<PlayerColor, string> = {
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

interface Dice3DProps {
  value: number | null;
  rolling: boolean;
  color: PlayerColor;
  onClick: () => void;
  isHumanTurn: boolean;
  duration: number;
}

export function Dice3D({ value, rolling, color, onClick, isHumanTurn, duration }: Dice3DProps) {
  const [finalValue, setFinalValue] = useState<number | null>(null);

  useEffect(() => {
    if (!rolling && value !== null) {
      setFinalValue(value);
    } else if (rolling) {
      setFinalValue(null);
    }
  }, [rolling, value]);
  
  const showYourTurnMessage = isHumanTurn && !rolling && !finalValue;

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const FinalIcon = finalValue ? diceIcons[finalValue - 1] : null;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
        {isHumanTurn && !rolling && (
             <Button
                onClick={onClick}
                disabled={!isHumanTurn || rolling}
                className={cn(
                    'gradient-button text-lg font-bold py-3 px-6 rounded-lg',
                    isHumanTurn && !rolling && 'animate-pulse',
                    turnColorClasses[color]
                )}
            >
                <Dices className="mr-2" />
                Roll Dice
            </Button>
        )}

      <div className="h-48 w-full relative flex items-center justify-center">
        {rolling ? (
          <div className="relative w-24 h-24" style={{ perspective: '1000px', perspectiveOrigin: '50% 100%' }}>
            <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', animation: `roll ${duration}ms steps(24, end) infinite` }}>
              {diceIcons.map((Icon, i) => (
                <div key={i} className={`absolute w-24 h-24 flex items-center justify-center border border-black/20 ${i === 0 ? 'bg-red-500' : (i === 5 ? 'bg-red-300' : `bg-red-400`)}`} 
                    style={{ 
                        transform: 
                            i === 0 ? 'rotateY(0deg) translateZ(3rem)' : 
                            i === 1 ? 'rotateY(90deg) translateZ(3rem)' :
                            i === 2 ? 'rotateY(180deg) translateZ(3rem)' :
                            i === 3 ? 'rotateY(-90deg) translateZ(3rem)' :
                            i === 4 ? 'rotateX(90deg) translateZ(3rem)' :
                            'rotateX(-90deg) translateZ(3rem)'
                    }}>
                    <Icon className="h-12 w-12 text-white" />
                </div>
              ))}
            </div>
          </div>
        ) : FinalIcon ? (
           <FinalIcon className="h-24 w-24" style={{ color: DICE_FACE_COLORS[color] }} />
        ) : (
            <button onClick={isHumanTurn ? onClick : undefined} disabled={!isHumanTurn} className="cursor-pointer">
                <Dices className={cn("h-24 w-24", isHumanTurn && 'animate-pulse')} style={{color: DICE_FACE_COLORS[color]}} />
            </button>
        )}
      </div>
      <div id="rolled-value" className="text-md font-bold h-12 capitalize flex flex-col text-center">
        <span className="h-6">
          {showYourTurnMessage && "Your turn!"}
        </span>
        <span style={{ color: DICE_FACE_COLORS[color] }} className="h-6">
          {rolling ? 'Rolling...' : (finalValue ? `${color} rolled a: ${finalValue}` : '')}
        </span>
      </div>
    </div>
  );
}
