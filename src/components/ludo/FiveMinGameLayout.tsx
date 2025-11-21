
"use client";

import type { ReactNode } from "react";
import { Home, Settings, Volume2, VolumeX, Timer, Bell, BellOff } from "lucide-react";
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
import type { GameSetup } from "./GameSetupForm";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
        <div className="w-full space-y-1 z-10 h-6">
            <p className="text-center text-sm font-mono text-muted-foreground">
                {(timerValue / 1000).toFixed(1)}s
            </p>
        </div>
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
  currentTurn: PlayerColor;
  turnTimer: number;
  turnTimerDuration: number;
  gameTimer: number;
  gameTimerDuration: number;
  isRolling: boolean;
  diceRollDuration: number;
  onRollStart: () => void;
  onDiceRoll: (value: number) => void;
  diceValue: number | null;
  onResetAndGoHome: () => void;
  muteSound: boolean;
  onToggleMuteSound: () => void;
  showNotifications: boolean;
  onToggleShowNotifications: () => void;
};

export function FiveMinGameLayout({
  children,
  gameSetup,
  currentTurn,
  turnTimer,
  turnTimerDuration,
  gameTimer,
  gameTimerDuration,
  isRolling,
  diceRollDuration,
  onRollStart,
  onDiceRoll,
  diceValue,
  onResetAndGoHome,
  muteSound,
  onToggleMuteSound,
  showNotifications,
  onToggleShowNotifications
}: FiveMinGameLayoutProps) {
    const { players } = gameSetup;
    const redPlayer = players.find(p => p.color === 'red')!;
    const greenPlayer = players.find(p => p.color === 'green')!;
    const bluePlayer = players.find(p => p.color === 'blue')!;
    const yellowPlayer = players.find(p => p.color === 'yellow')!;


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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Adjust in-game preferences.
                </p>
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
              </div>
            </div>
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
