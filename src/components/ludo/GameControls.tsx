'use client';

import { Dice3D } from '@/components/ludo/Dice3D';
import { PlayerColor } from '@/lib/ludo-constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dices, Settings, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type GameControlsProps = {
  currentTurn: PlayerColor;
  phase: 'SETUP' | 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';
  diceValue: number | null;
  onDiceRoll: (value: number) => void;
  addSecondarySafePoints: boolean;
  onToggleSecondarySafePoints: () => void;
  isHumanTurn: boolean;
  showNotifications: boolean;
  onToggleShowNotifications: () => void;
  muteSound: boolean;
  onToggleMuteSound: () => void;
  diceRollDuration: number;
  onDiceRollDurationChange: (duration: number) => void;
};

export function GameControls({
  currentTurn,
  phase,
  diceValue,
  onDiceRoll,
  addSecondarySafePoints,
  onToggleSecondarySafePoints,
  isHumanTurn,
  showNotifications,
  onToggleShowNotifications,
  muteSound,
  onToggleMuteSound,
  diceRollDuration,
  onDiceRollDurationChange,
}: GameControlsProps) {
  const isRollingDisabled = phase !== 'ROLLING' || !isHumanTurn;

  const handleRoll = () => {
    if (isRollingDisabled) return;
    const finalValue = Math.floor(Math.random() * 6) + 1;
    onDiceRoll(finalValue);
  };

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
          disabled={isRollingDisabled}
          className={cn(
            'gradient-button text-lg font-bold py-3 px-6 rounded-lg',
            !isRollingDisabled && 'animate-pulse',
            isRollingDisabled && 'opacity-50 cursor-not-allowed',
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
                <p className="text-sm text-muted-foreground">Adjust game rules and preferences.</p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="secondary-safepoints">Add Secondary SafePoints</Label>
                  <Switch
                    id="secondary-safepoints"
                    checked={addSecondarySafePoints}
                    onCheckedChange={onToggleSecondarySafePoints}
                    disabled={phase !== 'SETUP'}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-notifications">Show Notifications</Label>
                  <Switch
                    id="show-notifications"
                    checked={showNotifications}
                    onCheckedChange={onToggleShowNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mute-sound">Mute Sound</Label>
                  <Switch id="mute-sound" checked={muteSound} onCheckedChange={onToggleMuteSound} />
                </div>
                <Separator />
                 <div className="space-y-2">
                    <Label>Dice Roll Animation</Label>
                    <RadioGroup
                        value={String(diceRollDuration)}
                        onValueChange={(value) => onDiceRollDurationChange(Number(value))}
                        className="grid grid-cols-2 gap-2"
                    >
                        {[3000, 7000, 10000, 15000].map(duration => (
                            <div key={duration} className="flex items-center space-x-2">
                                <RadioGroupItem value={String(duration)} id={`duration-${duration}`} />
                                <Label htmlFor={`duration-${duration}`} className="font-normal">{duration/1000} seconds</Label>
                            </div>
                        ))}
                    </RadioGroup>
                 </div>
              </div>
              <Separator />
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="how-to-play">
                    <AccordionTrigger>
                        <h4 className="font-medium leading-none flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            How to Play
                        </h4>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="text-xs text-muted-foreground space-y-1 pr-6">
                            <p><strong>Objective:</strong> Be the first to move all 4 of your pawns from your yard to the home triangle.</p>
                            <p><strong>Rolling:</strong> Roll a 6 to move a pawn out of your yard onto the starting square. A roll of 6 gives you another turn.</p>
                            <p><strong>Capturing:</strong> Landing on a square occupied by a single opponent pawn captures it, sending it back to their yard. You get another turn for capturing.</p>
                            <p><strong>Safe Zones:</strong> Pawns on star-marked safe zones cannot be captured.</p>
                            <p><strong>Winning:</strong> You must roll the exact number to enter the home column. The first player with all 4 pawns home wins.</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Dice3D 
        onClick={handleRoll} 
        rolling={phase === 'MOVING' || phase === 'AI_THINKING'}
        value={diceValue}
        color={currentTurn}
        isHumanTurn={isHumanTurn}
        duration={diceRollDuration}
      />
    </div>
  );
}
