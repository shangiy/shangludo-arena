'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, User, Hand, MessageSquare } from 'lucide-react';
import Image from 'next/image';

import { generateAIMove } from '@/ai/flows/ai-opponent';
import {
  GameBoard,
  Pawn as PawnComponent,
} from '@/components/ludo/GameBoard';
import { GameControls } from '@/components/ludo/GameControls';
import { ChatPanel } from '@/components/ludo/ChatPanel';
import {
  PLAYER_COLORS,
  PATHS,
  START_POSITIONS,
  SAFE_ZONES,
  PlayerColor,
  Pawn,
  ChatMessage,
  HOME_ENTRANCES,
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
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

const PlayerIcon = ({
    color,
    isPlayer,
  }: {
    color: PlayerColor;
    isPlayer: boolean;
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
          'flex items-center justify-center rounded-lg p-1 transition-all w-16 h-16 bg-background border-4',
          BORDER_COLORS[color]
        )}
      >
        <div className={cn("flex h-full w-full items-center justify-center rounded-md", `bg-card`)}>
           {isPlayer ? (
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
  const [isChatOpen, setIsChatOpen] = useState(false);

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
  
  const addMessage = (sender: string, text: string, color?: PlayerColor) => {
    setMessages((prev) => [{ sender, text, color }, ...prev]);
  };
  
  const handleSendMessage = (text: string) => {
    addMessage('You', text, 'red');
    // Here you could add logic to send the message to other players in a multiplayer game
    // For now, we can have a simple AI response for demonstration
    setTimeout(() => {
        addMessage('Computer', "I'm just a simple AI, I can't chat right now!", 'yellow')
    }, 1000)
  }

  useEffect(() => {
    if (winner) {
      addMessage('System', `${players[winner]?.name} has won the game!`);
      toast({
        title: "Game Over!",
        description: `${players[winner]?.name} has won the game!`,
        duration: 5000,
      });
    }
  }, [winner]);

  const nextTurn = () => {
    const currentIndex = playerOrder.indexOf(currentTurn);
    const nextPlayer = playerOrder[(currentIndex + 1) % playerOrder.length];
    setCurrentTurn(nextPlayer);
    setPhase('ROLLING');
    setDiceValue(null);
    const nextPlayerName = players[nextPlayer].name === 'Player' ? 'Your' : `${players[nextPlayer].name}'s`;
    addMessage('System', `${nextPlayerName} turn to roll.`);
  };

  const getPossibleMoves = (player: PlayerColor, roll: number) => {
    const playerPawns = pawns[player];
    const moves: { pawn: Pawn; newPosition: number }[] = [];
    const allPawns = Object.values(pawns).flat();
  
    const pawnsInYard = playerPawns.filter(p => p.position === -1);
    if (roll === 6 && pawnsInYard.length > 0) {
      const startPos = START_POSITIONS[player];
      const pawnsAtStart = playerPawns.filter(p => p.position === startPos).length;
      if (pawnsAtStart < 2) {
         // This is a valid move, but don't return immediately, just add it to the list
         pawnsInYard.forEach(pawn => moves.push({ pawn, newPosition: startPos }));
      }
    }

    playerPawns.forEach((pawn) => {
      if (pawn.isHome || pawn.position === -1) return;

      const currentPath = PATHS[player];
      const currentPathIndex = currentPath.indexOf(pawn.position);
      
      if (currentPathIndex !== -1 && currentPathIndex + roll < currentPath.length) {
        const newPosition = currentPath[currentPathIndex + roll];
        
        // Check for blockades on the path
        let isBlocked = false;
        for(let i = 1; i < roll; i++) { // check intermediate steps
          const stepPos = currentPath[currentPathIndex + i];
          const pawnsOnStep = allPawns.filter(p => p.position === stepPos);
          if (pawnsOnStep.length >= 2) { // Standard Ludo blockade rule
             isBlocked = true;
             break;
          }
        }
        
        const ownPawnsAtDestination = playerPawns.filter(p => p.position === newPosition).length;

        if (!isBlocked && ownPawnsAtDestination < 2) {
          moves.push({ pawn, newPosition });
        }
      }
    });
    return moves;
  };
  

  const handleDiceRoll = (value: number) => {
    setDiceValue(value);
    const possibleMoves = getPossibleMoves(currentTurn, value);
    
    if (possibleMoves.length === 0) {
      addMessage(players[currentTurn].name, `rolled a ${value} but has no valid moves.`, currentTurn);
      setTimeout(() => {
        if (value !== 6) nextTurn();
        else {
          setPhase('ROLLING');
          addMessage('System', `${players[currentTurn].name} rolled a 6 and gets to roll again.`);
        }
      }, 1000);
    } else {
        setPhase('MOVING');
        addMessage(players[currentTurn].name, `rolled a ${value}. Select a pawn to move.`, currentTurn);
        if (players[currentTurn].name !== 'Player' && possibleMoves.length > 0) {
            setPhase('AI_THINKING');
            // AI makes a move
            setTimeout(() => handlePawnMove(possibleMoves[0].pawn), 1000);
        } else if (possibleMoves.length === 1 && currentTurn === 'red') {
            // Auto-move if only one option for the player
            setTimeout(() => handlePawnMove(possibleMoves[0].pawn), 1000);
        }
    }
  };
  
  
  const handlePawnMove = (pawnToMove: Pawn) => {
    if (!diceValue || pawnToMove.color !== currentTurn || phase !== 'MOVING') {
      // Allow clicking pawns in yard only on a 6
      if(pawnToMove.position === -1 && diceValue === 6) {
          // This is a valid move type, proceed to check it
      } else {
         return;
      }
    }

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
        const newPawns = JSON.parse(JSON.stringify(prev));
        const pawnsOfPlayer = newPawns[currentTurn];
        const pawnIndex = pawnsOfPlayer.findIndex((p: Pawn) => p.id === pawnToMove.id);
        
        pawnsOfPlayer[pawnIndex].position = newPosition;

        let captured = false;
        if (!SAFE_ZONES.includes(newPosition)) {
            (Object.keys(newPawns) as PlayerColor[]).forEach(color => {
                if (color !== currentTurn) {
                    let opponentPawnsAtPos = newPawns[color].filter((p: Pawn) => p.position === newPosition);
                    if (opponentPawnsAtPos.length === 1) {
                         newPawns[color] = newPawns[color].map((p: Pawn) => {
                            if (p.position === newPosition) {
                                captured = true;
                                addMessage("System", `${players[currentTurn].name} captured ${color}'s pawn!`, currentTurn);
                                return { ...p, position: -1 };
                            }
                            return p;
                        });
                    }
                }
            });
        }
        
        const currentPath = PATHS[currentTurn];
        if (newPosition === currentPath[currentPath.length - 1]) {
            pawnsOfPlayer[pawnIndex].isHome = true;
            addMessage("System", `${players[currentTurn].name}'s pawn reached home!`, currentTurn);
        }

        newPawns[currentTurn] = pawnsOfPlayer;

        const allHome = newPawns[currentTurn].every((p: Pawn) => p.isHome);
        if (allHome) {
            setWinner(currentTurn);
            setPhase('GAME_OVER');
        } else if (diceValue !== 6 && !captured && !pawnsOfPlayer[pawnIndex].isHome) {
            nextTurn();
        } else {
            setPhase('ROLLING');
            const turnPlayerName = players[currentTurn].name === 'Player' ? 'You get' : `${players[currentTurn].name} gets`;
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
      addMessage('AI', `${players[currentTurn].name} is thinking...`, currentTurn);
      
      setTimeout(() => {
        const aiRoll = Math.floor(Math.random() * 6) + 1;
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
    const positions: { [key: number]: Pawn[] } = {};

    (Object.keys(pawns) as PlayerColor[]).forEach(color => {
        pawns[color].forEach(pawn => {
            if (pawn.position !== -1) {
                if (!positions[pawn.position]) {
                    positions[pawn.position] = [];
                }
                positions[pawn.position].push(pawn);
            }
        });
    });

    (Object.keys(pawns) as PlayerColor[]).forEach(color => {
        pawns[color].forEach(pawn => {
            const isPlayerTurn = pawn.color === currentTurn;
            const canMove = possibleMovesForHighlight.some(move => move.pawn.id === pawn.id && move.pawn.color === pawn.color);
            const isStacked = pawn.position !== -1 && positions[pawn.position].filter(p => p.color === color).length > 1;
            allPawns.push({ ...pawn, highlight: isPlayerTurn && canMove, isStacked });
        });
    });

    return allPawns.map(pawn => (
        <PawnComponent key={`${pawn.color}-${pawn.id}`} {...pawn} onPawnClick={handlePawnMove} />
    ));
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
    return (Object.keys(players) as PlayerColor[]).map(color => {
        const player = players[color];
        let gridPosition;
        if(color === 'yellow') gridPosition = 'col-start-1 col-end-7 row-start-1 row-end-7';
        if(color === 'green') gridPosition = 'col-start-10 col-end-16 row-start-1 row-end-7';
        if(color === 'red') gridPosition = 'col-start-1 col-end-7 row-start-10 row-end-16';
        if(color === 'blue') gridPosition = 'col-start-10 col-end-16 row-start-10 row-end-16';

        return (
            <div key={color} className={cn('flex flex-col items-center justify-center text-white p-2', gridPosition)}>
                 <p className="font-bold text-white/80 text-sm drop-shadow-md">{player.name}</p>
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
     <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 gap-8 relative overflow-hidden">
        {winner && (
            <Dialog open={!!winner} onOpenChange={(open) => !open && window.location.reload()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Game Over!</DialogTitle>
                        <DialogDescription className="text-center">
                           {winner && <><span className={`font-semibold capitalize text-${winner}-500`}>{players[winner].name}</span> has won the game!</>}
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

        <div className="absolute top-8 left-8">
            <PlayerIcon color="yellow" isPlayer={false} />
        </div>
        <div className="absolute top-8 right-8">
            <PlayerIcon color="green" isPlayer={false} />
        </div>
         <div className="absolute bottom-8 left-8">
            <PlayerIcon color="red" isPlayer={true} />
        </div>
        <div className="absolute bottom-8 right-8">
            <PlayerIcon color="blue" isPlayer={false} />
        </div>


        <main className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center flex-1">
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
                        <p className="text-white mt-2 font-semibold">{players[currentTurn].name} is thinking...</p>
                        </motion.div>
                    )}
                    </AnimatePresence>
                    <GameBoard playersInfo={renderPlayersInfo()}>
                       {renderPawns()}
                    </GameBoard>
                </div>
            </div>
        </main>

         <footer className="w-full flex justify-center items-center pb-8">
            <GameControls
                currentTurn={currentTurn}
                phase={phase}
                diceValue={diceValue}
                onDiceRoll={handleDiceRoll}
                pawns={pawns}
            />
        </footer>
    </div>
  );
}
