
"use client";

import { useState, type ReactNode } from "react";
import { Home, Settings, Volume2, VolumeX, Timer, Bell, BellOff, Dice5, Star, HelpCircle, Users, Moon, Sun } from "lucide-react";
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
import { Dice } from "./Dice";
import type { GameSetup, PlayerSetup } from "./GameSetupForm";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { ScrollArea } from "../ui/scroll-area";
import Image from "next/image";
import { useTheme } from "@/hooks/use-theme";
import { EndLogo } from "../icons/EndLogo";
import { Progress } from "../ui/progress";

type PlayerPodProps = {
  player: { name: string; type: "human" | "ai" | "none" };
  color: PlayerColor;
  isCurrentTurn: boolean;
  isRolling: boolean;
  diceRollDuration: number;
  onRollStart: () => void;
  onDiceRoll: (value: number) => void;
  diceValue: number | null;
  phase: string;
  showNotifications: boolean;
  score: number;
  turnTimerProgress: number;
};

const turnIndicatorClasses: Record<PlayerColor, string> = {
    red: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] bg-red-500/5',
    green: 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.7)] bg-green-500/5',
    yellow: 'border-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.7)] bg-yellow-400/5',
    blue: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.7)] bg-blue-500/5',
};

function PlayerPod({
  player,
  color,
  isCurrentTurn,
  isRolling,
  diceRollDuration,
  onRollStart,
  onDiceRoll,
  diceValue,
  phase,
  showNotifications,
  score,
  turnTimerProgress
}: PlayerPodProps) {

  if (player.type === 'none') {
    return <div className="relative flex h-full min-h-28 w-full max-w-48 flex-col items-center justify-center p-2 rounded-lg" />;
  }

  const isHumanTurnAndRollingPhase = isCurrentTurn && player.type === 'human' && phase === 'ROLLING';
  const showTimer = isCurrentTurn && turnTimerProgress < 100;
  const isUrgent = turnTimerProgress < 25;

  return (
    <div className={cn(
        "relative flex flex-col items-center justify-start p-2 md:p-4 gap-2 md:gap-4 rounded-lg border-2 bg-card transition-all duration-300 w-full max-w-[12rem] min-h-[10rem] h-full select-none overflow-hidden",
        isCurrentTurn ? turnIndicatorClasses[color] : 'border-transparent'
    )}>
        {showTimer && (
           <div className="absolute inset-0 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                        d="M 50,2.5 L 97.5,2.5 L 97.5,97.5 L 2.5,97.5 L 2.5,2.5 Z"
                        fill="none"
                        className={cn("transition-all", isUrgent ? "stroke-red-500" : `stroke-${color}-500`)}
                        strokeWidth="2.5"
                        strokeDasharray="380"
                        strokeDashoffset={380 * (1 - turnTimerProgress / 100)}
                        style={{
                            transition: 'stroke-dashoffset 1s linear, stroke 0.3s'
                        }}
                    />
                </svg>
                {isUrgent && <div className="absolute inset-0 rounded-lg border-2 border-red-500/50 animate-pulse" />}
           </div>
        )}
        <h3 className="text-base md:text-lg font-bold truncate capitalize w-full text-center">{player.name}</h3>
        
        {isCurrentTurn ? (
           <Dice
             rolling={isRolling && isCurrentTurn}
             onRollStart={onRollStart}
             onRollEnd={onDiceRoll}
             color={color}
             duration={diceRollDuration}
             isHumanTurn={isHumanTurnAndRollingPhase}
             diceValue={isCurrentTurn ? diceValue : null}
             playerName={player.name}
           />
        ) : (
            <div className="flex flex-col items-center justify-center gap-2 h-full">
                <button className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-md text-xl font-bold transition-transform hover:scale-105 active:scale-95">
                    <EndLogo className="w-16 h-16 md:w-24 md:h-24" />
                </button>
            </div>
        )}

        <div className="w-full space-y-1 z-10 h-6 flex flex-col items-center justify-center text-center">
             {isCurrentTurn && phase === 'MOVING' && player.type === 'human' && showNotifications && (
                <p className="text-xs font-semibold capitalize text-center">
                    Select a pawn to move.
                </p>
            )}
        </div>
    </div>
  );
}

function GameTimer({ remaining }: { remaining: number }) {
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  const isLowTime = remaining < 60000;
  const isUrgent = remaining < 15000;

  return (
    <div className={cn(
      "flex items-center gap-2 font-bold text-lg text-foreground bg-background/80 px-3 py-1.5 rounded-lg border transition-colors",
      isLowTime && "text-red-500 border-red-500/50 bg-red-500/10",
      isUrgent && "animate-pulse"
    )}>
        <Timer className="h-5 w-5" />
        <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
}

function Scoreboard({ scores, players }: { scores: Record<PlayerColor, number>, players: PlayerSetup[] }) {
    const activePlayers = players.filter(p => p.type !== 'none');
    
    const playerMap = new Map(activePlayers.map(p => [p.color, p]));
    const displayOrder: {color: PlayerColor, justify: string, items: string}[] = [
        { color: 'red', justify: 'justify-start', items: 'items-start' },
        { color: 'green', justify: 'justify-end', items: 'items-start' },
        { color: 'blue', justify: 'justify-start', items: 'items-end' },
        { color: 'yellow', justify: 'justify-end', items: 'items-end' },
    ];
  
    return (
      <div className="absolute inset-0 w-full h-full p-2 pointer-events-none">
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
          {displayOrder.map(({ color, justify, items }) => {
              const player = playerMap.get(color);
              if (!player) return <div key={color} />;
              
              return (
                <div key={color} className={cn("flex p-2", justify, items)}>
                    <div className="flex flex-col items-center justify-center gap-1 text-sm p-1 text-center">
                        <span className="font-semibold capitalize truncate text-white">{player.name}</span>
                        <span className="font-bold text-base text-black">{scores[color]}</span>
                    </div>
                </div>
              );
            }
          )}
        </div>
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
  phase: string;
  scores: Record<PlayerColor, number>;
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
  phase,
  scores
}: FiveMinGameLayoutProps) {
    const { players } = gameSetup;
    const { theme, toggleTheme } = useTheme();
    const redPlayer = players.find(p => p.color === 'red') || { color: 'red', name: 'Empty', type: 'none' };
    const greenPlayer = players.find(p => p.color === 'green') || { color: 'green', name: 'Empty', type: 'none' };
    const bluePlayer = players.find(p => p.color === 'blue') || { color: 'blue', name: 'Empty', type: 'none' };
    const yellowPlayer = players.find(p => p.color === 'yellow') || { color: 'yellow', name: 'Empty', type: 'none' };
    
    const [newGameTimerDuration, setNewGameTimerDuration] = useState(gameTimerDuration / 60000);
    const [newTurnTimerDuration, setNewTurnTimerDuration] = useState(turnTimerDuration / 1000);
    const [newDiceRollDuration, setNewDiceRollDuration] = useState(diceRollDuration / 1000);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [playerConfig, setPlayerConfig] = useState<PlayerSetup[]>(gameSetup.players);

    const handlePlayerConfigChange = (color: PlayerColor, type: 'human' | 'ai' | 'none') => {
        setPlayerConfig(prev => {
            const playerExists = prev.some(p => p.color === color);
            const colorName = color.charAt(0).toUpperCase() + color.slice(1);

            if (type === 'none') {
                return prev.filter(p => p.color !== color);
            }
            if (playerExists) {
                return prev.map(p => {
                    if (p.color === color) {
                        const newName = p.type !== type ? (type === 'human' ? `${colorName} Player` : `${colorName} AI`) : p.name;
                        return {...p, type, name: newName };
                    }
                    return p;
                });
            }
            
            const newName = type === 'human' ? `${colorName} Player` : `${colorName} AI`;
            return [...prev, { color, type, name: newName }];
        });
    };

    const handlePlayerNameChange = (color: PlayerColor, name: string) => {
        setPlayerConfig(prev => prev.map(p => p.color === color ? {...p, name} : p));
    };

    const handleApplyAllChanges = () => {
      onGameTimerDurationChange(newGameTimerDuration * 60000);
      onTurnTimerDurationChange(newTurnTimerDuration * 1000);
      onDiceRollDurationChange(newDiceRollDuration * 1000);
      
      const turnOrder = playerConfig.map(p => p.color);

      onGameSetupChange({
        ...gameSetup,
        players: playerConfig,
        turnOrder,
      });
      setIsSettingsOpen(false);
    };
    
    const allPlayers: {color: PlayerColor, name: string}[] = [
        { color: 'red', name: 'Red' },
        { color: 'green', name: 'Green' },
        { color: 'yellow', name: 'Yellow' },
        { color: 'blue', name: 'Blue' },
    ];
    
    const turnTimerProgress = (turnTimer / turnTimerDuration) * 100;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center px-4 z-20 absolute top-4 left-1/2 -translate-x-1/2">
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
          
          <GameTimer remaining={gameTimer} />

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun /> : <Moon />}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Dark Mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 animated-border flex flex-col p-0">
                  <div className="absolute inset-0.5 bg-popover rounded-md z-0" />
                  <div className="relative z-10 flex flex-col h-[60vh] max-h-[500px]">
                      <div className="p-4 border-b">
                          <h4 className="font-medium leading-none">Settings</h4>
                      </div>
                      <ScrollArea className="flex-1">
                          <TooltipProvider>
                              <div className="grid gap-4 p-4">
                                  <div className="space-y-2">
                                      <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Player Configuration</Label>
                                      <div className="space-y-2 rounded-lg border p-2">
                                      {allPlayers.map(p => {
                                          const currentPlayerConfig = playerConfig.find(pc => pc.color === p.color);
                                          const type = currentPlayerConfig ? currentPlayerConfig.type : 'none';
                                          return (
                                          <div key={p.color} className="flex items-center justify-between gap-2">
                                              {type === 'human' ? (
                                              <Input
                                                  value={currentPlayerConfig?.name || ''}
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
                                          )
                                      })}
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
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                          <div className="flex items-center gap-2">
                                              <Input
                                              id="dice-timer"
                                              type="number"
                                              min="1"
                                              max="9"
                                              step="1"
                                              className="w-20"
                                              value={newDiceRollDuration}
                                              onChange={(e) => setNewDiceRollDuration(Number(e.target.value))}
                                              />
                                          </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                          <p>admin only level</p>
                                          </TooltipContent>
                                      </Tooltip>
                                      </div>
                                      <div className="space-y-2">
                                      <Label>Number of Dice</Label>
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
                              </div>
                          </TooltipProvider>
                      </ScrollArea>
                      <div className="p-4 border-t">
                          <Button size="sm" className="w-full" onClick={handleApplyAllChanges}>Apply Changes &amp; Play</Button>
                      </div>
                  </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Main Game Area */}
        <main className="w-full flex-1 flex flex-col items-center justify-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:grid-rows-1 max-w-7xl mx-auto pt-24 pb-12 md:pt-16">
            <div className="flex w-full justify-around md:flex-col md:justify-between md:items-end md:gap-4 transition-all duration-500">
                 <PlayerPod
                    player={redPlayer}
                    color="red"
                    isCurrentTurn={currentTurn === 'red'}
                    isRolling={isRolling}
                    diceRollDuration={diceRollDuration}
                    onRollStart={onRollStart}
                    onDiceRoll={onDiceRoll}
                    diceValue={diceValue}
                    phase={phase}
                    showNotifications={showNotifications}
                    score={scores.red}
                    turnTimerProgress={currentTurn === 'red' ? turnTimerProgress : 100}
                />
                 <PlayerPod
                  player={bluePlayer}
                  color="blue"
                  isCurrentTurn={currentTurn === 'blue'}
                  isRolling={isRolling}
                  diceRollDuration={diceRollDuration}
                  onRollStart={onRollStart}
                  onDiceRoll={onDiceRoll}
                  diceValue={diceValue}
                  phase={phase}
                  showNotifications={showNotifications}
                  score={scores.blue}
                  turnTimerProgress={currentTurn === 'blue' ? turnTimerProgress : 100}
                />
            </div>

            {/* Game Board and Scoreboard Container */}
            <div className="relative w-full max-w-[90vw] md:max-w-[70vh] aspect-square flex flex-col justify-center">
                {children}
                <Scoreboard scores={scores} players={gameSetup.players} />
            </div>

            <div className="flex w-full justify-around md:flex-col md:justify-between md:items-start md:gap-4 transition-all duration-500">
                <PlayerPod
                    player={greenPlayer}
                    color="green"
                    isCurrentTurn={currentTurn === 'green'}
                    isRolling={isRolling}
                    diceRollDuration={diceRollDuration}
                    onRollStart={onRollStart}
                    onDiceRoll={onDiceRoll}
                    diceValue={diceValue}
                    phase={phase}
                    showNotifications={showNotifications}
                    score={scores.green}
                    turnTimerProgress={currentTurn === 'green' ? turnTimerProgress : 100}
                />
                <PlayerPod
                    player={yellowPlayer}
                    color="yellow"
                    isCurrentTurn={currentTurn === 'yellow'}
                    isRolling={isRolling}
                    diceRollDuration={diceRollDuration}
                    onRollStart={onRollStart}
                    onDiceRoll={onDiceRoll}
      
                    diceValue={diceValue}
                    phase={phase}
                    showNotifications={showNotifications}
                    score={scores.yellow}
                    turnTimerProgress={currentTurn === 'yellow' ? turnTimerProgress : 100}
                />
            </div>
        </main>
      </div>
  );
}

    

    


