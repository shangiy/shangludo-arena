"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { Dices } from 'lucide-react';
import { Button } from '../ui/button';
import { Dice } from './Dice';

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

interface Dice3DProps {
  value: number | null;
  rolling: boolean;
  color: PlayerColor;
  onClick: () => void;
  isHumanTurn: boolean;
  onDiceRoll: (value: number) => void;
  nextPlayerColor: PlayerColor;
}

export function Dice3D({ value, rolling, color, onClick, isHumanTurn, onDiceRoll, nextPlayerColor }: Dice3DProps) {
  const [finalValue, setFinalValue] = useState<number | null>(null);

  useEffect(() => {
    if (!rolling && value !== null) {
      setFinalValue(value);
    } else if (rolling) {
      setFinalValue(null);
    }
  }, [rolling, value]);
  
  const showYourTurnMessage = isHumanTurn && !rolling && !finalValue;

  const diceColor = useMemo(() => {
    if (rolling) {
      return DICE_FACE_COLORS[color];
    }
    return DICE_FACE_COLORS[nextPlayerColor];
  }, [rolling, color, nextPlayerColor]);

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
        <Canvas shadows camera={{ position: [0, 6, 10], fov: 25 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 5]} intensity={3} castShadow />
            <Suspense fallback={null}>
                <Physics gravity={[0, -30, 0]}>
                    <Dice 
                        color={diceColor}
                        isHumanTurn={isHumanTurn} 
                        rolling={rolling}
                        onRollStart={onClick}
                        onDiceRoll={onDiceRoll}
                    />
                </Physics>
            </Suspense>
        </Canvas>
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