'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  GameBoard,
  Pawn as PawnComponent,
} from '@/components/ludo/GameBoard';
import { GameControls } from '@/components/ludo/GameControls';
import { FiveMinGameLayout } from '@/components/ludo/FiveMinGameLayout';
import {
  PLAYER_COLORS,
  PATHS,
  START_POSITIONS,
  SAFE_ZONES as PRIMARY_SAFE_ZONES,
  PlayerColor,
  Pawn,
  ChatMessage,
  HOME_ENTRANCES,
  SECONDARY_RED_SAFE_ZONE,
  SECONDARY_GREEN_SAFE_ZONE,
  SECONDARY_BLUE_SAFE_ZONE,
  SECONDARY_YELLOW_SAFE_ZONE,
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
import { GameSetup, GameSetupForm } from './GameSetupForm';

type GamePhase = 'SETUP' | 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';

const LUDO_GAME_STATE_KEY = 'shangludo-arena-game-state';
const TURN_TIMER_DURATION = 20000; // 20 seconds for 5-min mode

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

const quickPlaySetup: GameSetup = {
  gameMode: 'vs-computer',
  players: [
    { color: 'red', name: 'You', type: 'human' },
    { color: 'green', name: 'Green AI', type: 'ai' },
    { color: 'yellow', name: 'Yellow AI', type: 'ai' },
    { color: 'blue', name: 'Blue AI', type: 'ai' },
  ],
  turnOrder: ['red', 'green', 'yellow', 'blue'],
  humanPlayerColor: 'red',
  diceRollDuration: '1000',
};

const fiveMinSetup: GameSetup = {
    gameMode: 'vs-computer',
    players: [
      { color: 'red', name: 'Red', type: 'human' },
      { color: 'green', name: 'Green', type: 'ai' },
      { color: 'yellow', name: 'Yellow', type: 'ai' },
      { color: 'blue', name: 'Blue', type: 'ai' },
    ],
    turnOrder: ['red', 'green', 'yellow', 'blue'],
    humanPlayerColor: 'red',
    diceRollDuration: '1000',
  };

export default function GameClient() {
  const searchParams = useSearchParams();
  const gameMode = searchParams.get('mode') || 'classic';
  const { toast } = useToast();

  const [pawns, setPawns] = useState<Record<PlayerColor, Pawn[]>>(initialPawns);
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [addSecondarySafePoints, setAddSecondarySafePoints] = useState(true);
  const [gameSetup, setGameSetup] = useState<GameSetup | null>(null);
  const [showNotifications, setShowNotifications] = useState(true);
  const [muteSound, setMuteSound] = useState(false);
  const [diceRollDuration, setDiceRollDuration] = useState(1000);
  const [turnTimer, setTurnTimer] = useState<number>(TURN_TIMER_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const diceRollAudioRef = useRef<HTMLAudioElement>(null);

  const SAFE_ZONES = useMemo(() => {
    if (addSecondarySafePoints) {
      return [
        ...PRIMARY_SAFE_ZONES,
        SECONDARY_RED_SAFE_ZONE,
        SECONDARY_GREEN_SAFE_ZONE,
        SECONDARY_BLUE_SAFE_ZONE,
        SECONDARY_YELLOW_SAFE_ZONE,
      ];
    }
    return PRIMARY_SAFE_ZONES;
  }, [addSecondarySafePoints]);

  const players = useMemo(() => {
    if (!gameSetup) {
      return {
        blue: { name: 'Computer', color: 'blue', type: 'ai' },
        yellow: { name: 'Computer', color: 'yellow', type: 'ai' },
        red: { name: 'Player', color: 'red', type: 'human' },
        green: { name: 'Computer', color: 'green', type: 'ai' },
      };
    }
    const playerConfig: any = {};
    gameSetup.players.forEach((p) => {
      playerConfig[p.color] = { name: p.name, color: p.color, type: p.type };
    });
    return playerConfig;
  }, [gameSetup]);

  const playerOrder: PlayerColor[] = useMemo(
    () => gameSetup?.turnOrder || ['red', 'green', 'yellow', 'blue'],
    [gameSetup]
  );

  const nextPlayerColor = useMemo(() => {
    const currentIndex = playerOrder.indexOf(currentTurn);
    return playerOrder[(currentIndex + 1) % playerOrder.length];
  }, [currentTurn, playerOrder]);

  // Load state from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedStateJSON = localStorage.getItem(LUDO_GAME_STATE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState && savedState.phase !== 'SETUP' && savedState.phase !== 'GAME_OVER') {
          setPawns(savedState.pawns);
          setCurrentTurn(savedState.currentTurn);
          setDiceValue(savedState.diceValue);
          setPhase(savedState.phase);
          setWinner(savedState.winner);
          setGameSetup(savedState.gameSetup);
          setAddSecondarySafePoints(savedState.addSecondarySafePoints);
          setShowNotifications(savedState.showNotifications);
          setMuteSound(savedState.muteSound);
          setDiceRollDuration(savedState.diceRollDuration);
          toast({ title: "Game Resumed", description: "Your previous game has been restored." });
          return;
        }
      }
    } catch (error) {
      console.error("Could not load game state from localStorage", error);
      localStorage.removeItem(LUDO_GAME_STATE_KEY);
    }

    if (gameMode === 'quick') {
      handleGameSetup(quickPlaySetup);
    } else if (gameMode === '5-min') {
      handleGameSetup(fiveMinSetup);
    }
  }, [gameMode]);
  
  // Save state to localStorage on change
  useEffect(() => {
    if (!isMounted) return;
    try {
      const gameState = {
        pawns,
        currentTurn,
        diceValue,
        phase,
        winner,
        gameSetup,
        addSecondarySafePoints,
        showNotifications,
        muteSound,
        diceRollDuration,
      };
      if (phase !== 'SETUP' && phase !== 'GAME_OVER') {
        localStorage.setItem(LUDO_GAME_STATE_KEY, JSON.stringify(gameState));
      } else {
        localStorage.removeItem(LUDO_GAME_STATE_KEY);
      }
    } catch (error) {
      console.error("Could not save game state to localStorage", error);
    }
  }, [
      pawns, currentTurn, diceValue, phase, winner, gameSetup, 
      addSecondarySafePoints, showNotifications, muteSound, diceRollDuration, isMounted
  ]);


  const addMessage = (sender: string, text: string, color?: PlayerColor) => {
    // For this design, we don't show messages in the UI.
    console.log(`Message: [${sender}] ${text}`);
  };

  const handleGameSetup = (setup: GameSetup) => {
    localStorage.removeItem(LUDO_GAME_STATE_KEY);
    setGameSetup(setup);
    setDiceRollDuration(Number(setup.diceRollDuration));
    setCurrentTurn(setup.turnOrder[0]);
    setPawns(initialPawns());
    setWinner(null);
    setDiceValue(null);
    setPhase('ROLLING');
  };

  useEffect(() => {
    if (winner) {
      addMessage('System', `${players[winner]?.name} has won the game!`);
      localStorage.removeItem(LUDO_GAME_STATE_KEY);
      if (showNotifications) {
        toast({
          title: 'Game Over!',
          description: `${players[winner]?.name} has won the game!`,
          duration: 5000,
        });
      }
    }
  }, [winner, players, showNotifications, toast]);

  const nextTurn = () => {
    setCurrentTurn(nextPlayerColor);
    setPhase('ROLLING');
    setDiceValue(null);
    setTurnTimer(TURN_TIMER_DURATION);
  };

  useEffect(() => {
      if (gameMode !== '5-min' || phase !== 'ROLLING' || winner) {
          if (timerRef.current) clearInterval(timerRef.current);
          return;
      }

      setTurnTimer(TURN_TIMER_DURATION); // Reset timer for the new turn
      
      timerRef.current = setInterval(() => {
          setTurnTimer(prev => {
              if (prev <= 1000) {
                  clearInterval(timerRef.current!);
                  addMessage("System", `${players[currentTurn].name} ran out of time!`);
                  if (showNotifications) {
                      toast({
                          variant: 'destructive',
                          title: 'Time\'s Up!',
                          description: `${players[currentTurn].name}'s turn was skipped.`,
                      });
                  }
                  nextTurn();
                  return 0;
              }
              return prev - 1000;
          });
      }, 1000);

      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      };

  }, [currentTurn, phase, winner, gameMode]);

  const getPossibleMoves = (player: PlayerColor, roll: number) => {
    const playerPawns = pawns[player];
    const moves: { pawn: Pawn; newPosition: number }[] = [];

    // Move from yard
    if (roll === 6) {
      const pawnsInYard = playerPawns.filter((p) => p.position === -1);
      if (pawnsInYard.length > 0) {
        const startPos = START_POSITIONS[player];
        const ownPawnsAtStart = playerPawns.filter(
          (p) => p.position === startPos
        ).length;
        if (!SAFE_ZONES.includes(startPos) && ownPawnsAtStart >= 2) {
          // Cannot move to start if it's not a safe zone and is blockaded
        } else {
          pawnsInYard.forEach((pawn) =>
            moves.push({ pawn, newPosition: startPos })
          );
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

        const ownPawnsAtDestination = playerPawns.filter(
          (p) => p.position === newPosition
        ).length;

        if (
          !SAFE_ZONES.includes(newPosition) &&
          ownPawnsAtDestination >= 2
        ) {
          // Can't move to a space occupied by 2 of your own pawns unless it's a safe zone
        } else {
          moves.push({ pawn, newPosition });
        }
      }
    });
    return moves;
  };

  const handleDiceRollEnd = (value: number) => {
    if (!muteSound && diceRollAudioRef.current) {
      diceRollAudioRef.current.play();
    }
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
      if (players[currentTurn].type === 'human') {
        if (possibleMoves.length === 1) {
          setTimeout(() => handlePawnMove(possibleMoves[0].pawn), 1000);
        }
      }
    }
  };

  const startRoll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('MOVING');
  };

  const handleAiMove = async (roll: number, possibleMoves: any[]) => {
    if (roll === 6) {
      const moveOutOfYard = possibleMoves.find((m) => m.pawn.position === -1);
      if (moveOutOfYard) {
        performMove(moveOutOfYard.pawn, moveOutOfYard.newPosition);
        return;
      }
    }

    if (possibleMoves.length > 0) {
      // Basic AI: just take the first possible move
      performMove(possibleMoves[0].pawn, possibleMoves[0].newPosition);
    }
  };

  const handlePawnMove = (pawnToMove: Pawn) => {
    if (!diceValue || pawnToMove.color !== currentTurn || phase !== 'MOVING') {
      return;
    }

    if (pawnToMove.position === -1 && diceValue === 6) {
      const startPos = START_POSITIONS[currentTurn];
      performMove(pawnToMove, startPos);
      return;
    }

    const possibleMoves = getPossibleMoves(currentTurn, diceValue);
    const selectedMove = possibleMoves.find(
      (m) => m.pawn.id === pawnToMove.id && m.pawn.color === pawnToMove.color
    );

    if (!selectedMove) {
      if (players[currentTurn].type === 'human' && showNotifications) {
        toast({
          variant: 'destructive',
          title: 'Invalid Move',
          description: 'This pawn cannot make that move.',
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

    setPawns((prev) => {
      const newPawns = JSON.parse(JSON.stringify(prev));
      const pawnsOfPlayer = newPawns[currentTurn];
      const pawnIndex = pawnsOfPlayer.findIndex(
        (p: Pawn) => p.id === pawnToMove.id
      );

      pawnsOfPlayer[pawnIndex].position = newPosition;

      if (!SAFE_ZONES.includes(newPosition)) {
        (Object.keys(newPawns) as PlayerColor[]).forEach((color) => {
          if (color !== currentTurn) {
            let opponentPawnsAtPos = newPawns[color].filter(
              (p: Pawn) => p.position === newPosition
            );
            if (
              opponentPawnsAtPos.length === 1 &&
              !START_POSITIONS[color as PlayerColor]
            ) {
              addMessage(
                'System',
                `${players[currentTurn].name} captured a pawn from ${players[color].name}!`
              );
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

      const currentPath = PATHS[currentTurn];
      if (currentPath.indexOf(newPosition) >= 51) {
        pawnsOfPlayer[pawnIndex].isHome = true;
        addMessage('System', `${players[currentTurn].name} moved a pawn home!`);
        pawnReachedHome = true;
      }

      newPawns[currentTurn] = pawnsOfPlayer;

      const allHome = newPawns[currentTurn].every((p: Pawn) => p.isHome);
      if (allHome) {
        setWinner(currentTurn);
      }

      return newPawns;
    });

    const getsAnotherTurn = rolledSix || capturedPawn || pawnReachedHome;

    if (getsAnotherTurn && !winner) {
      addMessage('System', `${players[currentTurn].name} gets another turn.`);
      setPhase('ROLLING');
      setDiceValue(null);
    } else if (!winner) {
      nextTurn();
    } else {
      setPhase('GAME_OVER');
    }
  };

  useEffect(() => {
    const isAiTurn =
      playerOrder.includes(currentTurn) && players[currentTurn]?.type === 'ai';
    if (isAiTurn && phase === 'ROLLING' && !winner && isMounted) {
      setTimeout(() => {
        // AI starts "rolling"
        startRoll(); 
      }, 1000); // A small delay to make it feel like the AI is thinking
    }
  }, [currentTurn, phase, winner, isMounted, players, playerOrder]);


  useEffect(() => {
    const isAiTurn =
      playerOrder.includes(currentTurn) && players[currentTurn]?.type === 'ai';
    if (isAiTurn && phase === 'MOVING' && diceValue && isMounted) {
        // AI has rolled and now needs to decide on a move
        const possibleMoves = getPossibleMoves(currentTurn, diceValue);
        if (possibleMoves.length > 0) {
            // A delay to make it seem like AI is deciding
            setTimeout(() => {
              handleAiMove(diceValue, possibleMoves);
            }, 1000); 
        }
        // If no possible moves, the handleDiceRollEnd function already handles it.
    }
  }, [phase, diceValue, currentTurn, isMounted]);

  const possibleMovesForHighlight = useMemo(() => {
    if (phase === 'MOVING' && diceValue && players[currentTurn]?.type === 'human') {
      return getPossibleMoves(currentTurn, diceValue);
    }
    return [];
  }, [phase, diceValue, currentTurn, pawns, players]);

  const renderPawns = () => {
    const allPawns: (Pawn & { highlight: boolean; isStacked: boolean })[] = [];
    const positions: { [key: number]: Pawn[] } = {};

    (Object.keys(pawns) as PlayerColor[]).forEach((color) => {
      pawns[color].forEach((pawn) => {
        if (pawn.position !== -1 && !pawn.isHome) {
          if (!positions[pawn.position]) {
            positions[pawn.position] = [];
          }
          positions[pawn.position].push(pawn);
        }
      });
    });

    (Object.keys(pawns) as PlayerColor[]).forEach((color) => {
      pawns[color].forEach((pawn) => {
        const isPlayerTurn =
          pawn.color === currentTurn &&
          phase === 'MOVING' &&
          players[currentTurn]?.type === 'human';
        let highlight = false;

        if (isPlayerTurn) {
          if (pawn.position === -1) {
            if (
              diceValue === 6 &&
              possibleMovesForHighlight.some((move) => move.pawn.id === pawn.id)
            ) {
              highlight = true;
            }
          } else {
            const canMove = possibleMovesForHighlight.some(
              (move) =>
                move.pawn.id === pawn.id && move.pawn.color === pawn.color
            );
            if (canMove) {
              highlight = true;
            }
          }
        }

        const isStacked =
          pawn.position !== -1 &&
          positions[pawn.position] &&
          positions[pawn.position].length > 1;
        allPawns.push({ ...pawn, highlight, isStacked });
      });
    });

    return allPawns.map((pawn) => (
      <PawnComponent
        key={`${pawn.color}-${pawn.id}`}
        {...pawn}
        onPawnClick={handlePawnMove}
      />
    ));
  };

  const handlePlayerNameChange = (color: PlayerColor, newName: string) => {
    if (!gameSetup) return;

    setGameSetup((prev) => {
      if (!prev) return null;
      const newPlayers = prev.players.map((p) =>
        p.color === color ? { ...p, name: newName } : p
      );
      return { ...prev, players: newPlayers };
    });
  };

  const handleResetAndGoHome = () => {
    localStorage.removeItem(LUDO_GAME_STATE_KEY);
    // This will effectively reload the page state, but without a full refresh if navigation is client-side
    window.location.href = '/'; 
  };
  
  if (!isMounted) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Preparing the Arena...</p>
      </div>
    );
  }

  if (phase === 'SETUP' && gameMode !== 'quick' && gameMode !== '5-min') {
      return (
          <div className="min-h-screen bg-gray-100 text-foreground flex flex-col items-center justify-center p-4">
               <Suspense fallback={<div>Loading...</div>}>
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                      <GameSetupForm onSetupComplete={handleGameSetup} />
                  </div>
               </Suspense>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-foreground flex flex-col items-center justify-center p-4 gap-4 relative">
       <Dialog
        open={!!winner}
        onOpenChange={(open) => {
            if (!open) {
              localStorage.removeItem(LUDO_GAME_STATE_KEY);
              window.location.reload();
            }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Game Over!
            </DialogTitle>
            {winner && (
              <DialogDescription className="text-center">
                <span className={`font-semibold capitalize text-${winner}-500`}>
                  {players[winner].name}
                </span>{' '}
                has won the game!
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            <Logo className="h-24 w-24" />
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => {
              localStorage.removeItem(LUDO_GAME_STATE_KEY);
              window.location.reload();
            }}>Play Again</Button>
            <Button variant="secondary" asChild>
              <Link href="/" onClick={() => localStorage.removeItem(LUDO_GAME_STATE_KEY)}>Back to Lobby</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <audio ref={diceRollAudioRef} src="/sounds/dice-Music.mp3" preload="auto" />

      {gameMode === '5-min' ? (
        gameSetup && (
            <FiveMinGameLayout
              gameSetup={gameSetup}
              currentTurn={currentTurn}
              turnTimer={turnTimer}
              turnTimerDuration={TURN_TIMER_DURATION}
              isRolling={phase === 'MOVING'}
              diceRollDuration={diceRollDuration}
              onRollStart={startRoll}
              onDiceRoll={handleDiceRollEnd}
              diceValue={diceValue}
              onResetAndGoHome={handleResetAndGoHome}
            >
                <GameBoard showSecondarySafes={addSecondarySafePoints}>
                    {renderPawns()}
                </GameBoard>
            </FiveMinGameLayout>
        )
      ) : (
        <>
            <header className="w-full flex justify-center items-center py-4">
                <GameControls
                  currentTurn={currentTurn}
                  phase={phase}
                  diceValue={diceValue}
                  addSecondarySafePoints={addSecondarySafePoints}
                  onToggleSecondarySafePoints={() =>
                    setAddSecondarySafePoints((prev) => !prev)
                  }
                  isHumanTurn={players[currentTurn]?.type === 'human'}
                  showNotifications={showNotifications}
                  onToggleShowNotifications={() =>
                    setShowNotifications((prev) => !prev)
                  }
                  muteSound={muteSound}
                  onToggleMuteSound={() => setMuteSound((prev) => !prev)}
                  diceRollDuration={diceRollDuration}
                  onDiceRollDurationChange={setDiceRollDuration}
                  gameMode={gameMode}
                  gameSetup={gameSetup}
                  onPlayerNameChange={handlePlayerNameChange}
                  nextPlayerColor={nextPlayerColor}
                  onRollStart={startRoll}

                  onDiceRoll={handleDiceRollEnd}
                  onResetAndGoHome={handleResetAndGoHome}
                />
            </header>
            <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center flex-1 gap-8">
                <div className="w-full max-w-2xl relative">
                  <GameBoard showSecondarySafes={addSecondarySafePoints}>
                    {renderPawns()}
                  </GameBoard>
                </div>
            </main>
        </>
      )}
    </div>
  );
}
