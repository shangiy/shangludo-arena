
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
const DEFAULT_TURN_TIMER_DURATION = 15000;
const DEFAULT_FIVE_MIN_GAME_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_DICE_ROLL_DURATION = 3000; // 3 seconds

const initialPawns = (gameMode = 'classic'): Record<PlayerColor, Pawn[]> => {
  const pawns: any = {};
  (Object.keys(PLAYER_COLORS) as PlayerColor[]).forEach((color) => {
    pawns[color] = Array(4)
      .fill(0)
      .map((_, i) => ({
        id: i,
        color,
        position: gameMode === '5-min' ? START_POSITIONS[color] : -1, // -1 is in the yard
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
  diceRollDuration: '3000',
};

const fiveMinSetup: GameSetup = {
    gameMode: 'vs-computer',
    players: [
      { color: 'red', name: 'Red', type: 'human' },
      { color: 'green', name: 'Green', type: 'human' },
      { color: 'yellow', name: 'Yellow AI', type: 'ai' },
      { color: 'blue', name: 'Blue', type: 'human' },
    ],
    turnOrder: ['red', 'green', 'yellow', 'blue'],
    humanPlayerColor: 'red',
    diceRollDuration: '3000',
  };

export default function GameClient() {
  const searchParams = useSearchParams();
  const gameMode = searchParams.get('mode') || 'classic';
  const { toast } = useToast();

  const [pawns, setPawns] = useState<Record<PlayerColor, Pawn[]>>(() => initialPawns(gameMode));
  const [scores, setScores] = useState<Record<PlayerColor, number>>({ red: 0, green: 0, yellow: 0, blue: 0 });
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [addSecondarySafePoints, setAddSecondarySafePoints] = useState(true);
  const [gameSetup, setGameSetup] = useState<GameSetup | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [muteSound, setMuteSound] = useState(true);
  const [diceRollDuration, setDiceRollDuration] = useState(DEFAULT_DICE_ROLL_DURATION);
  const [turnTimer, setTurnTimer] = useState<number>(DEFAULT_TURN_TIMER_DURATION);
  const [turnTimerDuration, setTurnTimerDuration] = useState<number>(DEFAULT_TURN_TIMER_DURATION);
  const [gameTimer, setGameTimer] = useState<number>(DEFAULT_FIVE_MIN_GAME_DURATION);
  const [gameTimerDuration, setGameTimerDuration] = useState(DEFAULT_FIVE_MIN_GAME_DURATION);
  const [showResumeToast, setShowResumeToast] = useState(false);
  
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    let resumed = false;
    try {
      const savedStateJSON = localStorage.getItem(LUDO_GAME_STATE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState && savedState.phase !== 'SETUP' && savedState.phase !== 'GAME_OVER' && savedState.gameSetup?.gameMode === gameMode) {
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
          if (gameMode === '5-min') {
             if(savedState.gameTimer !== undefined) setGameTimer(savedState.gameTimer);
             if(savedState.gameTimerDuration !== undefined) setGameTimerDuration(savedState.gameTimerDuration);
             if(savedState.turnTimerDuration !== undefined) setTurnTimerDuration(savedState.turnTimerDuration);
             if(savedState.scores !== undefined) setScores(savedState.scores);
          }
          resumed = true;
          setShowResumeToast(true);
        }
      }
    } catch (error) {
      console.error("Could not load game state from localStorage", error);
      localStorage.removeItem(LUDO_GAME_STATE_KEY);
    }

    if (!resumed) {
      if (gameMode === 'quick') {
        handleGameSetup(quickPlaySetup);
      } else if (gameMode === '5-min') {
        handleGameSetup(fiveMinSetup);
      }
    }
  }, [gameMode]);
  
  useEffect(() => {
    if (isMounted && showResumeToast) {
        toast({ title: "Game Resumed", description: "Your previous game has been restored." });
        setShowResumeToast(false);
    }
}, [isMounted, showResumeToast, toast]);
  
  // Save state to localStorage on change
  useEffect(() => {
    if (!isMounted || phase === 'SETUP' || phase === 'GAME_OVER') return;
    try {
      const gameState: any = {
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
      if (gameMode === '5-min') {
        gameState.gameTimer = gameTimer;
        gameState.gameTimerDuration = gameTimerDuration;
        gameState.turnTimerDuration = turnTimerDuration;
        gameState.scores = scores;
      }
      localStorage.setItem(LUDO_GAME_STATE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.error("Could not save game state to localStorage", error);
    }
  }, [
      pawns, currentTurn, diceValue, phase, winner, gameSetup, 
      addSecondarySafePoints, showNotifications, muteSound, diceRollDuration, 
      isMounted, gameTimer, gameTimerDuration, turnTimerDuration, scores, gameMode
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
    setPawns(initialPawns(setup.gameMode));
    setScores({ red: 0, green: 0, yellow: 0, blue: 0 });
    setWinner(null);
    setDiceValue(null);
    setPhase('ROLLING');
    if (gameMode === '5-min') {
      setGameTimer(gameTimerDuration);
    }
  };

  useEffect(() => {
    if (winner && showNotifications) {
      let description = `${players[winner]?.name} has won the game!`;
      if (gameMode === '5-min') {
          description = `${players[winner].name} wins with the highest score: ${scores[winner]}!`
      }
      addMessage('System', description);
      toast({
        title: 'Game Over!',
        description,
        duration: 5000,
      });
      localStorage.removeItem(LUDO_GAME_STATE_KEY);
    }
  }, [winner, players, showNotifications, toast, scores, gameMode]);

  const nextTurn = () => {
    setPhase('ROLLING');
    setCurrentTurn(nextPlayerColor);
    setDiceValue(null);
    setTurnTimer(turnTimerDuration);
  };

  useEffect(() => {
      if (gameMode !== '5-min' || phase !== 'ROLLING' || winner) {
          if (turnTimerRef.current) clearInterval(turnTimerRef.current);
          return;
      }

      setTurnTimer(turnTimerDuration); // Reset timer for the new turn
      
      turnTimerRef.current = setInterval(() => {
          setTurnTimer(prev => {
              if (prev <= 1000) {
                  clearInterval(turnTimerRef.current!);
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
          if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      };

  }, [currentTurn, phase, winner, gameMode, turnTimerDuration]);
  
  const calculateWinnerByScore = () => {
    let bestScore = -Infinity;
    let currentWinner: PlayerColor | null = null;
    
    (playerOrder).forEach(color => {
      if (scores[color] > bestScore) {
        bestScore = scores[color];
        currentWinner = color;
      }
    });

    if (currentWinner) {
      setWinner(currentWinner);
    }
  };

  useEffect(() => {
    if (gameMode !== '5-min' || phase === 'SETUP' || phase === 'GAME_OVER') {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
        return;
    }

    gameTimerRef.current = setInterval(() => {
        setGameTimer(prev => {
            if (prev <= 1000) {
                clearInterval(gameTimerRef.current!);
                addMessage("System", "5-minute game has ended!");
                setPhase('GAME_OVER');
                calculateWinnerByScore();
                return 0;
            }
            return prev - 1000;
        });
    }, 1000);

    return () => {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [phase, gameMode, gameTimerDuration]);

  const getPossibleMoves = (player: PlayerColor, roll: number) => {
    const playerPawns = pawns[player];
    const moves: { pawn: Pawn; newPosition: number }[] = [];

    // For 5-min mode, don't need a 6 to move out of yard, because they don't start in yard.
    if (roll === 6 && gameMode !== '5-min') {
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
      if (pawn.isHome || (pawn.position === -1 && gameMode !== '5-min')) return;

      const currentPath = PATHS[player];
      let currentPathIndex = currentPath.indexOf(pawn.position);
      
      // If pawn is in yard in 5-min mode, treat as if it's at the start.
      if (pawn.position === -1 && gameMode === '5-min') {
        currentPathIndex = -1; // effectively before the start of path
      }

      if (currentPathIndex + roll < currentPath.length) {
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
    setPhase('MOVING');
    setIsRolling(false);

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
      } else { // AI move logic
        setTimeout(() => {
            handleAiMove(value, possibleMoves);
        }, 1000);
      }
    }
  };

  const startRoll = () => {
    if (phase !== 'ROLLING') return;
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    setIsRolling(true);
  };

  const handleAiMove = async (roll: number, possibleMoves: any[]) => {
    if (roll === 6 && gameMode !== '5-min') {
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
    
    // In 5-min mode, players don't need a 6 to move from the start.
    if (pawnToMove.position === -1) {
        if (gameMode === '5-min' || diceValue === 6) {
             const startPos = START_POSITIONS[currentTurn];
             performMove(pawnToMove, startPos);
             return;
        }
    }

    const possibleMoves = getPossibleMoves(currentTurn, diceValue);
    const selectedMove = possibleMoves.find(
      (m) =>
        m.pawn.id === pawnToMove.id && m.pawn.color === pawnToMove.color
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

    // For 5-min mode scoring
    if (gameMode === '5-min') {
        const path = PATHS[currentTurn];
        const oldIndex = pawnToMove.position === -1 ? -1 : path.indexOf(pawnToMove.position);
        const newIndex = path.indexOf(newPosition);
        if (oldIndex !== -1 && newIndex > oldIndex) {
            const steps = newIndex - oldIndex;
            setScores(prev => ({...prev, [currentTurn]: prev[currentTurn] + steps}));
        } else if (oldIndex === -1 && newIndex !== -1) { // coming out of yard
            setScores(prev => ({...prev, [currentTurn]: prev[currentTurn] + 1}));
        }
    }

    setPawns((prev) => {
      const newPawns = JSON.parse(JSON.stringify(prev));
      const pawnsOfPlayer = newPawns[currentTurn];
      const pawnIndex = pawnsOfPlayer.findIndex(
        (p: Pawn) => p.id === pawnToMove.id
      );
      
      const originalPawnPosition = pawnsOfPlayer[pawnIndex].position;
      pawnsOfPlayer[pawnIndex].position = newPosition;

      if (!SAFE_ZONES.includes(newPosition)) {
        (Object.keys(newPawns) as PlayerColor[]).forEach((color) => {
          if (color !== currentTurn) {
            let opponentPawnsAtPos = newPawns[color].filter(
              (p: Pawn) => p.position === newPosition
            );
            if (
              opponentPawnsAtPos.length === 1 &&
              !SAFE_ZONES.includes(newPosition)
            ) {
              addMessage(
                'System',
                `${players[currentTurn].name} captured a pawn from ${players[color].name}!`
              );
              newPawns[color] = newPawns[color].map((p: Pawn) => {
                if (p.position === newPosition) {
                  capturedPawn = true;
                  
                  if (gameMode === '5-min') {
                      setScores(prev => ({
                          ...prev,
                          [currentTurn]: prev[currentTurn] + 20,
                          [color]: Math.max(0, prev[color] - 20)
                      }));
                  }
                  
                  // Send pawn to yard (-1) for all game modes on capture.
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

        if (gameMode === '5-min') {
            setScores(prev => ({ ...prev, [currentTurn]: prev[currentTurn] + 50 }));
        }
      }

      newPawns[currentTurn] = pawnsOfPlayer;

      // In 5-min mode, we don't check for winner by all pawns home
      if (gameMode !== '5-min') {
        const allHome = newPawns[currentTurn].every((p: Pawn) => p.isHome);
        if (allHome) {
          setWinner(currentTurn);
        }
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
        startRoll();
      }, 1000); 
    }
  }, [currentTurn, phase, winner, isMounted, players, playerOrder]);

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
          const canMove = possibleMovesForHighlight.some(
            (move) =>
              move.pawn.id === pawn.id && move.pawn.color === pawn.color
          );
          if (canMove) {
            highlight = true;
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
  
  const handleGameTimerDurationChange = (newDuration: number) => {
    if (newDuration > 0) {
      setGameTimerDuration(newDuration);
      setGameTimer(newDuration);
    }
  };
  
  const handleTurnTimerDurationChange = (newDuration: number) => {
    if (newDuration > 0) {
      setTurnTimerDuration(newDuration);
      setTurnTimer(newDuration);
    }
  };

  const handleDiceRollDurationChange = (newDuration: number) => {
    if (newDuration > 0) {
      setDiceRollDuration(newDuration);
    }
  };

  const handleGameSetupChange = (newSetup: GameSetup) => {
    setGameSetup(newSetup);
    if (gameMode === '5-min') {
      setPawns(initialPawns('5-min'));
    }
    // Potentially reset parts of the game state if player config changes drastically
    if(showNotifications) {
      toast({title: "Player Configuration Updated", description: "The game has been updated with new players."})
    }
  }

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
                {gameMode === '5-min' ? `wins with the highest score: ${scores[winner]}!` : 'has won the game!'}
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
              onGameSetupChange={handleGameSetupChange}
              currentTurn={currentTurn}
              turnTimer={turnTimer}
              turnTimerDuration={turnTimerDuration}
              onTurnTimerDurationChange={handleTurnTimerDurationChange}
              gameTimer={gameTimer}
              gameTimerDuration={gameTimerDuration}
              onGameTimerDurationChange={handleGameTimerDurationChange}
              isRolling={isRolling}
              diceRollDuration={diceRollDuration}
              onDiceRollDurationChange={handleDiceRollDurationChange}
              onRollStart={startRoll}
              onDiceRoll={handleDiceRollEnd}
              diceValue={diceValue}
              onResetAndGoHome={handleResetAndGoHome}
              muteSound={muteSound}
              onToggleMuteSound={() => setMuteSound(prev => !prev)}
              showNotifications={showNotifications}
              onToggleShowNotifications={() => setShowNotifications(prev => !prev)}
              addSecondarySafePoints={addSecondarySafePoints}
              onToggleSecondarySafePoints={() => setAddSecondarySafePoints(prev => !prev)}
              phase={phase}
            >
                <GameBoard showSecondarySafes={addSecondarySafePoints} scores={scores} gameMode={gameMode}>
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
                  <GameBoard showSecondarySafes={addSecondarySafePoints} scores={scores} gameMode={gameMode}>
                    {renderPawns()}
                  </GameBoard>
                </div>
            </main>
        </>
      )}
    </div>
  );
}

    