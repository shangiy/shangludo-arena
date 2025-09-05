'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, User } from 'lucide-react';
import Image from 'next/image';

import { generateAIMove } from '@/ai/flows/ai-opponent';
import {
  GameBoard,
  Pawn as PawnComponent,
} from '@/components/ludo/GameBoard';
import { GameControls } from '@/components/ludo/GameControls';
import {
  PLAYER_COLORS,
  PATHS,
  START_POSITIONS,
  SAFE_ZONES,
  PlayerColor,
  Pawn,
  ChatMessage,
} from '@/lib/ludo-constants';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '../icons/Logo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

type GamePhase = 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';

const initialPawns = (): Record<PlayerColor, Pawn[]> => {
  const pawns: any = {};
  (Object.keys(PLAYER_COLORS) as PlayerColor[]).forEach((color) => {
    pawns[color] = Array(4)
      .fill(0)
      .map((_, i) => ({
        id: i,
        color,
        position: -1, // -1 is in the yard
        isHome: false,
      }));
  });
  return pawns;
};

const PlayerInfo = ({
    color,
    name,
    isCurrentPlayer,
  }: {
    color: PlayerColor;
    name: string;
    isCurrentPlayer: boolean;
  }) => {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-2 rounded-lg p-2 transition-all',
          isCurrentPlayer && `bg-${color}-500/30`
        )}
      >
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full border-4',
            `border-${color}-500 bg-${color}-500/50`
          )}
        >
          {name === 'Player' ? (
            <User className="h-8 w-8 text-white" />
          ) : (
            <Bot className="h-8 w-8 text-white" />
          )}
        </div>
        <p className="font-bold text-white">{name}</p>
      </div>
    );
  };


export default function GameClient() {
  const searchParams = useSearchParams();
  const gameMode = searchParams.get('mode') || 'classic';
  const { toast } = useToast();

  const [pawns, setPawns] = useState<Record<PlayerColor, Pawn[]>>(initialPawns);
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('ROLLING');
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const players: { name: string; color: PlayerColor }[] = [
    { name: 'Computer', color: 'blue' },
    { name: 'Computer', color: 'yellow' },
    { name: 'Player', color: 'red' },
    { name: 'Computer', color: 'green' },
  ];
  const playerOrder: PlayerColor[] = ['red', 'yellow', 'green', 'blue'];


  useEffect(() => {
    setIsMounted(true);
    addMessage('System', `Game started! Mode: ${gameMode}. ${currentTurn}'s turn to roll.`);
  }, [gameMode]);

  const addMessage = (sender: string, text: string, color?: PlayerColor) => {
    setMessages((prev) => [{ sender, text, color }, ...prev].slice(0, 5));
  };

  const nextTurn = () => {
    const currentIndex = playerOrder.indexOf(currentTurn);
    const nextPlayer = playerOrder[(currentIndex + 1) % playerOrder.length];
    setCurrentTurn(nextPlayer);
    setPhase('ROLLING');
    setDiceValue(null);
    addMessage('System', `${nextPlayer.charAt(0).toUpperCase() + nextPlayer.slice(1)}'s turn to roll.`);
  };

  const handleDiceRoll = (value: number) => {
    setDiceValue(value);
    setPhase('MOVING');

    const possibleMoves = getPossibleMoves(currentTurn, value);
    if (possibleMoves.length === 0) {
      addMessage('System', `${currentTurn} rolled a ${value} but has no possible moves.`, currentTurn);
      setTimeout(() => {
        if (value !== 6) nextTurn();
        else {
          setPhase('ROLLING');
          addMessage('System', `${currentTurn} rolled a 6 and gets to roll again.`);
        }
      }, 1000);
    } else {
        addMessage('System', `${currentTurn} rolled a ${value}. Select a pawn to move.`, currentTurn);
        if (possibleMoves.length === 1 && (currentTurn === 'red' || gameMode === 'quick')) {
            // Automatically move if only one option for human or any for AI
            setTimeout(() => handlePawnMove(possibleMoves[0].pawn), 500);
        }
    }
  };

  const getPossibleMoves = (player: PlayerColor, roll: number) => {
    const playerPawns = pawns[player];
    const moves: { pawn: Pawn; newPosition: number }[] = [];

    playerPawns.forEach((pawn) => {
      if (pawn.isHome) return;

      if (pawn.position === -1 && roll === 6) {
        // Move out of yard
        const startPos = START_POSITIONS[player];
        moves.push({ pawn, newPosition: startPos });
      } else if (pawn.position !== -1) {
        // Move on board
        const currentPath = PATHS[player];
        const currentPathIndex = currentPath.indexOf(pawn.position);
        
        if (currentPathIndex !== -1 && currentPathIndex + roll < currentPath.length) {
          const newPosition = currentPath[currentPathIndex + roll];
          moves.push({ pawn, newPosition });
        }
      }
    });
    return moves;
  };
  
  const handlePawnMove = (pawnToMove: Pawn) => {
    if (!diceValue || pawnToMove.color !== currentTurn || phase !== 'MOVING') return;

    const possibleMoves = getPossibleMoves(currentTurn, diceValue);
    const selectedMove = possibleMoves.find(m => m.pawn.id === pawnToMove.id);

    if (!selectedMove) {
        toast({
            variant: "destructive",
            title: "Invalid Move",
            description: "This pawn cannot make that move.",
        });
        return;
    }

    const { newPosition } = selectedMove;

    setPawns(prev => {
        const newPawns = { ...prev };
        const pawnsOfPlayer = [...newPawns[currentTurn]];
        const pawnIndex = pawnsOfPlayer.findIndex(p => p.id === pawnToMove.id);
        
        pawnsOfPlayer[pawnIndex] = { ...pawnsOfPlayer[pawnIndex], position: newPosition };

        let captured = false;
        if (!SAFE_ZONES.includes(newPosition)) {
            (Object.keys(newPawns) as PlayerColor[]).forEach(color => {
                if (color !== currentTurn) {
                    newPawns[color] = newPawns[color].map(p => {
                        if (p.position === newPosition) {
                            captured = true;
                            addMessage("System", `${currentTurn} captured ${color}'s pawn!`, currentTurn);
                            return { ...p, position: -1 };
                        }
                        return p;
                    });
                }
            });
        }
        
        const currentPath = PATHS[currentTurn];
        if (newPosition === currentPath[currentPath.length - 1]) {
            pawnsOfPlayer[pawnIndex].isHome = true;
            addMessage("System", `${currentTurn}'s pawn reached home!`, currentTurn);
        }

        newPawns[currentTurn] = pawnsOfPlayer;

        const allHome = newPawns[currentTurn].every(p => p.isHome);
        if (allHome) {
            setWinner(currentTurn);
            setPhase('GAME_OVER');
            addMessage("System", `${currentTurn.toUpperCase()} wins the game!`);
        }

        if (diceValue !== 6 && !captured && !allHome) {
            nextTurn();
        } else if (!allHome) {
            setPhase('ROLLING');
            addMessage('System', `${currentTurn} gets another turn!`);
        }
        
        return newPawns;
    });

    setDiceValue(null);
  };
  
  // AI Logic
  useEffect(() => {
    const isAiTurn = playerOrder.includes(currentTurn) && currentTurn !== 'red';
    if (isAiTurn && phase === 'ROLLING' && !winner && isMounted) {
      setPhase('AI_THINKING');
      const aiRoll = Math.floor(Math.random() * 6) + 1;
      
      setTimeout(async () => {
        addMessage('AI', `${currentTurn} is thinking after rolling a ${aiRoll}...`, currentTurn);
        setDiceValue(aiRoll);

        const possibleMoves = getPossibleMoves(currentTurn, aiRoll);

        if (possibleMoves.length === 0) {
            addMessage('AI', `AI (${currentTurn}) rolled a ${aiRoll} but has no moves.`, currentTurn);
            setTimeout(() => {
                if (aiRoll !== 6) nextTurn();
                else {
                    setPhase('ROLLING');
                    addMessage('System', `AI (${currentTurn}) gets to roll again.`);
                }
            }, 1000);
            return;
        }
        
        if (possibleMoves.length === 1) {
          setTimeout(() => handlePawnMove(possibleMoves[0].pawn), 500);
          return;
        }

        const boardStateString = JSON.stringify(pawns);

        try {
          const aiResponse = await generateAIMove({
            boardState: boardStateString,
            currentPlayer: currentTurn,
            diceRoll: aiRoll,
          });

          addMessage('AI', `Reasoning: ${aiResponse.reasoning}`, currentTurn);

          const pawnIdMatch = aiResponse.move.match(/pawn:(\d+)/);
          let chosenPawn: Pawn | undefined;

          if (pawnIdMatch) {
            const pawnId = parseInt(pawnIdMatch[1], 10);
            chosenPawn = possibleMoves.find(m => m.pawn.id === pawnId)?.pawn;
          }

          if (!chosenPawn) {
            addMessage('AI', 'AI made an invalid choice, picking first valid move.', currentTurn);
            chosenPawn = possibleMoves[0].pawn;
          }

          setTimeout(() => {
            handlePawnMove(chosenPawn!);
          }, 1000);

        } catch (error) {
          console.error("AI Error:", error);
          addMessage('System', 'AI failed. Picking first available move.', currentTurn);
          const fallbackPawn = possibleMoves[0].pawn;
          setTimeout(() => {
            handlePawnMove(fallbackPawn);
          }, 500);
        }
      }, 1500);
    }
  }, [currentTurn, phase, winner, isMounted]);

  const possibleMovesForHighlight = useMemo(() => {
    if (phase === 'MOVING' && diceValue && currentTurn === 'red') {
      return getPossibleMoves(currentTurn, diceValue);
    }
    return [];
  }, [phase, diceValue, currentTurn, pawns]);

  const renderPawns = () => {
    const allPawns: (Pawn & { highlight: boolean })[] = [];
    (Object.keys(pawns) as PlayerColor[]).forEach(color => {
      pawns[color].forEach(pawn => {
        const isPlayerTurn = pawn.color === currentTurn;
        const canMove = possibleMovesForHighlight.some(move => move.pawn.id === pawn.id && move.pawn.color === pawn.color);
        allPawns.push({ ...pawn, highlight: isPlayerTurn && canMove });
      });
    });
    return allPawns.map(pawn => <PawnComponent key={`${pawn.color}-${pawn.id}`} {...pawn} onPawnClick={handlePawnMove} />);
  };

  const getProgress = (color: PlayerColor) => {
    const playerPawns = pawns[color];
    const totalDistance = PATHS[color].length * 4;
    let currentDistance = 0;
    playerPawns.forEach(pawn => {
        if(pawn.isHome) {
            currentDistance += PATHS[color].length;
        } else if (pawn.position !== -1) {
            currentDistance += PATHS[color].indexOf(pawn.position) + 1;
        }
    });
    return (currentDistance / totalDistance) * 100;
  }

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Preparing the Arena...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <Dialog open={!!winner}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Game Over!</DialogTitle>
                    <DialogDescription className="text-center">
                        <span className={`font-semibold capitalize text-${winner}`}>{winner}</span> has won the game!
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center items-center p-4">
                    <Logo className="h-24 w-24" />
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={() => window.location.reload()}>Play Again</Button>
                    <Button variant="secondary" asChild>
                        <Link href="/">Back to Lobby</Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-8">
        <div className="w-full lg:w-1/4 flex flex-row lg:flex-col justify-around lg:justify-start gap-4 order-2 lg:order-1">
            <PlayerInfo color="red" name="Player" isCurrentPlayer={currentTurn === 'red'} />
            <PlayerInfo color="yellow" name="Computer" isCurrentPlayer={currentTurn === 'yellow'} />
        </div>

        <div className="w-full max-w-2xl lg:w-1/2 order-1 lg:order-2">
            <div className="relative">
                <AnimatePresence>
                {phase === 'AI_THINKING' && (
                    <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 rounded-lg"
                    >
                    <Loader2 className="h-16 w-16 animate-spin text-white" />
                    </motion.div>
                )}
                </AnimatePresence>
                <GameBoard>
                {renderPawns()}
                </GameBoard>

                {/* Progress bars */}
                <div className="absolute top-[45%] -left-12 w-10">
                    <Progress value={getProgress('red')} className={`w-10 h-2 -rotate-90 bg-${'red'}-200/20`} indicatorClassName={`bg-${'red'}-500`} />
                    <p className="text-white text-xs text-center -rotate-90 mt-2"> {Math.round(getProgress('red'))}%</p>
                </div>
                 <div className="absolute top-[45%] -right-12 w-10">
                    <Progress value={getProgress('green')} className={`w-10 h-2 rotate-90 bg-${'green'}-200/20`} indicatorClassName={`bg-${'green'}-500`} />
                    <p className="text-white text-xs text-center rotate-90 mt-2">{Math.round(getProgress('green'))}%</p>
                </div>
                <div className="absolute top-[-3rem] left-1/2 -translate-x-1/2 w-10">
                    <Progress value={getProgress('yellow')} className={`w-10 h-2 bg-${'yellow'}-200/20`} indicatorClassName={`bg-${'yellow'}-500`} />
                    <p className="text-white text-xs text-center mt-1">{Math.round(getProgress('yellow'))}%</p>
                </div>
                 <div className="absolute bottom-[-3rem] left-1/2 -translate-x-1/2 w-10">
                    <Progress value={getProgress('blue')} className={`w-10 h-2 bg-${'blue'}-200/20`} indicatorClassName={`bg-${'blue'}-500`} />
                     <p className="text-white text-xs text-center mt-1">{Math.round(getProgress('blue'))}%</p>
                </div>
            </div>
             <div className="mt-8 flex justify-center items-center">
                 {currentTurn === 'red' && phase === 'ROLLING' && (
                     <p className="text-white font-semibold text-lg animate-pulse">Your turn to roll!</p>
                 )}
                 <GameControls
                    currentTurn={currentTurn}
                    phase={phase}
                    diceValue={diceValue}
                    onDiceRoll={handleDiceRoll}
                    pawns={pawns}
                />
            </div>
        </div>

        <div className="w-full lg:w-1/4 flex flex-row lg:flex-col justify-around lg:justify-start gap-4 order-3 lg:order-3">
             <PlayerInfo color="green" name="Computer" isCurrentPlayer={currentTurn === 'green'} />
             <PlayerInfo color="blue" name="Computer" isCurrentPlayer={currentTurn === 'blue'} />
        </div>
      </main>
    </div>
  );
}
