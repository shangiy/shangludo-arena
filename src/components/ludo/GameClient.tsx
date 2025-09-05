'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

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
  HOME_YARDS,
  SAFE_ZONES,
  HOME_ENTRANCES,
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

export default function GameClient() {
  const searchParams = useSearchParams();
  const gameMode = searchParams.get('mode') || 'classic';
  const { toast } = useToast();

  const [pawns, setPawns] = useState<Record<PlayerColor, Pawn[]>>(initialPawns);
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('blue');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('ROLLING');
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setMessages([
      {
        sender: 'System',
        text: `Game started! Mode: ${gameMode}. Blue player's turn to roll.`,
      },
    ]);
  }, [gameMode]);

  const addMessage = (sender: string, text: string, color?: PlayerColor) => {
    setMessages((prev) => [...prev, { sender, text, color }]);
  };

  const nextTurn = () => {
    const playerOrder: PlayerColor[] = ['blue', 'red'];
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
        if (possibleMoves.length === 1) {
            // Automatically move if only one option
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
        
        if (currentPathIndex + roll < currentPath.length) {
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

        // Check for captures
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
        
        // Check if pawn reached home
        const currentPath = PATHS[currentTurn];
        if (newPosition === currentPath[currentPath.length - 1]) {
            pawnsOfPlayer[pawnIndex].isHome = true;
            addMessage("System", `${currentTurn}'s pawn reached home!`, currentTurn);
        }

        newPawns[currentTurn] = pawnsOfPlayer;

        // Check for win
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
    if (currentTurn === 'red' && phase === 'ROLLING' && !winner && isMounted) {
      setPhase('AI_THINKING');
      const aiRoll = Math.floor(Math.random() * 6) + 1;
      
      setTimeout(async () => {
        addMessage('AI', `The AI is thinking after rolling a ${aiRoll}...`, 'red');
        setDiceValue(aiRoll);

        const possibleMoves = getPossibleMoves('red', aiRoll);

        if (possibleMoves.length === 0) {
            addMessage('AI', `AI rolled a ${aiRoll} but has no moves.`, 'red');
            setTimeout(() => {
                if (aiRoll !== 6) nextTurn();
                else {
                    setPhase('ROLLING');
                    addMessage('System', `AI gets to roll again.`);
                }
            }, 1000);
            return;
        }

        const boardStateString = JSON.stringify(pawns);

        try {
          const aiResponse = await generateAIMove({
            boardState: boardStateString,
            currentPlayer: 'red',
            diceRoll: aiRoll,
          });

          addMessage('AI', `Reasoning: ${aiResponse.reasoning}`, 'red');

          // Extremely basic parsing - assumes "pawn:X" format
          const pawnIdMatch = aiResponse.move.match(/pawn:(\d+)/);
          let chosenPawn: Pawn | undefined;

          if (pawnIdMatch) {
            const pawnId = parseInt(pawnIdMatch[1], 10);
            chosenPawn = possibleMoves.find(m => m.pawn.id === pawnId)?.pawn;
          }

          if (!chosenPawn) {
            addMessage('AI', 'AI made an invalid move choice, picking first valid move instead.', 'red');
            chosenPawn = possibleMoves[0].pawn;
          }

          setTimeout(() => {
            handlePawnMove(chosenPawn!);
          }, 1000);

        } catch (error) {
          console.error("AI Error:", error);
          addMessage('System', 'AI failed to make a move. Picking first available move.', 'red');
          const fallbackPawn = possibleMoves[0].pawn;
          setTimeout(() => {
            handlePawnMove(fallbackPawn);
          }, 500);
        }
      }, 1500);
    }
  }, [currentTurn, phase, winner, isMounted]);

  const possibleMovesForHighlight = useMemo(() => {
    if (phase === 'MOVING' && diceValue) {
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

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Preparing the Arena...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
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

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 relative">
            <AnimatePresence>
              {phase === 'AI_THINKING' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 rounded-lg"
                >
                  <Loader2 className="h-16 w-16 animate-spin text-white" />
                  <p className="mt-4 text-white text-xl font-semibold">AI is Thinking...</p>
                </motion.div>
              )}
            </AnimatePresence>
            <GameBoard>
              {renderPawns()}
            </GameBoard>
          </div>

          <div className="lg:col-span-1 mt-8 lg:mt-0 flex flex-col gap-8">
            <GameControls
              currentTurn={currentTurn}
              phase={phase}
              diceValue={diceValue}
              onDiceRoll={handleDiceRoll}
              pawns={pawns}
            />
            <ChatPanel messages={messages} onSendMessage={(text) => addMessage('You', text, 'blue')} />
          </div>
        </div>
      </main>
    </div>
  );
}
