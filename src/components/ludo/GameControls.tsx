'use client';

import { Dice } from '@/components/ludo/Dice';
import { PlayerColor } from '@/lib/ludo-constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dices, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type GameControlsProps = {
  currentTurn: PlayerColor;
  phase: 'SETUP' | 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';
  diceValue: number | null;
  onDiceRoll: (value: number) => void;
  addSecondarySafePoints: boolean;
  onToggleSecondarySafePoints: () => void;
  isHumanTurn: boolean;
};

export function GameControls({ currentTurn, phase, diceValue, onDiceRoll, addSecondarySafePoints, onToggleSecondarySafePoints, isHumanTurn }: GameControlsProps) {
  const isRolling = phase !== 'ROLLING';

  const handleRoll = () => {
    if(isRolling || !isHumanTurn) return;
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
        <div className="flex items-center gap-4">
            <Button
                onClick={handleRoll}
                disabled={isRolling || !isHumanTurn}
                className={cn(
                    "gradient-button text-lg font-bold py-3 px-6 rounded-lg",
                    isHumanTurn && "animate-pulse",
                    (isRolling || !isHumanTurn) && "opacity-50 cursor-not-allowed",
                    turnColorClasses[currentTurn]
                )}
            >
                <Dices className="mr-2" />
                Roll Dice
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Settings />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Game Settings</h4>
                            <p className="text-sm text-muted-foreground">
                                Adjust game rules.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="secondary-safepoints"
                                    checked={addSecondarySafePoints}
                                    onCheckedChange={onToggleSecondarySafePoints}
                                />
                                <Label htmlFor="secondary-safepoints">Add Secondary SafePoints</Label>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
      <Dice 
        onRoll={onDiceRoll} 
        isRolling={isRolling}
        value={diceValue}
        currentTurn={currentTurn}
      />
    </div>
  );
}
