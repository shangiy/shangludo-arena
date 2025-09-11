'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { generateAIMove } from '@/ai/flows/ai-opponent';
import { GameBoard, Pawn as PawnComponent } from '@/components/ludo/GameBoard';
import { GameControls } from '@/components/ludo/GameControls';
import {
  PLAYER_COLORS,
  PATHS,
  START_POSITIONS,
  SAFE_ZONES,
  PlayerColor,
  Pawn,
  ChatMessage,
  HOME_ENTRANCES,
  SECONDARY_YELLOW_SAFE_ZONE,
  SECONDARY_RED_SAFE_ZONE,
  SECONDARY_BLUE_SAFE_ZONE,
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
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('ROLLING');
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [secondaryYellowHome, setSecondaryYellowHome] = useState(false);
  const [secondaryRedHome, setSecondaryRedHome] = useState(false);
  const [secondaryBlueHome, setSecondaryBlueHome] = useState(false);

  const players: Record<PlayerColor, { name: string, color: PlayerColor }> = {
    blue: { name: 'Computer', color: 'blue' },
    yellow: { name: 'Computer', color: 'yellow' },
    red: { name: 'Player', color: 'red' },
    green: { name: 'Computer', color: 'green' },
  };
  const playerOrder: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];


  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const addMessage = (sender: string, text: string, color?: PlayerColor) => {
    // For this design, we don't show messages in the UI.
    console.log(`Message: [${sender}] ${text}`);
  };

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
  };

  const getPossibleMoves = (player: PlayerColor, roll: number) => {
    const playerPawns = pawns[player];
    const moves: { pawn: Pawn; newPosition: number }[] = [];
  
    // Move from yard
    if (roll === 6) {
      const pawnsInYard = playerPawns.filter(p => p.position === -1);
      if (pawnsInYard.length > 0) {
        const startPos = START_POSITIONS[player];
        const ownPawnsAtStart = playerPawns.filter(p => p.position === startPos).length;
        if (ownPawnsAtStart < 2) {
           pawnsInYard.forEach(pawn => moves.push({ pawn, newPosition: startPos }));
        }
      }
    }

    // Move on board
    playerPawns.forEach((pawn) => {
      if (pawn.isHome || pawn.position === -1) return;

      const currentPath = PATHS[player];
      const currentPathIndex = currentPath.indexOf(pawn.position);
      
      if (currentPathIndex !== -1 && currentPathIndex + roll < currentPath.length) {
        const newPosition = currentPath[currentPathIndex + roll];
        
        // Blockade check can be simplified for this version, but this is more robust
        const ownPawnsAtDestination = playerPawns.filter(p => p.position === newPosition).length;

        if (ownPawnsAtDestination < 2) {
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
      addMessage('System', `${players[currentTurn].name} has no possible moves.`);
      setTimeout(() => {
        if (value !== 6) {
          nextTurn();
        } else {
          setPhase('ROLLING'); // Roll again
          setDiceValue(null);
          addMessage('System', `${players[currentTurn].name} gets to roll again.`);
        }
      }, 1000);
    } else {
        setPhase('MOVING');
        if (players[currentTurn].name !== 'Player') {
            setTimeout(() => handleAiMove(value, possibleMoves), 500);
        } else {
            // If only one move, auto-move
            if (possibleMoves.length === 1) {
                setTimeout(() => handlePawnMove(possibleMoves[0].pawn), 1000);
            }
        }
    }
  };

  const handleAiMove = async (roll: number, possibleMoves: any[]) => {
      // Priority: Move pawn out of yard on a 6
      if (roll === 6) {
          const moveOutOfYard = possibleMoves.find(m => m.pawn.position === -1);
          if (moveOutOfYard) {
              performMove(moveOutOfYard.pawn, moveOutOfYard.newPosition);
              return;
          }
      }
      
      // Basic AI: just take the first possible move
      if (possibleMoves.length > 0) {
        performMove(possibleMoves[0].pawn, possibleMoves[0].newPosition);
      }
  }
  
  
  const handlePawnMove = (pawnToMove: Pawn) => {
    if (!diceValue || pawnToMove.color !== currentTurn || phase !== 'MOVING') {
      return;
    }
  
    // Special case for moving out of the yard
    if (pawnToMove.position === -1 && diceValue === 6) {
      const startPos = START_POSITIONS[currentTurn];
      performMove(pawnToMove, startPos);
      return;
    }
  
    const possibleMoves = getPossibleMoves(currentTurn, diceValue);
    const selectedMove = possibleMoves.find(m => m.pawn.id === pawnToMove.id && m.pawn.color === pawnToMove.color);
    
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
  
    performMove(pawnToMove, selectedMove.newPosition);
  };
  
  const performMove = (pawnToMove: Pawn, newPosition: number) => {
    if (!diceValue) return;
  
    const rolledSix = diceValue === 6;
    let capturedPawn = false;
    let pawnReachedHome = false;
  
    setPawns(prev => {
      const newPawns = JSON.parse(JSON.stringify(prev));
      const pawnsOfPlayer = newPawns[currentTurn];
      const pawnIndex = pawnsOfPlayer.findIndex((p: Pawn) => p.id === pawnToMove.id);
  
      pawnsOfPlayer[pawnIndex].position = newPosition;
      
      const currentSafeZones = [...SAFE_ZONES];
      if (secondaryYellowHome) {
        currentSafeZones.push(SECONDARY_YELLOW_SAFE_ZONE);
      }
      if (secondaryRedHome) {
        currentSafeZones.push(SECONDARY_RED_SAFE_ZONE);
      }
      if (secondaryBlueHome) {
        currentSafeZones.push(SECONDARY_BLUE_SAFE_ZONE);
      }

      // Capture logic
      if (!currentSafeZones.includes(newPosition)) {
        (Object.keys(newPawns) as PlayerColor[]).forEach(color => {
          if (color !== currentTurn) {
            let opponentPawnsAtPos = newPawns[color].filter((p: Pawn) => p.position === newPosition);
            if (opponentPawnsAtPos.length === 1 && newPosition !== START_POSITIONS[color]) {
              addMessage('System', `${players[currentTurn].name} captured a pawn from ${players[color].name}!`);
              newPawns[color] = newPawns[color].map((p: Pawn) => {
                if (p.position === newPosition) {
                  capturedPawn = true;
                  return { ...p, position: -1 };
                }
                return p;
              });
            }
          }
        });
      }
  
      // Home logic
      const currentPath = PATHS[currentTurn];
      if (currentPath.indexOf(newPosition) >= 51) { // 51 is the length of the main path
         pawnsOfPlayer[pawnIndex].isHome = true;
         addMessage('System', `${players[currentTurn].name} moved a pawn home!`);
         pawnReachedHome = true;
      }
  
      newPawns[currentTurn] = pawnsOfPlayer;
  
      // Win condition
      const allHome = newPawns[currentTurn].every((p: Pawn) => p.isHome);
      if (allHome) {
        setWinner(currentTurn);
      }
  
      return newPawns;
    });

    setDiceValue(null);

    const getsAnotherTurn = rolledSix || capturedPawn || pawnReachedHome;
    
    if (getsAnotherTurn && !winner) {
      addMessage('System', `${players[currentTurn].name} gets another turn.`);
      setPhase('ROLLING');
    } else if (!winner) {
      nextTurn();
    } else {
      setPhase('GAME_OVER');
    }
  };
  
  // AI Logic
  useEffect(() => {
    const isAiTurn = playerOrder.includes(currentTurn) && players[currentTurn].name !== 'Player';
    if (isAiTurn && phase === 'ROLLING' && !winner && isMounted) {
      setPhase('AI_THINKING');
      
      setTimeout(() => {
        const aiRoll = Math.floor(Math.random() * 6) + 1;
        handleDiceRoll(aiRoll);
      }, 1000);
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
            if (pawn.position !== -1 && !pawn.isHome) {
                if (!positions[pawn.position]) {
                    positions[pawn.position] = [];
                }
                positions[pawn.position].push(pawn);
            }
        });
    });

    (Object.keys(pawns) as PlayerColor[]).forEach(color => {
      pawns[color].forEach(pawn => {
        const isPlayerTurn = pawn.color === currentTurn && phase === 'MOVING';
        let highlight = false;

        if (isPlayerTurn) {
          if (pawn.position === -1) {
            if (diceValue === 6 && possibleMovesForHighlight.some(move => move.pawn.id === pawn.id)) {
              highlight = true;
            }
          } else {
            const canMove = possibleMovesForHighlight.some(move => move.pawn.id === pawn.id && move.pawn.color === pawn.color);
            if (canMove) {
                highlight = true;
            }
          }
        }

        const isStacked = pawn.position !== -1 && positions[pawn.position] && positions[pawn.position].length > 1;
        allPawns.push({ ...pawn, highlight, isStacked });
      });
    });


    return allPawns.map(pawn => (
        <PawnComponent key={`${pawn.color}-${pawn.id}`} {...pawn} onPawnClick={handlePawnMove} />
    ));
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
     <div className="min-h-screen bg-gray-100 text-foreground flex flex-col items-center justify-center p-4 gap-4 relative">
        
        <Dialog open={!!winner} onOpenChange={(open) => !open && window.location.reload()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Game Over!</DialogTitle>
                     {winner && (
                        <DialogDescription className="text-center">
                            <span className={`font-semibold capitalize text-${winner}`}>{players[winner].name}</span> has won the game!
                        </DialogDescription>
                    )}
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

        <header className="w-full flex justify-center items-center py-4">
             <GameControls
                currentTurn={currentTurn}
                phase={phase}
                diceValue={diceValue}
                onDiceRoll={handleDiceRoll}
                secondaryYellowHome={secondaryYellowHome}
                onSecondaryYellowHomeChange={setSecondaryYellowHome}
                secondaryRedHome={secondaryRedHome}
                onSecondaryRedHomeChange={setSecondaryRedHome}
                secondaryBlueHome={secondaryBlueHome}
                onSecondaryBlueHomeChange={setSecondaryBlueHome}
            />
        </header>

        <main className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center flex-1">
            <div className="w-full max-w-2xl relative">
                <GameBoard 
                    showSecondaryYellowHome={secondaryYellowHome} 
                    showSecondaryRedHome={secondaryRedHome}
                    showSecondaryBlueHome={secondaryBlueHome}
                >
                   {renderPawns()}
                </GameBoard>
            </div>
        </main>
    </div>
  );
}
