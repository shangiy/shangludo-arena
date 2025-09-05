'use client';

import { motion } from 'framer-motion';
import { Award, User, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dice } from '@/components/ludo/Dice';
import { cn } from '@/lib/utils';
import { PlayerColor, Pawn, PLAYER_COLORS } from '@/lib/ludo-constants';

type GameControlsProps = {
  currentTurn: PlayerColor;
  phase: 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';
  diceValue: number | null;
  onDiceRoll: (value: number) => void;
  pawns: Record<PlayerColor, Pawn[]>;
};

export function GameControls({ currentTurn, phase, diceValue, onDiceRoll, pawns }: GameControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Dice 
        onRoll={onDiceRoll} 
        isRolling={phase !== 'ROLLING' || currentTurn !== 'red'}
        value={diceValue}
      />
    </div>
  );
}
