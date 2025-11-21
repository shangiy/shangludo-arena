"use client";

import type { ReactNode } from "react";
import { Home } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Dice3D } from "./Dice3D";
import type { GameSetup } from "./GameSetupForm";

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

const turnColorClasses: Record<PlayerColor, string> = {
    red: 'border-red-500',
    green: 'border-green-500',
    yellow: 'border-yellow-400',
    blue: 'border-blue-500',
};

const turnBgClasses: Record<PlayerColor, string> = {
    red: 'bg-red-500/10',
    green: 'bg-green-500/10',
    yellow: 'bg-yellow-400/10',
    blue: 'bg-blue-500/10',
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
  const timerPercentage = (timerValue / timerDuration) * 100;
  const isHumanTurn = isCurrentTurn && player.type === "human";

  return (
    <div className={cn("relative flex h-full w-full flex-col items-center justify-between rounded-lg border-2 bg-card p-4 transition-all", isCurrentTurn ? turnColorClasses[color] : 'border-transparent')}>
        <div className={cn("absolute inset-0 -z-10 transition-opacity", isCurrentTurn ? cn("opacity-100", turnBgClasses[color]) : "opacity-0")} />
        <h3 className="text-lg font-bold">{player.name}</h3>
        <div className="flex-1 flex items-center justify-center">
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
        <div className="w-full space-y-1">
            <p className="text-center text-sm font-mono text-muted-foreground">
                {(timerValue / 1000).toFixed(1)}s
            </p>
            <Progress value={timerPercentage} className="h-2" indicatorClassName={cn(isCurrentTurn ? `bg-${color}-500` : "bg-muted-foreground")} />
        </div>
    </div>
  );
}

type FiveMinGameLayoutProps = {
  children: ReactNode;
  gameSetup: GameSetup;
  currentTurn: PlayerColor;
  turnTimer: number;
  turnTimerDuration: number;
  isRolling: boolean;
  diceRollDuration: number;
  onRollStart: () => void;
  onDiceRoll: (value: number) => void;
  diceValue: number | null;
  onResetAndGoHome: () => void;
};

export function FiveMinGameLayout({
  children,
  gameSetup,
  currentTurn,
  turnTimer,
  turnTimerDuration,
  isRolling,
  diceRollDuration,
  onRollStart,
  onDiceRoll,
  diceValue,
  onResetAndGoHome
}: FiveMinGameLayoutProps) {
    const { players } = gameSetup;
    const redPlayer = players.find(p => p.color === 'red')!;
    const greenPlayer = players.find(p => p.color === 'green')!;
    const bluePlayer = players.find(p => p.color === 'blue')!;
    const yellowPlayer = players.find(p => p.color === 'yellow')!;


  return (
    <div className="relative h-screen w-screen p-4 flex flex-col items-center justify-center gap-4 bg-background">
      <AlertDialog>
          <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="absolute top-4 left-4 z-10">
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

      <div className="w-full flex justify-center">
        <div className="w-48">
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
        <div className="h-full w-48">
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
        
        <div className="h-full w-48">
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
         <div className="w-48">
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
