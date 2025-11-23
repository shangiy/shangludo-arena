
"use client";

import { useState } from 'react';
import { PlayerColor } from '@/lib/ludo-constants';
import { Button } from '@/components/ui/button';
import { Settings, HelpCircle, Home, Users, Star, Bell, BellOff, Volume2, VolumeX, Dice5 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import type { GameSetup, PlayerSetup } from './GameSetupForm';
import { Input } from '../ui/input';
import { Dice } from './Dice';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';


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
  onGameSetupChange: (newSetup: GameSetup) => void;
  onApplyGameSetupChanges: () => void;
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
  onGameSetupChange,
  onApplyGameSetupChanges,
  nextPlayerColor,
  onRollStart,
  onDiceRoll,
  onResetAndGoHome
}: GameControlsProps) {

  const currentPlayerDetails = gameSetup?.players.find(p => p.color === currentTurn);
  const isRolling = phase === 'AI_THINKING' || (phase === 'ROLLING' && !isHumanTurn);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleApplyAllChanges = () => {
    onApplyGameSetupChanges();
    setIsSettingsOpen(false);
  };

  const handlePlayerConfigChange = (color: PlayerColor, type: 'human' | 'ai' | 'none') => {
      if (!gameSetup) return;
      const currentPlayers = gameSetup.players;
      
      let newPlayers: PlayerSetup[];
      const playerExists = currentPlayers.some(p => p.color === color);

      if (type === 'none') {
        newPlayers = currentPlayers.filter(p => p.color !== color);
      } else if (playerExists) {
        newPlayers = currentPlayers.map(p => {
          if (p.color === color) {
            const colorName = color.charAt(0).toUpperCase() + color.slice(1);
            let name = p.name;
            // Only change name if the type is actually changing to avoid overwriting user input
            if (p.type !== type) {
               name = type === 'human' ? `${colorName} Player` : type === 'ai' ? `${colorName} AI` : 'Empty';
            }
            return { ...p, type, name };
          }
          return p;
        });
      } else {
        const colorName = color.charAt(0).toUpperCase() + color.slice(1);
        const name = type === 'human' ? `${colorName} Player` : type === 'ai' ? `${colorName} AI` : 'Empty';
        newPlayers = [...currentPlayers, { color, name, type }];
      }

      onGameSetupChange({...gameSetup, players: newPlayers});
  };

  const handlePlayerNameChange = (color: PlayerColor, name: string) => {
      if (!gameSetup) return;
      const newPlayers = gameSetup.players.map(p => 
        p.color === color ? {...p, name} : p
      );
      onGameSetupChange({...gameSetup, players: newPlayers});
  };


  const classicRules = (
    <>
      <p><strong>Objective:</strong> Be the first to move all 4 of your pawns from your yard to the home triangle.</p>
      <p><strong>Rolling:</strong> You must roll a 6 to move a pawn out of your yard onto the starting square. A roll of 6 gives you another turn.</p>
      <p><strong>Capturing:</strong> Landing on a square occupied by a single opponent pawn captures it, sending it back to their yard. You get another turn for capturing.</p>
      <p><strong>Safe Zones:</strong> Pawns on star-marked safe zones cannot be captured.</p>
      <p><strong>Winning:</strong> The first player to get just one of their four pawns to the center home space wins the game.</p>
    </>
  );

  const quickPlayRules = (
    <>
        <p><strong>Objective:</strong> Be the first to move just ONE of your 4 pawns to the home triangle.</p>
        <p><strong>Glass Walls:</strong> Each player's home entry is blocked by a glass wall (`🚫`). You cannot enter your home run until your wall is broken.</p>
        <p><strong>Breaking Walls:</strong> To break your glass wall, you must capture an opponent's pawn. This will shatter your wall with a sound and permanently open your home entry.</p>
        <p><strong>Starting a Pawn:</strong> You must roll a 6 to move a pawn from your yard onto the board.</p>
        <p><strong>Winning:</strong> The first player to get just one of their four pawns to the center home space wins the game.</p>
    </>
  );

  const allPlayers: {color: PlayerColor, name: string}[] = [
      { color: 'red', name: 'Red' },
      { color: 'green', name: 'Green' },
      { color: 'yellow', name: 'Yellow' },
      { color: 'blue', name: 'Blue' },
  ];
  
  const currentPlayersForUI = gameSetup?.players || [];

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

       <div className="w-48 h-24 relative flex items-center justify-center">
            {gameMode !== '5-min' && currentPlayerDetails && (
                <Dice
                    rolling={isRolling}
                    onRollStart={onRollStart}
                    onRollEnd={onDiceRoll}
                    color={currentTurn}
                    duration={diceRollDuration}
                    isHumanTurn={isHumanTurn && phase === 'ROLLING'}
                    diceValue={diceValue}
                    playerName={currentPlayerDetails.name}
                />
            )}
        </div>

      <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="absolute top-0 right-4">
            <Settings />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Settings</h4>
            </div>
            <Separator />
            <div className="space-y-2">
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Player Configuration</Label>
                 <div className="space-y-2 rounded-lg border p-2">
                  {allPlayers.map(p => {
                      const currentPlayerConfig = currentPlayersForUI.find(pc => pc.color === p.color);
                      const type = currentPlayerConfig ? currentPlayerConfig.type : 'none';
                      
                      return (
                      <div key={p.color} className="flex items-center justify-between gap-2">
                          {type === 'human' && currentPlayerConfig ? (
                                <Input
                                    value={currentPlayerConfig.name}
                                    onChange={(e) => handlePlayerNameChange(p.color, e.target.value)}
                                    className="h-8 flex-1"
                                />
                          ) : (
                            <Label htmlFor={`player-type-${p.color}`} className="capitalize flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", `bg-${p.color}-500`)} />
                                {p.color}
                            </Label>
                          )}
                          <Select
                            value={type}
                            onValueChange={(value: 'human' | 'ai' | 'none') => handlePlayerConfigChange(p.color, value)}
                          >
                              <SelectTrigger className="w-32 h-8">
                                  <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="human">Human</SelectItem>
                                  <SelectItem value="ai">AI</SelectItem>
                                  <SelectItem value="none">No One</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  )})}
                 </div>
              </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="secondary-safepoints" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Secondary SafePoints
                </Label>
                <Switch
                  id="secondary-safepoints"
                  checked={addSecondarySafePoints}
                  onCheckedChange={onToggleSecondarySafePoints}
                />
              </div>
              <div className="flex items-center justify-between">
                 <Label htmlFor="show-notifications" className="flex items-center gap-2">
                     {showNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                     Show Notifications
                 </Label>
                <Switch
                  id="show-notifications"
                  checked={showNotifications}
                  onCheckedChange={onToggleShowNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                 <Label htmlFor="mute-sound" className="flex items-center gap-2">
                    {muteSound ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    Mute Sound
                 </Label>
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
                <Separator />
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Dice5 className="h-4 w-4" />Number of Dice</Label>
                    <RadioGroup
                        defaultValue="1"
                        className="grid grid-cols-4 gap-2"
                    >
                        {[1, 2, 3, 4].map(num => (
                            <div key={num} className="flex items-center space-x-2">
                                <RadioGroupItem value={String(num)} id={`dice-num-${num}`} />
                                <Label htmlFor={`dice-num-${num}`} className="font-normal">{num}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </div>
            
            <Button size="sm" className="w-full mt-2" onClick={handleApplyAllChanges}>
                Apply Changes & Play
            </Button>

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
                      <div className="text-xs text-muted-foreground space-y-2 pr-6">
                          {gameMode === 'quick' ? quickPlayRules : classicRules}
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

    