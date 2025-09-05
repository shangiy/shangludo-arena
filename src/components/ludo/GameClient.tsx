'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, User, Hand } from 'lucide-react';
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

const PlayerAvatar = ({
    color,
    name,
    isCurrentPlayer,
  }: {
    color: PlayerColor;
    name: string;
    isCurrentPlayer: boolean;
  }) => {
    
    const BORDER_COLORS: Record<PlayerColor, string> = {
        red: 'border-red-500',
        green: 'border-green-500',
        yellow: 'border-yellow-400',
        blue: 'border-blue-500',
    }
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg p-1 transition-all w-20 h-20',
          isCurrentPlayer && `bg-black/30`
        )}
      >
        <div className={cn("flex h-full w-full items-center justify-center rounded-md border-4", BORDER_COLORS[color], `bg-background`)}>
           {name === 'Player' ? (
            <User className="h-8 w-8 text-white" />
          ) : (
            <Bot className="h-8 w-8 text-white" />
          )}
        </div>
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

  const players: Record<PlayerColor, { name: string, color: PlayerColor }> = {
    blue: { name: 'Computer', color: 'blue' },
    yellow: { name: 'Computer', color: 'yellow' },
    red: { name: 'Player', color: 'red' },
    green: { name: 'Computer', color: 'green' },
  };
  const playerOrder: PlayerColor[] = ['red', 'yellow', 'green', 'blue'];


  useEffect(() => {
    setIsMounted(true);
    addMessage('System', `Game started! Mode: ${gameMode}. Your turn to roll.`);
  }, [gameMode]);

  useEffect(() => {
    if (winner) {
      // Handle game over logic, maybe show a toast or redirect
      toast({
        title: "Game Over!",
        description: `${players[winner].name} has won the game!`,
        duration: 5000,
      });
    }
  }, [winner, players, toast]);

  const addMessage = (sender: string, text: string, color?: PlayerColor) => {
    setMessages((prev) => [{ sender, text, color }, ...prev].slice(0, 5));
  };

  const nextTurn = () => {
    const currentIndex = playerOrder.indexOf(currentTurn);
    const nextPlayer = playerOrder[(currentIndex + 1) % playerOrder.length];
    setCurrentTurn(nextPlayer);
    setPhase('ROLLING');
    setDiceValue(null);
    const nextPlayerName = players[nextPlayer].name === 'Player' ? 'Your' : `${nextPlayer}'s`;
    addMessage('System', `${nextPlayerName} turn to roll.`);
  };

  const handleDiceRoll = (value: number) => {
    setDiceValue(value);
    setPhase('MOVING');

    const possibleMoves = getPossibleMoves(currentTurn, value);
    if (possibleMoves.length === 0) {
      addMessage(players[currentTurn].name, `rolled a ${value} but has no possible moves.`, currentTurn);
      setTimeout(() => {
        if (value !== 6) nextTurn();
        else {
          setPhase('ROLLING');
          addMessage('System', `${currentTurn} rolled a 6 and gets to roll again.`);
        }
      }, 1000);
    } else {
        addMessage(players[currentTurn].name, `rolled a ${value}. Select a pawn to move.`, currentTurn);
        if (possibleMoves.length === 1 || players[currentTurn].name !== 'Player') {
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
        if (currentTurn === 'red') {
            toast({
                variant: "destructive",
                title: "Invalid Move",
                description: "This pawn cannot make that move.",
            });
        }
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
            const turnPlayerName = players[currentTurn].name === 'Player' ? 'You get' : `${currentTurn} gets`;
            addMessage('System', `${turnPlayerName} another turn!`);
        }
        
        return newPawns;
    });

    setDiceValue(null);
  };
  
  // AI Logic
  useEffect(() => {
    const isAiTurn = playerOrder.includes(currentTurn) && players[currentTurn].name !== 'Player';
    if (isAiTurn && phase === 'ROLLING' && !winner && isMounted) {
      setPhase('AI_THINKING');
      addMessage('AI', `${currentTurn} is thinking...`, currentTurn);
      const aiRoll = Math.floor(Math.random() * 6) + 1;
      
      setTimeout(async () => {
        setDiceValue(aiRoll);
        handleDiceRoll(aiRoll);
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
    const allPawns: (Pawn & { highlight: boolean; isStacked: boolean })[] = [];
    const positions: { [key: number]: number } = {};
  
    (Object.keys(pawns) as PlayerColor[]).forEach(color => {
      pawns[color].forEach(pawn => {
        if (pawn.position !== -1) {
          positions[pawn.position] = (positions[pawn.position] || 0) + 1;
        }
      });
    });
  
    (Object.keys(pawns) as PlayerColor[]).forEach(color => {
      pawns[color].forEach(pawn => {
        const isPlayerTurn = pawn.color === currentTurn;
        const canMove = possibleMovesForHighlight.some(move => move.pawn.id === pawn.id && move.pawn.color === pawn.color);
        const isStacked = pawn.position !== -1 && positions[pawn.position] > 1;
        allPawns.push({ ...pawn, highlight: isPlayerTurn && canMove, isStacked });
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
  
  const renderPlayersInfo = () => {
    const playerPositions: Record<PlayerColor, string> = {
        yellow: 'col-start-1 col-end-7 row-start-1 row-end-2', // Top-left
        green: 'col-start-10 col-end-16 row-start-1 row-end-2', // Top-right
        red: 'col-start-1 col-end-7 row-start-8 row-end-9', // Bottom-left
        blue: 'col-start-10 col-end-16 row-start-8 row-end-9', // Bottom-right
    };

    return (Object.keys(players) as PlayerColor[]).map(color => {
        const player = players[color];
        let gridPosition;
        if(color === 'yellow') gridPosition = 'col-start-1 col-end-7 row-start-1 row-end-7';
        if(color === 'green') gridPosition = 'col-start-10 col-end-16 row-start-1 row-end-7';
        if(color === 'red') gridPosition = 'col-start-1 col-end-7 row-start-10 row-end-16';
        if(color === 'blue') gridPosition = 'col-start-10 col-end-16 row-start-10 row-end-16';

        const namePosition = (color === 'yellow' || color === 'green') ? 'top-2' : 'bottom-2';
        const progressPosition = (color === 'yellow' || color === 'green') ? 'bottom-2' : 'top-2';

        return (
            <div key={color} className={cn('flex flex-col items-center justify-center text-white p-2', gridPosition)}>
                <p className={cn('font-bold absolute', namePosition)}>{player.name}</p>
                <p className={cn('font-semibold text-sm absolute', progressPosition)}>{Math.round(getProgress(color))}%</p>
            </div>
        )
    })
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
        {winner && (
            <Dialog open={!!winner} onOpenChange={(open) => !open && window.location.reload()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Game Over!</DialogTitle>
                        <DialogDescription className="text-center">
                            {winner && <><span className={`font-semibold capitalize text-${winner}`}>{players[winner].name}</span> has won the game!</>}
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
        )}

      <main className="w-full max-w-7xl mx-auto flex flex-col items-center gap-6">
        <div className="w-full flex justify-between px-4 lg:px-20">
            <PlayerAvatar color="yellow" name={players.yellow.name} isCurrentPlayer={currentTurn === 'yellow'}/>
            <PlayerAvatar color="green" name={players.green.name} isCurrentPlayer={currentTurn === 'green'}/>
        </div>

        <div className="w-full max-w-2xl">
            <div className="relative">
                <AnimatePresence>
                {phase === 'AI_THINKING' && (
                    <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 rounded-lg"
                    >
                    <Loader2 className="h-16 w-16 animate-spin text-white" />
                    <p className="text-white mt-2 font-semibold">{currentTurn} is thinking...</p>
                    </motion.div>
                )}
                </AnimatePresence>
                <GameBoard playersInfo={renderPlayersInfo()}>
                   {renderPawns()}
                </GameBoard>
            </div>
        </div>
        
        <div className="w-full flex justify-between items-center px-4 lg:px-20">
            <PlayerAvatar color="red" name={players.red.name} isCurrentPlayer={currentTurn === 'red'}/>
            <div className="flex items-center gap-2">
              {(currentTurn === 'red' && phase === 'ROLLING') && <Hand className="h-10 w-10 text-yellow-400 -scale-x-100 animate-pulse" fill="currentColor"/>}
               <GameControls
                  currentTurn={currentTurn}
                  phase={phase}
                  diceValue={diceValue}
                  onDiceRoll={handleDiceRoll}
                  pawns={pawns}
              />
            </div>
            <PlayerAvatar color="blue" name={players.blue.name} isCurrentPlayer={currentTurn === 'blue'}/>
        </div>
      </main>
    </div>
  );
}
