
"use client";

import { useState, type ReactNode } from "react";
import { Home, Settings, Volume2, VolumeX, Timer, Bell, BellOff, Dice5, Star, HelpCircle, Users, Moon, Sun, Pause } from "lucide-react";
import { PlayerColor, type Pawn, PATHS } from "@/lib/ludo-constants";
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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { ScrollArea } from "../ui/scroll-area";
import { useTheme } from "@/hooks/use-theme";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

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

const turnStrokeColorClasses: Record<PlayerColor, string> = {
  red: 'stroke-red-500',
  green: 'stroke-green-500',
  yellow: 'stroke-yellow-400',
  blue: 'stroke-blue-500',
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
        "relative flex flex-col items-center justify-start py-2 px-2 gap-2 rounded-lg border-2 bg-card transition-all duration-300 w-32 md:w-36 max-w-[8rem] md:max-w-none h-32 md:h-44 select-none overflow-hidden",
        isCurrentTurn ? turnIndicatorClasses[color] : 'border-transparent'
    )}>
        {showTimer && (
           <div className="absolute inset-0 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                        d="M 2.5,2.5 L 97.5,2.5 L 97.5,97.5 L 2.5,97.5 Z"
                        fill="none"
                        className={cn("transition-all", isUrgent ? "stroke-red-500" : turnStrokeColorClasses[color])}
                        strokeWidth="5"
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
        <div className="w-full text-center h-6 flex items-center justify-center">
            <h3 className="text-sm md:text-lg font-bold truncate capitalize">{player.name}</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center">
            {isCurrentTurn ? (
            <Dice3D
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
                    <div className="w-12 h-12 flex items-center justify-center rounded-md text-xl font-bold">
                        <Dice5 className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                </div>
            )}

        </div>
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
      "flex items-center justify-center gap-2 font-bold text-lg text-foreground bg-background/80 px-3 py-1.5 rounded-lg border",
      isLowTime && "text-red-500 border-red-500/50 bg-red-500/10",
      isUrgent && "animate-pulse"
    )}>
        <Timer className="h-5 w-5" />
        <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
}

function Scoreboard({ scores, players, pawns, gameMode }: { scores: Record<PlayerColor, number>, players: PlayerSetup[], pawns: Record<PlayerColor, Pawn[]>, gameMode: string }) {
    const activePlayers = players.filter(p => p.type !== 'none');
    
    const getProgressPercentage = (color: PlayerColor) => {
        const playerPawns = pawns[color];
        if (!playerPawns || playerPawns.length === 0) return 0;
    
        const path = PATHS[color];
        const totalPathLength = path.length - 1; 
        const maxProgress = (gameMode === 'quick' ? 1 : 4) * totalPathLength;
    
        let currentProgress = 0;
        playerPawns.forEach(pawn => {
            if (pawn.isHome) {
                currentProgress += totalPathLength;
            } else if (pawn.position !== -1) { 
                const pathIndex = path.indexOf(pawn.position);
                if (pathIndex !== -1) {
                    currentProgress += pathIndex;
                }
            }
        });
        
        const percentage = (currentProgress / maxProgress) * 100;
        return Math.floor(Math.min(100, percentage));
    };

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

              const displayValue = gameMode === '5-min' 
                ? scores[color]
                : `${getProgressPercentage(color)}%`;
              
              return (
                <div key={color} className={cn("flex p-2", justify, items)}>
                    <div className="flex flex-col items-center justify-center gap-1 text-sm p-1 text-center">
                        <span className="font-semibold capitalize truncate text-white">{player.name}</span>
                        <span className="font-bold text-base text-black">{displayValue}</span>
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
  pawns: Record<PlayerColor, Pawn[]>;
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
  onPauseGame: () => void;
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
  pawns,
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
  onPauseGame,
  muteSound,
  onToggleMuteSound,
  showNotifications,
  onToggleShowNotifications,
  addSecondarySafePoints,
  onToggleSecondarySafePoints,
  phase,
  scores
}: FiveMinGameLayoutProps) {
    const { players, gameMode } = gameSetup;
    const { theme, toggleTheme } = useTheme();
    const redPlayer = players.find(p => p.color === 'red') || { color: 'red', name: 'Empty', type: 'none' };
    const greenPlayer = players.find(p => p.color === 'green') || { color: 'green', name: 'Empty', type: 'none' };
    const bluePlayer = players.find(p => p.color === 'blue') || { color: 'blue', name: 'Empty', type: 'none' };
    const yellowPlayer = players.find(p => p.color === 'yellow') || { color: 'yellow', name: 'Empty', type: 'none' };
    
    const [newGameTimerDuration, setNewGameTimerDuration] = useState(gameTimerDuration / 60000);
    const [newTurnTimerDuration, setNewTurnTimerDuration] = useState(turnTimerDuration / 1000);
    const [newDiceRollDuration, setNewDiceRollDuration] = useState(diceRollDuration / 1000);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleApplyAllChanges = () => {
      onGameTimerDurationChange(newGameTimerDuration * 60000);
      onTurnTimerDurationChange(newTurnTimerDuration * 1000);
      onDiceRollDurationChange(newDiceRollDuration * 1000);
      onGameSetupChange(gameSetup);
      setIsSettingsOpen(false);
    };
    
    const turnTimerProgress = (turnTimer / turnTimerDuration) * 100;
    
    const classicRules = (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <h4 className="font-bold mb-2">Objective</h4>
          <p>Be the first player to move all four of your pawns from your starting yard, around the entire board, and into your home column.</p>
        </div>
        <div>
          <h4 className="font-bold mb-2">Starting the Game</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>To move a pawn out of your yard onto the starting square, you must roll a 6.</li>
            <li>If you roll a 6, you get an additional roll in that turn.</li>
            <li>If you roll two 6s consecutively, your third roll will not be a 6. Your turn continues with the number rolled.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2">Movement & Capturing</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pawns move clockwise around the track according to the number rolled.</li>
            <li>If your pawn lands on a square occupied by a single opponent's pawn, the opponent's pawn is captured and sent back to their yard.</li>
            <li>Capturing a pawn grants you an additional roll.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2">Special Squares</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Safe Zones:</strong> Squares marked with a star are safe zones. Pawns on these squares cannot be captured.</li>
            <li><strong className="text-foreground">Home Column:</strong> After a pawn travels the entire board, it enters its colored home column. Opponents cannot enter your home column.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2">Winning the Game</h4>
          <p>To win, you must move all four of your pawns into the center home triangle. You must roll the exact number to get a pawn home; overshooting is not allowed.</p>
        </div>
      </div>
    );
  
    const quickRules = (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p><strong>Objective:</strong> Be the first to move just ONE of your 4 pawns to the home triangle.</p>
        <p><strong>Starting a Pawn:</strong> Pawns start on the board. You do not need a 6 to start.</p>
        <p><strong>Glass Walls:</strong> Each player's home entry is blocked by a glass wall (`🚫`). You cannot enter your home run until your wall is broken.</p>
        <p><strong>Breaking Walls & Capturing:</strong> To break your glass wall, you must capture an opponent's pawn. This will shatter your wall with a sound and permanently open your home entry.</p>
        <ul className="list-disc pl-5 space-y-1">
            <li><strong>Opponent's Pawn Goes Home:</strong> The opponent's pawn is immediately removed from the board and sent back to their starting yard.</li>
            <li><strong>Your Glass Wall Breaks:</strong> If your "glass wall" was still up, this capture shatters it! You'll hear a glass-breaking sound, and your path to the home triangle is now permanently open.</li>
            <li><strong>You Get Another Turn:</strong> Just like in classic Ludo, capturing a pawn rewards you with an extra roll of the dice.</li>
        </ul>
        <p><strong>Special Capture Rule:</strong> When you roll a 1 and land your pawn on the same square as an opponent's pawn, you capture it and remain there alone. Any other pawns on that square (friend or foe) are sent back to their respective yards.</p>
        <p><strong>Blockades:</strong> Two of your own pawns on the same square create a blockade that other players cannot pass.</p>
        <p><strong>Winning:</strong> The first player to get just one of their four pawns to the center home space wins the game.</p>
      </div>
    );
  
    const fiveMinRules = (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p><strong>Objective:</strong> Get the highest score before the 5-minute timer runs out!</p>
        <p><strong>Starting:</strong> All your pawns start on the board, ready to move. No need to roll a 6 to begin.</p>
        <p><strong>Captured Pawns:</strong> If one of your pawns is captured, it goes back to your starting yard. You must roll a 6 to bring it back onto the track.</p>
        <p><strong>Scoring:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>+1 point for each step a pawn moves.</li>
          <li>+20 points for capturing an opponent's pawn.</li>
          <li>+50 points for moving a pawn to the home space.</li>
          <li>-20 points when your pawn is captured.</li>
        </ul>
        <p><strong>Instant Win:</strong> If you get all 4 of your pawns to the home triangle before the timer ends, you win instantly!</p>
        <p><strong>Time's Up:</strong> If the timer runs out, the player with the highest score wins. In case of a tie, the player with more pawns finished wins.</p>
      </div>
    );

    const powerUpRules = (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p><strong>Objective:</strong> Be the first to get all 4 of your pawns home, using special powers to your advantage!</p>
          <p><strong>Starting:</strong> All pawns start on the board, ready to move immediately. No need to roll a 6.</p>
          <p><strong>Power-Up Spaces:</strong> Land on a space with a star to get a random power-up. You can only hold one at a time. Use it on your turn before rolling the dice.</p>
          <p><strong>Power-Ups Include:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Shield (Passive):</strong> Your pawn cannot be captured for one full round of the board. The shield is visible.</li>
            <li><strong>Teleport (Immediate):</strong> Instantly move one of your pawns to the next safe zone on its path.</li>
            <li><strong>Double Roll (Next Turn):</strong> Your next dice roll's value is doubled. If you roll a 3, you move 6 spaces.</li>
            <li><strong>Strike (Immediate):</strong> Choose any single opponent's pawn on the board (not on a safe zone or in their yard) and send it back to their yard. This does not grant an extra turn.</li>
          </ul>
          <p><strong>Gameplay:</strong> Standard Ludo rules apply for movement and capturing. Use your power-ups strategically to gain an edge, defend your pawns, or disrupt your opponents. Winning is still about getting all your pawns home first!</p>
        </div>
      );
  
    const getRules = () => {
      switch (gameSetup.gameMode) {
        case 'quick': return quickRules;
        case '5-min': return fiveMinRules;
        case 'powerup': return powerUpRules;
        default: return classicRules;
      }
    }


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
          
          <div className="hidden md:flex flex-col items-center">
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground leading-tight">{gameMode === '5-min' ? '5-Minutes' : 'Quick Play'}</p>
              <p className="text-xs text-muted-foreground leading-tight">Game Mode</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-blue-500/10 border-blue-500/50 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600" onClick={onPauseGame}>
                        <Pause />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Pause Game</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Sheet>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <HelpCircle />
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How to Play</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>How to Play: {gameSetup.gameMode === 'quick' ? 'Quick Play' : gameSetup.gameMode === '5-min' ? '5-Minute' : gameSetup.gameMode === 'powerup' ? 'Power-Up' : 'Classic'} Ludo</SheetTitle>
                  <SheetDescription>
                    Here are the rules for the current game mode.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-4rem)] pr-4">
                  {getRules()}
                </ScrollArea>
              </SheetContent>
            </Sheet>

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
                                      {gameSetup.gameMode === '5-min' && (
                                        <>
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
                                        </>
                                      )}
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

        <main className="w-full flex-1 flex flex-col items-center justify-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:grid-rows-[1fr_auto_1fr] max-w-7xl mx-auto pt-20 md:pt-16 pb-4 md:pb-12 h-screen">
          
          <div className="flex w-full justify-around md:hidden">
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
          </div>

          <div className="md:col-start-1 md:row-start-1 md:justify-self-end md:self-end">
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
          </div>
          <div className="md:col-start-3 md:row-start-1 md:justify-self-start md:self-end">
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
          </div>
           <div className="md:col-start-1 md:row-start-3 md:justify-self-end md:self-start">
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
           <div className="md:col-start-3 md:row-start-3 md:justify-self-start md:self-start">
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
          
          <div className="relative w-full max-w-[90vw] md:max-w-[70vh] aspect-square md:col-start-2 md:row-span-3 md:row-start-1 flex flex-col items-center justify-center gap-2">
              <div className="w-full flex justify-center">
                {gameMode === '5-min' && <GameTimer remaining={gameTimer} />}
              </div>
              <div className="relative w-full aspect-square">
                {children}
                <Scoreboard scores={scores} players={gameSetup.players} pawns={pawns} gameMode={gameMode} />
              </div>
          </div>

          <div className="flex w-full justify-around md:hidden">
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
