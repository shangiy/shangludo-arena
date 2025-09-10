'use client';

import { Dice } from '@/components/ludo/Dice';
import { PlayerColor } from '@/lib/ludo-constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dices } from 'lucide-react';

type GameControlsProps = {
  currentTurn: PlayerColor;
  phase: 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';
  diceValue: number | null;
  onDiceRoll: (value: number) => void;
};

export function GameControls({ currentTurn, phase, diceValue, onDiceRoll }: GameControlsProps) {
  const isRolling = phase !== 'ROLLING';
  const isPlayerTurn = currentTurn === 'red';

  const handleRoll = () => {
    if(isRolling || !isPlayerTurn) return;
    const finalValue = Math.floor(Math.random() * 6) + 1;
    onDiceRoll(finalValue);
  }

  const turnColorClasses: Record<PlayerColor, string> = {
    red: 'turn-red',
    green: 'turn-green',
    yellow: 'turn-yellow',
    blue: 'turn-blue',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={handleRoll}
        disabled={isRolling || !isPlayerTurn}
        className={cn(
            "gradient-button text-lg font-bold py-3 px-6 rounded-lg animate-pulse",
            (isRolling || !isPlayerTurn) && "opacity-50 cursor-not-allowed",
            turnColorClasses[currentTurn]
        )}
      >
        <Dices className="mr-2" />
        Roll Dice
      </Button>
      <Dice 
        onRoll={onDiceRoll} 
        isRolling={isRolling}
        value={diceValue}
        currentTurn={currentTurn}
      />
    </div>
  );
}
