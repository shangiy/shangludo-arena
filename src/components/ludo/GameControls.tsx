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
  phase: 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';
  diceValue: number | null;
  onDiceRoll: (value: number) => void;
  secondaryYellowHome: boolean;
  onSecondaryYellowHomeChange: (value: boolean) => void;
  secondaryRedHome: boolean;
  onSecondaryRedHomeChange: (value: boolean) => void;
  secondaryBlueHome: boolean;
  onSecondaryBlueHomeChange: (value: boolean) => void;
  secondaryGreenHome: boolean;
  onSecondaryGreenHomeChange: (value: boolean) => void;
};

export function GameControls({ currentTurn, phase, diceValue, onDiceRoll, secondaryYellowHome, onSecondaryYellowHomeChange, secondaryRedHome, onSecondaryRedHomeChange, secondaryBlueHome, onSecondaryBlueHomeChange, secondaryGreenHome, onSecondaryGreenHomeChange }: GameControlsProps) {
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
        <div className="flex items-center gap-4">
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
                                Adjust custom game rules.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="secondary-yellow-safepoint">Add Yellow Safepoint</Label>
                                <Switch
                                    id="secondary-yellow-safepoint"
                                    checked={secondaryYellowHome}
                                    onCheckedChange={onSecondaryYellowHomeChange}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="secondary-red-safepoint">Add Red Safepoint</Label>
                                <Switch
                                    id="secondary-red-safepoint"
                                    checked={secondaryRedHome}
                                    onCheckedChange={onSecondaryRedHomeChange}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="secondary-blue-safepoint">Add Blue Safepoint</Label>
                                <Switch
                                    id="secondary-blue-safepoint"
                                    checked={secondaryBlueHome}
                                    onCheckedChange={onSecondaryBlueHomeChange}
                                />
                            </div>
                             <div className="flex items-center justify-between">
                                <Label htmlFor="secondary-green-safepoint">Add Green Safepoint</Label>
                                <Switch
                                    id="secondary-green-safepoint"
                                    checked={secondaryGreenHome}
                                    onCheckedChange={onSecondaryGreenHomeChange}
                                />
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
