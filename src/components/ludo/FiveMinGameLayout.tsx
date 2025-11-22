
"use client";

import { useState, type ReactNode } from "react";
import { Home, Settings, Volume2, VolumeX, Timer, Bell, BellOff, Dice5, Star, HelpCircle, Users } from "lucide-react";
import { PlayerColor } from "@/lib/ludo-constants";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dice3D } from "./Dice3D";
import type { GameSetup, PlayerSetup } from "./GameSetupForm";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type PlayerPodProps = {
  player: { name: string; type: "human" | "ai" };
  color: PlayerColor;
  isCurrentTurn: boolean;
  timerValue: number;
  timerDuration: number;
  isRolling: boolean;
  diceRollDuration: number;
  onRollStart: () => void;
  onDiceRoll: (value: number) => void;
  diceValue: number | null;
};

const strokeColorClasses: Record<PlayerColor, string> = {
    red: 'stroke-red-500',
    green: 'stroke-green-500',
    yellow: 'stroke-yellow-400',
    blue: 'stroke-blue-500',
};


function PlayerPod({
  player,
  color,
  isCurrentTurn,
  timerValue,
  timerDuration,
  isRolling,
  diceRollDuration,
  onRollStart,
  onDiceRoll,
  diceValue
}: PlayerPodProps) {
  const timerPercentage = (timerValue / timerDuration);
  const isHumanTurn = isCurrentTurn && player.type === "human";

  const rectSize = 160;
  const strokeWidth = 4;
  const cornerRadius = 8;
  const perimeter = (rectSize - 2 * cornerRadius) * 4 + (2 * Math.PI * cornerRadius);
  const offset = perimeter * (1 - timerPercentage);


  return (
    <div className={cn("relative flex h-full w-full flex-col items-center justify-between p-4")}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${rectSize + strokeWidth} ${rectSize + strokeWidth}`}
        >
          <rect
            x={strokeWidth/2}
            y={strokeWidth/2}
            width={rectSize}
            height={rectSize}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
            className={cn(!isCurrentTurn && "opacity-0")}
          />
          <rect
            x={strokeWidth/2}
            y={strokeWidth/2}
            width={rectSize}
            height={rectSize}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={perimeter}
            strokeDashoffset={offset}
            className={cn(
              "transition-[stroke-dashoffset] duration-1000 linear",
              isCurrentTurn ? strokeColorClasses[color] : 'stroke-transparent'
            )}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }}
          />
        </svg>


        <h3 className="text-lg font-bold z-10">{player.name}</h3>
        <div className="flex-1 flex items-center justify-center z-10">
            <Dice3D
                rolling={isCurrentTurn && isRolling}
                onRollStart={onRollStart}
                onRollEnd={onDiceRoll}
                color={color}
                duration={diceRollDuration}
                isHumanTurn={isHumanTurn && !isRolling}
                diceValue={isCurrentTurn ? diceValue : null}
            />
        </div>
        <div className="w-full space-y-1 z-10 h-6" />
    </div>
  );
}

function GameTimer({ remaining }: { remaining: number }) {
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="flex items-center gap-2 font-bold text-lg text-foreground bg-background/80 px-3 py-1.5 rounded-lg border">
        <Timer className="h-5 w-5" />
        <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
}


type FiveMinGameLayoutProps = {
  children: ReactNode;
  gameSetup: GameSetup;
  onGameSetupChange: (newSetup: GameSetup) => void;
  currentTurn: PlayerColor;
  turnTimer: number;
  turnTimerDuration: number;
  onTurnTimerDurationChange: (duration: number) => void;
  gameTimer: number;
  gameTimerDuration: number;
  onGameTimerDurationChange: (duration: number) => void;
  isRolling: boolean;
  diceRollDuration: number;
  onDiceRollDurationChange: (duration: number) => void;
  onRollStart: () => void;
  onDiceRoll: (value: number) => void;
  diceValue: number | null;
  onResetAndGoHome: () => void;
  muteSound: boolean;
  onToggleMuteSound: () => void;
  showNotifications: boolean;
  onToggleShowNotifications: () => void;
  addSecondarySafePoints: boolean;
  onToggleSecondarySafePoints: () => void;
};

export function FiveMinGameLayout({
  children,
  gameSetup,
  onGameSetupChange,
  currentTurn,
  turnTimer,
  turnTimerDuration,
  onTurnTimerDurationChange,
  gameTimer,
  gameTimerDuration,
  onGameTimerDurationChange,
  isRolling,
  diceRollDuration,
  onDiceRollDurationChange,
  onRollStart,
  onDiceRoll,
  diceValue,
  onResetAndGoHome,
  muteSound,
  onToggleMuteSound,
  showNotifications,
  onToggleShowNotifications,
  addSecondarySafePoints,
  onToggleSecondarySafePoints,
}: FiveMinGameLayoutProps) {
    const { players } = gameSetup;
    const redPlayer = players.find(p => p.color === 'red')!;
    const greenPlayer = players.find(p => p.color === 'green')!;
    const bluePlayer = players.find(p => p.color === 'blue')!;
    const yellowPlayer = players.find(p => p.color === 'yellow')!;
    
    const [newGameTimerDuration, setNewGameTimerDuration] = useState(gameTimerDuration / 60000);
    const [newTurnTimerDuration, setNewTurnTimerDuration] = useState(turnTimerDuration / 1000);
    const [newDiceRollDuration, setNewDiceRollDuration] = useState(2);
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);
    const [playerConfig, setPlayerConfig] = useState<PlayerSetup[]>(gameSetup.players);

    const handlePlayerConfigChange = (color: PlayerColor, type: 'human' | 'ai') => {
        setPlayerConfig(prev => prev.map(p => p.color === color ? {...p, type} : p));
    };

    const handlePlayerNameChange = (color: PlayerColor, name: string) => {
        setPlayerConfig(prev => prev.map(p => p.color === color ? {...p, name} : p));
    };

    const handleApplyAllChanges = () => {
      onGameTimerDurationChange(newGameTimerDuration * 60000);
      onTurnTimerDurationChange(newTurnTimerDuration * 1000);
      onGameSetupChange({
        ...gameSetup,
        players: playerConfig,
      });
      setIsSettingsOpen(false);
    };


  return (
    <div className="relative h-screen w-screen p-4 flex flex-col items-center justify-center gap-4 bg-background">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
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

        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
           <TooltipProvider>
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Adjust in-game preferences.
                </p>
              </div>

               <div className="space-y-2">
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Player Configuration</Label>
                 <div className="space-y-2 rounded-lg border p-2">
                  {playerConfig.map(p => (
                      <div key={p.color} className="flex items-center justify-between gap-2">
                          {p.type === 'human' ? (
                                <Input
                                    value={p.name}
                                    onChange={(e) => handlePlayerNameChange(p.color, e.target.value)}
                                    className="h-8 flex-1"
                                />
                          ) : (
                            <Label htmlFor={`player-type-${p.color}`} className="capitalize flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", `bg-${p.color}-500`)} />
                                {p.name}
                            </Label>
                          )}
                          <Select
                            value={p.type}
                            onValueChange={(value: 'human' | 'ai') => handlePlayerConfigChange(p.color, value)}
                          >
                              <SelectTrigger className="w-32 h-8">
                                  <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="human">Human</SelectItem>
                                  <SelectItem value="ai">AI</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  ))}
                 </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mute-sound" className="flex items-center gap-2">
                     {muteSound ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    Mute Sound
                  </Label>
                  <Switch id="mute-sound" checked={muteSound} onCheckedChange={onToggleMuteSound} />
                </div>
                 <div className="flex items-center justify-between">
                  <Label htmlFor="show-notifications" className="flex items-center gap-2">
                     {showNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    Show Notifications
                  </Label>
                  <Switch id="show-notifications" checked={showNotifications} onCheckedChange={onToggleShowNotifications} />
                </div>
                 <div className="flex items-center justify-between">
                  <Label htmlFor="secondary-safepoints" className="flex items-center gap-2">
                     <Star className="h-4 w-4" />
                    Secondary Safe Points
                  </Label>
                  <Switch id="secondary-safepoints" checked={addSecondarySafePoints} onCheckedChange={onToggleSecondarySafePoints} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="game-timer" className="flex items-center gap-2 flex-shrink-0">
                    <Timer className="h-4 w-4" />
                    Game Time (min)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="game-timer"
                      type="number"
                      min="1"
                      max="60"
                      className="w-20"
                      value={newGameTimerDuration}
                      onChange={(e) => setNewGameTimerDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="turn-timer" className="flex items-center gap-2 flex-shrink-0">
                    <Timer className="h-4 w-4" />
                    Turn Time Limit (s)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="turn-timer"
                      type="number"
                      min="5"
                      max="60"
                      step="5"
                      className="w-20"
                      value={newTurnTimerDuration}
                      onChange={(e) => setNewTurnTimerDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="dice-timer" className="flex items-center gap-2 flex-shrink-0">
                    <Dice5 className="h-4 w-4" />
                    Dice Rolling Time (s)
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Max time in seconds for the dice animation.</p>
                        </TooltipContent>
                     </Tooltip>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dice-timer"
                      type="number"
                      min="1"
                      max="2"
                      step="1"
                      className="w-20"
                      value={newDiceRollDuration}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={handleApplyAllChanges}>Apply Player Changes</Button>
            </div>
           </TooltipProvider>
          </PopoverContent>
        </Popover>

        <GameTimer remaining={gameTimer} />
      </div>

      <div className="w-full flex justify-center pt-16">
        <div className="w-48 h-48">
            <PlayerPod 
                player={greenPlayer}
                color="green"
                isCurrentTurn={currentTurn === 'green'}
                timerValue={currentTurn === 'green' ? turnTimer : turnTimerDuration}
                timerDuration={turnTimerDuration}
                isRolling={isRolling}
                diceRollDuration={diceRollDuration}
                onRollStart={onRollStart}
                onDiceRoll={onDiceRoll}
                diceValue={diceValue}
            />
        </div>
      </div>
      
      <div className="flex w-full items-center justify-center gap-4 flex-1">
        <div className="h-48 w-48">
            <PlayerPod 
                player={redPlayer}
                color="red"
                isCurrentTurn={currentTurn === 'red'}
                timerValue={currentTurn === 'red' ? turnTimer : turnTimerDuration}
                timerDuration={turnTimerDuration}
                isRolling={isRolling}
                diceRollDuration={diceRollDuration}
                onRollStart={onRollStart}
                onDiceRoll={onDiceRoll}
                diceValue={diceValue}
            />
        </div>

        <div className="w-full max-w-2xl relative">
            {children}
        </div>
        
        <div className="h-48 w-48">
            <PlayerPod 
                player={yellowPlayer}
                color="yellow"
                isCurrentTurn={currentTurn === 'yellow'}
                timerValue={currentTurn === 'yellow' ? turnTimer : turnTimerDuration}
                timerDuration={turnTimerDuration}
                isRolling={isRolling}
                diceRollDuration={diceRollDuration}
                onRollStart={onRollStart}
                onDiceRoll={onDiceRoll}
                diceValue={diceValue}
            />
        </div>
      </div>
      
      <div className="w-full flex justify-center">
         <div className="w-48 h-48">
            <PlayerPod 
                player={bluePlayer}
                color="blue"
                isCurrentTurn={currentTurn === 'blue'}
                timerValue={currentTurn === 'blue' ? turnTimer : turnTimerDuration}
                timerDuration={turnTimerDuration}
                isRolling={isRolling}
                diceRollDuration={diceRollDuration}
                onRollStart={onRollStart}
                onDiceRoll={onDiceRoll}
                diceValue={diceValue}
            />
        </div>
      </div>
    </div>
  );
}
