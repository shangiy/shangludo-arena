"use client";

import { PlayerColor } from '@/lib/ludo-constants';
import { Button } from '@/components/ui/button';
import { Settings, HelpCircle, Home } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import type { GameSetup } from './GameSetupForm';
import { Input } from '../ui/input';
import { Dice3D } from './Dice3D';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


type GameControlsProps = {
  currentTurn: PlayerColor;
  phase: 'SETUP' | 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';
  diceValue: number | null;
  addSecondarySafePoints: boolean;
  onToggleSecondarySafePoints: () => void;
  isHumanTurn: boolean;
  showNotifications: boolean;
  onToggleShowNotifications: () => void;
  muteSound: boolean;
  onToggleMuteSound: () => void;
  diceRollDuration: number;
  onDiceRollDurationChange: (duration: number) => void;
  gameMode: string;
  gameSetup: GameSetup | null;
  onPlayerNameChange: (color: PlayerColor, newName: string) => void;
  nextPlayerColor: PlayerColor;
  onRollStart: () => void;
  onDiceRoll: (value: number) => void;
  onResetAndGoHome: () => void;
};

export function GameControls({
  currentTurn,
  phase,
  diceValue,
  addSecondarySafePoints,
  onToggleSecondarySafePoints,
  isHumanTurn,
  showNotifications,
  onToggleShowNotifications,
  muteSound,
  onToggleMuteSound,
  diceRollDuration,
  onDiceRollDurationChange,
  gameMode,
  gameSetup,
  onPlayerNameChange,
  nextPlayerColor,
  onRollStart,
  onDiceRoll,
  onResetAndGoHome
}: GameControlsProps) {

  const humanPlayer = gameSetup?.players.find(p => p.type === 'human');
  const isRolling = phase === 'MOVING' || phase === 'AI_THINKING';

  return (
    <div className="w-full flex justify-center items-center px-4 relative">
        <AlertDialog>
          <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="absolute top-0 left-4">
                <Home />
              </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current game progress will be lost. You will be returned to the main lobby.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onResetAndGoHome}>Leave Game</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

       <div className="w-48 h-48 relative flex items-center justify-center">
            {(gameMode === 'classic' || gameMode === 'quick' || gameMode === '5-min' || gameMode === 'local-multiplayer') && (
                <Dice3D
                    rolling={isRolling}
                    onRollStart={onRollStart}
                    onRollEnd={onDiceRoll}
                    color={currentTurn}
                    duration={diceRollDuration}
                    isHumanTurn={isHumanTurn && phase === 'ROLLING'}
                    diceValue={diceValue}
                />
            )}
        </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="absolute top-0 right-4">
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
              {gameSetup && humanPlayer && (
                <>
                  <div className="flex items-center justify-between">
                     <Label htmlFor="player-name">Change Your Name</Label>
                     <Input 
                       id="player-name"
                       defaultValue={humanPlayer.name}
                       className="w-40"
                       onBlur={(e) => onPlayerNameChange(humanPlayer.color, e.target.value)}
                     />
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="secondary-safepoints">Add Secondary SafePoints</Label>
                <Switch
                  id="secondary-safepoints"
                  checked={addSecondarySafePoints}
                  onCheckedChange={onToggleSecondarySafePoints}
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
                      {[1000, 2000, 3000, 5000].map(duration => (
                          <div key={duration} className="flex items-center space-x-2">
                              <RadioGroupItem value={String(duration)} id={`duration-${duration}`} />
                              <Label htmlFor={`duration-${duration}`} className="font-normal">{duration/1000}s</Label>
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
  );
}

    