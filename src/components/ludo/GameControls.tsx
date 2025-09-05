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
  
  const PlayerInfo = ({ color, name, icon }: { color: PlayerColor, name: string, icon: React.ReactNode }) => {
    const pawnsHome = pawns[color].filter(p => p.isHome).length;
    const isActive = currentTurn === color;

    return (
      <div className={cn("flex items-center justify-between p-3 rounded-lg transition-all", isActive ? `bg-${color}-200/50 border-2 border-${color}-400` : 'bg-muted/50')}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", `bg-${color}-500`)}>
            {icon}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>{pawnsHome} / 4</span>
            </div>
          </div>
        </div>
        {isActive && (
          <motion.div
            className="h-2 w-2 rounded-full bg-accent"
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    );
  };
    
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center font-headline text-2xl">Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="space-y-3">
          <PlayerInfo color="blue" name="You" icon={<User className="text-white" />} />
          <PlayerInfo color="red" name="AI Opponent" icon={<Bot className="text-white" />} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <p className="font-semibold">
            {phase === 'ROLLING' && `${currentTurn === 'blue' ? 'Your' : 'AI'} turn to Roll`}
            {phase === 'MOVING' && 'Select a Pawn to Move'}
            {phase === 'AI_THINKING' && 'AI is Deciding...'}
            {phase === 'GAME_OVER' && 'Game Over!'}
          </p>
          <Dice 
            onRoll={onDiceRoll} 
            isRolling={phase !== 'ROLLING' || currentTurn !== 'blue'}
            value={diceValue}
          />
        </div>
      </CardContent>
    </Card>
  );
}
