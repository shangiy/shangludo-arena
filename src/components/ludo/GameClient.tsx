
'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  GameBoard,
  Pawn as PawnComponent,
} from '@/components/ludo/GameBoard';
import { ClassicGameLayout } from '@/components/ludo/ClassicGameLayout';
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
  GLASS_WALL_POSITIONS,
} from '@/lib/ludo-constants';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EndLogo } from '../icons/EndLogo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { GameSetup, GameSetupForm } from './GameSetupForm';
import { generateAIMove } from '@/ai/flows/ai-opponent';

type GamePhase = 'SETUP' | 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER';

const LUDO_GAME_STATE_KEY = 'shangludo-arena-game-state';
const DEFAULT_TURN_TIMER_DURATION = 15000;
const DEFAULT_FIVE_MIN_GAME_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_DICE_ROLL_DURATION = 1000; // 1 second for AI

const initialPawns = (gameMode = 'classic', players: PlayerColor[] = ['red', 'green', 'yellow', 'blue']): Record<PlayerColor, Pawn[]> => {
  const pawns: any = {};
  (Object.keys(PLAYER_COLORS) as PlayerColor[]).forEach((color) => {
    if (players.includes(color)) {
        pawns[color] = Array(4)
        .fill(0)
        .map((_, i) => ({
            id: i,
            color,
            position: gameMode === '5-min' ? START_POSITIONS[color] : -1, // -1 is in the yard
            isHome: false,
        }));
    }
  });
  return pawns;
};

const quickPlaySetup: GameSetup = {
  gameMode: 'vs-computer',
  players: [
    { color: 'red', name: 'You', type: 'human' },
    { color: 'green', name: 'Green AI', type: 'ai' },
    { color: 'yellow', 'name': 'Yellow AI', type: 'ai' },
    { color: 'blue', name: 'Blue AI', type: 'ai' },
  ],
  turnOrder: ['red', 'green', 'yellow', 'blue'],
  humanPlayerColor: 'red',
  diceRollDuration: '1000',
};

const fiveMinSetup: GameSetup = {
    gameMode: 'vs-computer',
    players: [
      { color: 'red', name: 'Red Player', type: 'human' },
      { color: 'green', name: 'Green Player', type: 'human' },
      { color: 'yellow', name: 'Yellow AI', type: 'ai' },
      { color: 'blue', name: 'Blue Player', type: 'human' },
    ],
    turnOrder: ['red', 'green', 'yellow', 'blue'],
    humanPlayerColor: 'red',
    diceRollDuration: '3000',
  };

function GameFooter() {
    return (
        <footer className="w-full bg-[#111827] text-gray-300 py-2">
            <div className="max-w-7xl mx-auto flex justify-center items-center">
                 <p className="text-xs">&copy; 2025 Mushangi Patrick Portfolio. Shangludo. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default function GameClient() {
  const searchParams = useSearchParams();
  const gameMode = searchParams.get('mode') || 'classic';
  const { toast } = useToast();

  const [pawns, setPawns] = useState<Record<PlayerColor, Pawn[]>>({});
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
  const [glassWalls, setGlassWalls] = useState<Record<PlayerColor, boolean>>({red: true, green: true, blue: true, yellow: true});
  
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const diceRollAudioRef = useRef<HTMLAudioElement>(null);
  const glassBreakAudioRef = useRef<HTMLAudioElement>(null);

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
      return {};
    }
    const playerConfig: any = {};
    gameSetup.players.forEach((p) => {
      playerConfig[p.color] = { name: p.name, color: p.color, type: p.type };
    });
    return playerConfig;
  }, [gameSetup]);

  const playerOrder: PlayerColor[] = useMemo(
    () => gameSetup?.turnOrder || [],
    [gameSetup]
  );

  const nextPlayerColor = useMemo(() => {
    if (playerOrder.length === 0) return currentTurn;
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
          setGameSetup(savedState.gameSetup);
          setPawns(savedState.pawns);
          setCurrentTurn(savedState.currentTurn);
          setDiceValue(savedState.diceValue);
          setPhase(savedState.phase);
          setWinner(savedState.winner);
          setAddSecondarySafePoints(savedState.addSecondarySafePoints);
          if (savedState.showNotifications !== undefined) setShowNotifications(savedState.showNotifications);
          if (savedState.muteSound !== undefined) setMuteSound(savedState.muteSound);
          setDiceRollDuration(savedState.diceRollDuration);
          setGlassWalls(savedState.glassWalls ?? {red: true, green: true, blue: true, yellow: true});
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
        glassWalls,
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
      isMounted, gameTimer, gameTimerDuration, turnTimerDuration, scores, gameMode, glassWalls
  ]);


  const addMessage = (sender: string, text: string, color?: PlayerColor) => {
    // For this design, we don't show messages in the UI.
    console.log(`Message: [${sender}] ${text}`);
  };

  const handleGameSetup = (setup: GameSetup) => {
    localStorage.removeItem(LUDO_GAME_STATE_KEY);
    const activePlayers = setup.players.filter(p => p.type !== 'none');
    
    if (activePlayers.length < 2) {
        toast({
            variant: 'destructive',
            title: 'Not Enough Players',
            description: 'You need at least two players to start a game.',
        });
        setPhase('SETUP');
        // If we are in quick/5-min mode, we need to reset the gameSetup so the form doesn't disappear
        if (gameMode === 'quick' || gameMode === '5-min' || gameMode === 'classic') {
            setGameSetup(setup);
        } else {
             setGameSetup(null);
        }
        return;
    }

    const turnOrder = setup.turnOrder.filter(color => activePlayers.some(p => p.color === color));
    const finalSetup = { ...setup, players: activePlayers, turnOrder: turnOrder.length > 0 ? turnOrder : activePlayers.map(p => p.color) };
    
    setGameSetup(finalSetup);
    
    const playerColors = finalSetup.players.map(p => p.color);
    setDiceRollDuration(Number(setup.diceRollDuration));
    setCurrentTurn(finalSetup.turnOrder[0]);
    setPawns(initialPawns(gameMode, playerColors));
    setScores({ red: 0, green: 0, yellow: 0, blue: 0 });
    setWinner(null);
    setDiceValue(null);
    setPhase('ROLLING');
    setGlassWalls({red: true, green: true, blue: true, yellow: true});
    if (gameMode === '5-min') {
      setGameTimer(gameTimerDuration);
    }
  };

  useEffect(() => {
    if (winner && showNotifications) {
      let description = `${players[winner]?.name} has won the game by getting all their pawns home!`;
       if (gameMode === 'quick' || gameMode === 'classic') {
            description = `${players[winner].name} has won the game by getting all their pawns home!`;
        }
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
    if (!playerPawns) return [];
  
    const moves: { pawn: Pawn; newPosition: number }[] = [];
    const isClassic = gameMode === 'classic';
  
    // Pawns on the board can always move
    playerPawns.forEach((pawn) => {
      if (pawn.isHome || (pawn.position === -1 && gameMode !== '5-min')) return;
  
      const currentPath = PATHS[player];
      let currentPathIndex = currentPath.indexOf(pawn.position);
  
      if (currentPathIndex !== -1 && currentPathIndex + roll < currentPath.length) {
        const newPosition = currentPath[currentPathIndex + roll];
  
        // Glass wall check for quick mode
        if (gameMode === 'quick') {
          const wallPosition = GLASS_WALL_POSITIONS[player];
          if (glassWalls[player] && wallPosition) {
            const wallIndexOnPath = currentPath.indexOf(wallPosition);
            if (wallIndexOnPath !== -1 && currentPathIndex < wallIndexOnPath && currentPathIndex + roll >= wallIndexOnPath) {
              return; // Invalid move, blocked by wall
            }
          }
        }
  
        const ownPawnsAtDestination = playerPawns.filter(p => p.position === newPosition).length;

        if (isClassic) {
          moves.push({ pawn, newPosition });
        } else { // Blockade rules for non-classic
          if (!SAFE_ZONES.includes(newPosition) && ownPawnsAtDestination >= 2) {
            // Can't move to a space occupied by 2 of your own pawns unless it's a safe zone
          } else {
            moves.push({ pawn, newPosition });
          }
        }
      }
    });
  
    // A 6 allows moving a pawn from the yard
    if (roll === 6 && gameMode !== '5-min') {
      const pawnsInYard = playerPawns.filter((p) => p.position === -1);
      if (pawnsInYard.length > 0) {
        const startPos = START_POSITIONS[player];
        const ownPawnsAtStart = playerPawns.filter(p => p.position === startPos).length;
        
        // Non-classic modes: you can't enter on a blockade
        if (!isClassic && ownPawnsAtStart >= 2 && !SAFE_ZONES.includes(startPos)) {
          // blockade, cannot move out
        } else {
          pawnsInYard.forEach((pawn) => moves.push({ pawn, newPosition: startPos }));
        }
      }
    }
  
    return moves;
  };

  const handleDiceRollEnd = (value: number) => {
    setIsRolling(false);
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
      setPhase('MOVING');
      const isHumanTurn = players[currentTurn].type === 'human';
      const isAITurn = players[currentTurn].type === 'ai';

      if (isHumanTurn) {
        if (possibleMoves.length === 1) {
          setTimeout(() => handlePawnMove(possibleMoves[0].pawn), 1000);
        }
      } else if (isAITurn) {
        setPhase('AI_THINKING');
        setTimeout(() => {
            handleAiMove(value);
        }, 100);
      }
    }
  };

  const startRoll = () => {
    if (phase !== 'ROLLING' || isRolling) return;
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    setIsRolling(true);
    setDiceValue(null);
  };

  const handleAiMove = async (roll: number) => {
    const boardState = JSON.stringify(pawns, null, 2);
    try {
      const aiResponse = await generateAIMove({
        boardState,
        currentPlayer: currentTurn,
        diceRoll: roll,
      });

      console.log('AI Response:', aiResponse);
      addMessage(`AI (${players[currentTurn].name})`, aiResponse.reasoning, currentTurn);
      
      const moveRegex = /pawn:(\d+|null),from:(-?\d+|null),to:(-?\d+|null)/;
      const match = aiResponse.move.match(moveRegex);

      if (match) {
        if (match[1] === 'null') {
          // AI indicates no valid move
          nextTurn();
          return;
        }

        const pawnId = parseInt(match[1], 10);
        const newPosition = parseInt(match[3], 10);
        
        const pawnToMove = pawns[currentTurn].find(p => p.id === pawnId);
        
        if (pawnToMove) {
          const possibleMoves = getPossibleMoves(currentTurn, roll);
          const isValidMove = possibleMoves.some(m => m.pawn.id === pawnToMove.id && m.newPosition === newPosition);

          if (isValidMove) {
            performMove(pawnToMove, newPosition);
          } else {
             addMessage('System', `AI for ${currentTurn} chose an invalid move. Taking first valid move.`);
             const fallbackMove = possibleMoves[0];
             if(fallbackMove) {
                performMove(fallbackMove.pawn, fallbackMove.newPosition);
             } else {
                nextTurn(); // Should have been caught earlier, but just in case
             }
          }
        } else {
          throw new Error('AI chose a non-existent pawn.');
        }
      } else {
        throw new Error('AI response move format is incorrect.');
      }
    } catch (error) {
      console.error("AI move failed, performing fallback move:", error);
      addMessage('System', `AI for ${currentTurn} failed. Taking first valid move.`);
      const possibleMoves = getPossibleMoves(currentTurn, roll);
       if (possibleMoves.length > 0) {
        performMove(possibleMoves[0].pawn, possibleMoves[0].newPosition);
      } else {
        nextTurn();
      }
    }
  };

  const handlePawnMove = (pawnToMove: Pawn) => {
    if (!diceValue || pawnToMove.color !== currentTurn || phase !== 'MOVING' || !pawns[pawnToMove.color]) {
      return;
    }
    
    if (pawnToMove.position === -1) {
        if (diceValue === 6 && gameMode !== '5-min') {
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
      if (players[currentTurn]?.type === 'human' && showNotifications) {
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
            let opponentPawnsAtPos = newPawns[color]?.filter(
              (p: Pawn) => p.position === newPosition
            );

            // In classic mode, you can capture a single pawn.
            if (gameMode === 'classic' && opponentPawnsAtPos?.length === 1) {
                capturedPawn = true;
            }
            // In other modes, you can capture if it's not a blockade.
            else if (gameMode !== 'classic' && opponentPawnsAtPos?.length === 1 && !SAFE_ZONES.includes(newPosition)) {
                 capturedPawn = true;
            }

            if (capturedPawn) {
                 addMessage('System', `${players[currentTurn].name} captured a pawn from ${players[color].name}!`);
                 newPawns[color] = newPawns[color].map((p: Pawn) => {
                    if (p.position === newPosition) {
                        if (gameMode === 'quick' && glassWalls[currentTurn]) {
                             setGlassWalls(prev => ({...prev, [currentTurn]: false}));
                            if (!muteSound && glassBreakAudioRef.current) {
                                glassBreakAudioRef.current.play();
                            }
                            addMessage('System', `The glass wall for ${players[currentTurn].name} has shattered!`);
                            if (showNotifications) {
                                toast({ title: 'Glass Wall Shattered!', description: `${players[currentTurn].name} has broken the barrier!` });
                            }
                        }
                        if (gameMode === '5-min') {
                           setScores(prev => ({ ...prev, [currentTurn]: prev[currentTurn] + 20, [color]: Math.max(0, prev[color] - 20) }));
                        }
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

      const allPawnsHome = newPawns[currentTurn].every((p: Pawn) => p.isHome);
      if (allPawnsHome && gameMode !== '5-min') {
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
        startRoll();
      }, 100); 
    }
  }, [currentTurn, phase, winner, isMounted, players, playerOrder]);

  const possibleMovesForHighlight = useMemo(() => {
    if (phase === 'MOVING' && diceValue && players[currentTurn]?.type === 'human') {
      return getPossibleMoves(currentTurn, diceValue);
    }
    return [];
  }, [phase, diceValue, currentTurn, pawns, players, gameMode]);

  const renderPawns = () => {
    if (!gameSetup) return [];
    const allPawns: { pawn: Pawn, highlight: boolean, stackCount: number, stackIndex: number }[] = [];
    const positions: { [key: number]: Pawn[] } = {};
  
    // Group pawns by position
    (Object.keys(pawns) as PlayerColor[]).forEach(color => {
      if (pawns[color]) {
        pawns[color].forEach(pawn => {
            if (pawn.position !== -1 && !pawn.isHome) {
            if (!positions[pawn.position]) {
                positions[pawn.position] = [];
            }
            positions[pawn.position].push(pawn);
            }
        });
      }
    });
  
    // Create render list
    (Object.keys(pawns) as PlayerColor[]).forEach(color => {
        if (pawns[color]) {
            pawns[color].forEach(pawn => {
                const isPlayerTurn = pawn.color === currentTurn && phase === 'MOVING' && players[currentTurn]?.type === 'human';
                let highlight = false;
        
                if (isPlayerTurn) {
                highlight = possibleMovesForHighlight.some(move => move.pawn.id === pawn.id && move.pawn.color === pawn.color);
                }
        
                const pawnsAtSamePos = positions[pawn.position] || [];
                const stackCount = pawnsAtSamePos.length;
                const stackIndex = pawnsAtSamePos.findIndex(p => p.id === pawn.id && p.color === pawn.color);
                
                allPawns.push({ pawn, highlight, stackCount: gameMode !== 'classic' && stackCount > 1 ? stackCount : 0, stackIndex });
            });
        }
    });
  
    return allPawns.map(({ pawn, highlight, stackCount, stackIndex }) => (
      <PawnComponent
        key={`${pawn.color}-${pawn.id}`}
        {...pawn}
        onPawnClick={handlePawnMove}
        highlight={highlight}
        stackCount={stackCount}
        stackIndex={stackIndex}
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
      if (!gameSetup) return;
      const mergedSetup = { ...gameSetup, ...newSetup };
      setGameSetup(mergedSetup);
  }

  const applyGameSetupChanges = () => {
      if (gameSetup) {
          handleGameSetup(gameSetup);
      }
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
        <div className="relative min-h-screen bg-gray-100 flex flex-col">
            <main className="flex-1 flex items-center justify-center p-4">
                <Suspense fallback={<div />}>
                    <GameSetupForm onSetupComplete={handleGameSetup} />
                </Suspense>
            </main>
            <GameFooter />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-foreground flex flex-col">
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
                  {players[winner]?.name}
                </span>{' '}
                {gameMode === '5-min' ? `wins with the highest score: ${scores[winner]}!` : 'has won the game!'}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            <EndLogo className="h-20 w-20" />
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
      <audio ref={glassBreakAudioRef} src="/sounds/glass-break.mp3" preload="auto" />

      {gameMode === '5-min' ? (
        <div className="flex flex-col flex-1 h-screen">
            <main className="flex-1 flex flex-col">
                {gameSetup && (
                    <FiveMinGameLayout
                      gameSetup={gameSetup}
                      onGameSetupChange={handleGameSetup}
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
                      scores={scores}
                    >
                        <GameBoard showSecondarySafes={addSecondarySafePoints} scores={scores} gameMode={gameMode} glassWalls={glassWalls}>
                            {renderPawns()}
                        </GameBoard>
                    </FiveMinGameLayout>
                )}
            </main>
        </div>
      ) : (
        <div className="flex flex-col flex-1 h-screen">
          <main className="flex-1 flex flex-col">
            {gameSetup && (
              <ClassicGameLayout
                gameSetup={gameSetup}
                onGameSetupChange={handleGameSetup}
                currentTurn={currentTurn}
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
                  <GameBoard 
                    showSecondarySafes={addSecondarySafePoints} 
                    scores={{red:0, green:0, blue:0, yellow:0}} 
                    gameMode={gameMode} 
                    glassWalls={gameMode === 'quick' ? glassWalls : {red: false, green: false, blue: false, yellow: false}}
                  >
                      {renderPawns()}
                  </GameBoard>
              </ClassicGameLayout>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
