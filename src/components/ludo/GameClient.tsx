
'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { chooseMove, computeRanking } from '@/lib/ludo-ai';
import { cn } from '@/lib/utils';
import { Dice } from './Dice';
import { Dice3D } from './Dice3D';

type GamePhase = 'SETUP' | 'ROLLING' | 'MOVING' | 'AI_THINKING' | 'GAME_OVER' | 'PAUSED' | 'RESUMING';

const LUDO_GAME_STATE_KEY = 'shangludo-arena-game-state';
const DEFAULT_CLASSIC_TURN_TIMER_DURATION = 10000;
const DEFAULT_FIVEMIN_TURN_TIMER_DURATION = 10000;
const DEFAULT_FIVE_MIN_GAME_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_DICE_ROLL_DURATION = 2000; // 2 seconds default

const initialPawns = (gameMode = 'classic', players: PlayerColor[] = ['red', 'green', 'yellow', 'blue']): Record<PlayerColor, Pawn[]> => {
  const pawns: any = {};
  (Object.keys(PLAYER_COLORS) as PlayerColor[]).forEach((color) => {
    if (players.includes(color)) {
        pawns[color] = Array(4)
        .fill(0)
        .map((_, i) => ({
            id: i,
            color,
            position: gameMode === '5-min' ? START_POSITIONS[color] : -1,
            isHome: false,
        }));
    }
  });
  return pawns;
};

const quickPlaySetup: GameSetup = {
    gameMode: 'quick',
    players: [
      { color: 'red', name: 'Red Player', type: 'human' },
      { color: 'green', name: 'Green AI', type: 'ai' },
      { color: 'yellow', 'name': 'Yellow AI', type: 'ai' },
      { color: 'blue', name: 'Blue AI', type: 'ai' },
    ],
    turnOrder: ['red', 'green', 'yellow', 'blue'],
    humanPlayerColor: 'red',
    diceRollDuration: '2000',
  };
  
  const fiveMinSetup: GameSetup = {
      gameMode: '5-min',
      players: [
        { color: 'red', name: 'Red Player', type: 'human' },
        { color: 'green', name: 'Green AI', type: 'ai' },
        { color: 'yellow', 'name': 'Yellow AI', type: 'ai' },
        { color: 'blue', name: 'Blue AI', type: 'ai' },
      ],
      turnOrder: ['red', 'green', 'yellow', 'blue'],
      humanPlayerColor: 'red',
      diceRollDuration: '2000',
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

const PLAYER_TEXT_COLORS: Record<PlayerColor, string> = {
  red: 'text-red-500',
  green: 'text-green-500',
  yellow: 'text-yellow-400',
  blue: 'text-blue-500',
};


export default function GameClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [turnTimer, setTurnTimer] = useState<number>(DEFAULT_CLASSIC_TURN_TIMER_DURATION);
  const [turnTimerDuration, setTurnTimerDuration] = useState<number>(DEFAULT_CLASSIC_TURN_TIMER_DURATION);
  const [gameTimer, setGameTimer] = useState<number>(DEFAULT_FIVE_MIN_GAME_DURATION);
  const [gameTimerDuration, setGameTimerDuration] = useState(DEFAULT_FIVE_MIN_GAME_DURATION);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [glassWalls, setGlassWalls] = useState<Record<PlayerColor, boolean>>({red: true, green: true, blue: true, yellow: true});
  const [endGameSummary, setEndGameSummary] = useState<{ title: string; winnerName: string | null; winnerColor: PlayerColor | null; ranking: { playerId: PlayerColor; name: string; score: string; }[] } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [previousPhase, setPreviousPhase] = useState<GamePhase>('ROLLING');

  
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const diceRollAudioRef = useRef<HTMLAudioElement>(null);
  const glassBreakAudioRef = useRef<HTMLAudioElement>(null);

  const SAFE_ZONES = useMemo(() => {
    const primarySafes = [
      START_POSITIONS.red,
      START_POSITIONS.green,
      START_POSITIONS.yellow,
      START_POSITIONS.blue,
    ];

    if (addSecondarySafePoints) {
      return [
        ...primarySafes,
        SECONDARY_RED_SAFE_ZONE,
        SECONDARY_GREEN_SAFE_ZONE,
        SECONDARY_BLUE_SAFE_ZONE,
        SECONDARY_YELLOW_SAFE_ZONE,
      ];
    }
    return primarySafes;
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
        if (savedState && savedState.gameSetup?.gameMode === gameMode) {
          if (savedState.phase === 'PAUSED') {
             // Defer showing the dialog until we're sure we have a valid saved state
            setShowResumeDialog(true);
          } else if (savedState.phase !== 'SETUP' && savedState.phase !== 'GAME_OVER') {
            resumeGameFromState(savedState);
            resumed = true;
            toast({ title: "Game Resumed", description: "Your previous session has been restored." });
          }
        }
      }
    } catch (error) {
      console.error("Could not load game state from localStorage", error);
      localStorage.removeItem(LUDO_GAME_STATE_KEY);
    }

    if (!resumed && !showResumeDialog) {
      if (gameMode === 'quick') {
        handleGameSetup(quickPlaySetup);
      } else if (gameMode === '5-min') {
        handleGameSetup(fiveMinSetup);
      }
    }
  }, [gameMode]);
  
  // Save state to localStorage on change
  useEffect(() => {
    if (!isMounted || phase === 'SETUP' || phase === 'GAME_OVER') return;
    try {
      const gameState: any = {
        pawns,
        currentTurn,
        diceValue,
        phase,
        previousPhase,
        winner,
        gameSetup,
        addSecondarySafePoints,
        showNotifications,
        muteSound,
        diceRollDuration,
        glassWalls,
        turnTimerDuration,
        scores,
      };
      if (gameMode === '5-min') {
        gameState.gameTimer = gameTimer;
        gameState.gameTimerDuration = gameTimerDuration;
      }
      localStorage.setItem(LUDO_GAME_STATE_KEY, JSON.stringify(gameState));
    } catch (error)
     {
      console.error("Could not save game state to localStorage", error);
    }
  }, [
      pawns, currentTurn, diceValue, phase, previousPhase, winner, gameSetup, 
      addSecondarySafePoints, showNotifications, muteSound, diceRollDuration, 
      isMounted, gameTimer, gameTimerDuration, turnTimerDuration, scores, gameMode, glassWalls
  ]);


  const addMessage = (sender: string, text: string, color?: PlayerColor) => {
    // For this design, we don't show messages in the UI.
    console.log(`Message: [${sender}] ${text}`);
  };

  const resumeGameFromState = (savedState: any) => {
    setGameSetup(savedState.gameSetup);
    setPawns(savedState.pawns);
    setCurrentTurn(savedState.currentTurn);
    setDiceValue(savedState.diceValue);
    setAddSecondarySafePoints(savedState.addSecondarySafePoints);
    if (savedState.showNotifications !== undefined) setShowNotifications(savedState.showNotifications);
    if (savedState.muteSound !== undefined) setMuteSound(savedState.muteSound);
    setDiceRollDuration(savedState.diceRollDuration);
    setGlassWalls(savedState.glassWalls ?? {red: true, green: true, blue: true, yellow: true});
    if(savedState.scores !== undefined) setScores(savedState.scores);

    const defaultTurnDuration = gameMode === '5-min' ? DEFAULT_FIVEMIN_TURN_TIMER_DURATION : DEFAULT_CLASSIC_TURN_TIMER_DURATION;
    const savedTurnDuration = savedState.turnTimerDuration;
    setTurnTimerDuration(savedTurnDuration !== undefined ? savedTurnDuration : defaultTurnDuration);

    if (gameMode === '5-min') {
      if(savedState.gameTimer !== undefined) setGameTimer(savedState.gameTimer);
      if(savedState.gameTimerDuration !== undefined) setGameTimerDuration(savedState.gameTimerDuration);
    }

    setPhase('RESUMING');
    setCountdown(3);
    const interval = setInterval(() => {
        setCountdown(prev => {
            if (prev! <= 1) {
                clearInterval(interval);
                setPhase(savedState.previousPhase || 'ROLLING');
                setCountdown(null);
                return null;
            }
            return prev! - 1;
        });
    }, 1000);
  }

  const handleResume = () => {
    setShowResumeDialog(false);
    const savedStateJSON = localStorage.getItem(LUDO_GAME_STATE_KEY);
    if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        resumeGameFromState(savedState);
        toast({ title: "Game Resumed", description: "Your paused game has been restored." });
    }
  };

  const handleNewGame = () => {
      setShowResumeDialog(false);
      localStorage.removeItem(LUDO_GAME_STATE_KEY);
      // Re-initialize based on mode
      if (gameMode === 'quick') {
        handleGameSetup(quickPlaySetup);
      } else if (gameMode === '5-min') {
        handleGameSetup(fiveMinSetup);
      } else {
        setPhase('SETUP');
      }
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
        setGameSetup(setup);
        return;
    }

    if (!activePlayers.some(p => p.type === 'human')) {
      toast({
          variant: 'destructive',
          title: 'No Human Players',
          description: 'At least one human player is required to start a game.',
      });
      setPhase('SETUP');
      setGameSetup(setup);
      return;
    }

    const turnOrder = setup.turnOrder.filter(color => activePlayers.some(p => p.color === color));
    const finalSetup = { ...setup, players: activePlayers, turnOrder: turnOrder.length > 0 ? turnOrder : activePlayers.map(p => p.color) };
    
    setGameSetup(finalSetup);
    
    const playerColors = finalSetup.players.map(p => p.color);
    setDiceRollDuration(Number(setup.diceRollDuration));
    setCurrentTurn(finalSetup.turnOrder[0]);
    setPawns(initialPawns(finalSetup.gameMode, playerColors));
    setScores({ red: 0, green: 0, yellow: 0, blue: 0 });
    setWinner(null);
    setDiceValue(null);
    setPhase('ROLLING');
    setEndGameSummary(null);
    setGlassWalls({red: true, green: true, blue: true, yellow: true});

    if (gameMode === '5-min') {
      const newTurnDuration = DEFAULT_FIVEMIN_TURN_TIMER_DURATION;
      setTurnTimerDuration(newTurnDuration);
      setTurnTimer(newTurnDuration);
      setGameTimer(gameTimerDuration);
    }
  };

  const handleEndGame = () => {
    const finalPawns = pawns;
    const finalScores = scores;
    let finalWinner = winner;

    const ranking = computeRanking(finalPawns, playerOrder, finalScores, gameMode);
    let title = "Game Over!";
    let winnerName: string | null = null;
    let winnerColor: PlayerColor | null = null;

    if (ranking.length > 0) {
      const topScore = ranking[0].score;
      const winners = ranking.filter(r => r.score === topScore);

      const allScoresZero = ranking.every(r => r.score === 0);

      if (allScoresZero && gameMode === '5-min') {
        title = "It's a Draw!";
      } else if (winners.length > 1) {
        title = "It's a Draw!";
      } else {
        finalWinner = winners[0].playerId;
        setWinner(finalWinner);
        winnerColor = finalWinner;
        winnerName = players[finalWinner]?.name || 'Unknown';
        title = `Winner:`;
      }
    }
    
    let displayScoreType = 'progress';
    if (gameMode === '5-min') displayScoreType = 'score';
    if (gameMode === 'classic') displayScoreType = 'finished';


    const summary = {
      title,
      winnerName,
      winnerColor,
      ranking: ranking.map(r => ({
        playerId: r.playerId,
        name: players[r.playerId]?.name || 'Unknown',
        score: displayScoreType === 'score' 
                ? `${r.score}` 
                : (displayScoreType === 'finished' ? `${r.finishedPawns} / 4` : `${r.progressPercentage}%`),
      }))
    };

    setEndGameSummary(summary);
    setPhase('GAME_OVER');
    localStorage.removeItem(LUDO_GAME_STATE_KEY);
  };


  useEffect(() => {
    if (winner && phase !== 'GAME_OVER') {
      handleEndGame();
    }
  }, [winner]);

  const nextTurn = () => {
    setPhase('ROLLING');
    setCurrentTurn(nextPlayerColor);
    setDiceValue(null);
    if (gameMode === '5-min') {
      setTurnTimer(turnTimerDuration);
    }
  };
  
  const getMostAdvancedPawnMove = (roll: number) => {
    const possibleMoves = getPossibleMoves(currentTurn, roll);
    if (possibleMoves.length === 0) return null;

    const path = PATHS[currentTurn];
    
    possibleMoves.sort((a, b) => {
        const pathIndexOfA = path.indexOf(a.pawn.position);
        const pathIndexOfB = path.indexOf(b.pawn.position);
        return pathIndexOfB - pathIndexOfA;
    });

    return possibleMoves[0];
  };

  useEffect(() => {
    const activePhases = ['ROLLING', 'MOVING'];
    if (gameMode !== '5-min' || !activePhases.includes(phase) || winner || phase === 'PAUSED' || phase === 'RESUMING') {
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);
        return;
    }

    // Reset timer for the new phase
    setTurnTimer(turnTimerDuration); 
    
    turnTimerRef.current = setInterval(() => {
        setTurnTimer(prev => {
            if (prev <= 1000) {
                clearInterval(turnTimerRef.current!);
                addMessage("System", `${players[currentTurn].name} ran out of time!`);
                if (showNotifications) {
                    toast({
                        variant: 'destructive',
                        title: 'Time\'s Up!',
                        description: `${players[currentTurn].name}'s turn was skipped or auto-played.`,
                    });
                }
                
                if (phase === 'MOVING') {
                   const autoMove = getMostAdvancedPawnMove(diceValue!);
                   if (autoMove) {
                       performMove(autoMove.pawn, autoMove.newPosition, diceValue!);
                   } else {
                       nextTurn();
                   }
                } else { // ROLLING phase
                   nextTurn();
                }
                return 0;
            }
            return prev - 1000;
        });
    }, 1000);

    return () => {
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };
  }, [currentTurn, phase, winner, gameMode, turnTimerDuration, diceValue]);
  
  useEffect(() => {
    if (gameMode !== '5-min' || phase === 'SETUP' || phase === 'GAME_OVER' || phase === 'PAUSED' || phase === 'RESUMING') {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
        return;
    }

    gameTimerRef.current = setInterval(() => {
        setGameTimer(prev => {
            if (prev <= 1000) {
                clearInterval(gameTimerRef.current!);
                addMessage("System", "5-minute game has ended!");
                setPhase('GAME_OVER');
                handleEndGame();
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
  
    playerPawns.forEach((pawn) => {
      if (pawn.isHome) return;

      // Rule: Can only move from yard if a 6 is rolled
      if (pawn.position === -1) {
        if (roll === 6) {
           const startPos = START_POSITIONS[player];
           const ownPawnsAtStart = playerPawns.filter(p => p.position === startPos).length;
           // In non-classic modes, check for blockades at start
           if (gameMode !== 'classic' && ownPawnsAtStart >= 2 && !SAFE_ZONES.includes(startPos)) {
             // Blockade, can't move out
           } else {
             moves.push({ pawn, newPosition: startPos });
           }
        }
        return;
      }
      
      const currentPath = PATHS[player];
      let currentPathIndex = currentPath.indexOf(pawn.position);
  
      if (currentPathIndex !== -1 && currentPathIndex + roll < currentPath.length) {
        const newPosition = currentPath[currentPathIndex + roll];
  
        // Glass wall check for quick mode: if pawn is forced to restart
        if (gameMode === 'quick' && glassWalls[player] && newPosition === GLASS_WALL_POSITIONS[player]) {
           moves.push({ pawn, newPosition: START_POSITIONS[player] });
           return; // This is a special move, no other calculation needed for this pawn
        }

        // Home run entry check
        const homeRunEntryIndex = 51;
        if (gameMode === 'quick' && glassWalls[player] && currentPathIndex < homeRunEntryIndex && currentPathIndex + roll >= homeRunEntryIndex) {
            // Blocked by wall, cannot enter home run
            return;
        }
  
        const ownPawnsAtDestination = playerPawns.filter(p => p.position === newPosition).length;

        // Blockade rules for non-classic modes
        if (gameMode !== 'classic' && !SAFE_ZONES.includes(newPosition) && ownPawnsAtDestination >= 2) {
          // Can't move to a space occupied by 2 of your own pawns unless it's a safe zone
        } else {
          moves.push({ pawn, newPosition });
        }
      }
    });
  
    return moves;
  };

  const handleDiceRollEnd = (value: number) => {
    setIsRolling(false);
    setDiceValue(value);

    if (!muteSound && diceRollAudioRef.current) {
      diceRollAudioRef.current.play();
    }

    const possibleMoves = getPossibleMoves(currentTurn, value);

    if (possibleMoves.length === 0) {
      addMessage('System', `${players[currentTurn].name} has no possible moves.`);
      setTimeout(() => {
        if (value !== 6 || winner) {
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

      if (isHumanTurn && possibleMoves.length === 1) {
        // If there's only one possible move for a human, play it automatically
        setTimeout(() => performMove(possibleMoves[0].pawn, possibleMoves[0].newPosition, value), 500);
      } else if (players[currentTurn].type === 'ai') {
        setPhase('AI_THINKING');
        setTimeout(() => {
          handleAiMove(value);
        }, 500);
      }
      // If it's a human turn with multiple moves, we just wait for the user to click a pawn.
    }
  };

  const startRoll = () => {
    if (phase !== 'ROLLING' || isRolling) return;
    if (gameMode === '5-min' && turnTimerRef.current) {
      // Don't clear here, let the useEffect for phase change handle it
    }
    
    // The Dice3D/Dice component now handles the random number generation.
    // We just trigger the animation here.
    setIsRolling(true);
  };

  const handleAiMove = (roll: number) => {
      const aiGameState = {
        pawns: pawns,
        players: gameSetup?.players || [],
        safeZones: SAFE_ZONES,
        gameMode: gameMode,
        glassWalls: glassWalls,
      };

      const move = chooseMove(aiGameState, currentTurn, roll);
      
      if (move && move.pawn) {
        performMove(move.pawn, move.newPosition, roll);
      } else {
        // AI has no move, which should be handled by the logic inside chooseAiMove
        // But as a fallback, we check what handleDiceRollEnd would do.
        if (roll !== 6) {
          nextTurn();
        } else {
          setPhase('ROLLING');
          setDiceValue(null);
        }
      }
  };

  const handlePawnMove = (pawnToMove: Pawn) => {
    if (!diceValue || pawnToMove.color !== currentTurn || phase !== 'MOVING' || !pawns[pawnToMove.color]) {
      return;
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

    performMove(pawnToMove, selectedMove.newPosition, diceValue);
  };

  const performMove = (pawnToMove: Pawn, newPosition: number, rollValue: number) => {
    const rolledSix = rollValue === 6;
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

    // Quick Mode: Handle glass wall restart
    if (gameMode === 'quick' && newPosition === START_POSITIONS[currentTurn] && pawnToMove.position !== -1) {
        toast({
            title: "Wall Block!",
            description: `${players[currentTurn].name}'s pawn was blocked and must restart its lap!`,
            variant: "destructive"
        });
        setPawns((prev) => {
            const newPawns = JSON.parse(JSON.stringify(prev));
            const pawnIndex = newPawns[currentTurn].findIndex((p: Pawn) => p.id === pawnToMove.id);
            newPawns[currentTurn][pawnIndex].position = START_POSITIONS[currentTurn];
            return newPawns;
        });
        nextTurn();
        return;
    }

    setPawns((prev) => {
      const newPawns = JSON.parse(JSON.stringify(prev));
      const pawnsOfPlayer = newPawns[currentTurn];
      const pawnIndex = pawnsOfPlayer.findIndex(
        (p: Pawn) => p.id === pawnToMove.id
      );
      
      pawnsOfPlayer[pawnIndex].position = newPosition;

      const currentPath = PATHS[currentTurn];
      const homeRunStartIndex = 51; 
      const newPathIndex = currentPath.indexOf(newPosition);

      if (newPathIndex >= homeRunStartIndex) {
        if(newPathIndex === currentPath.length - 1) { // Final home spot
            pawnsOfPlayer[pawnIndex].isHome = true;
            addMessage('System', `${players[currentTurn].name} moved a pawn home!`);
            pawnReachedHome = true;

            if (gameMode === '5-min') {
                setScores(prev => ({ ...prev, [currentTurn]: prev[currentTurn] + 50 }));
            }
        }
      } else if (!SAFE_ZONES.includes(newPosition)) {
        (Object.keys(newPawns) as PlayerColor[]).forEach((color) => {
          if (color !== currentTurn && newPawns[color]) {
            let opponentPawnsAtPos = newPawns[color].filter(
              (p: Pawn) => p.position === newPosition
            );

            // Special rule for quick/5-min mode: roll of 1 captures all
            const isSpecialCapture = (gameMode === 'quick' || gameMode === '5-min') && rollValue === 1;

            if (opponentPawnsAtPos.length > 0 && (opponentPawnsAtPos.length < 2 || isSpecialCapture)) {
                capturedPawn = true;
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

      newPawns[currentTurn] = pawnsOfPlayer;
      
      const winningConditionMet = () => {
        if (gameMode === 'quick' || gameMode === '5-min') {
            return newPawns[currentTurn].some((p: Pawn) => p.isHome);
        }
        return newPawns[currentTurn].every((p: Pawn) => p.isHome);
      };

      if (winningConditionMet()) {
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
      handleEndGame();
    }
  };

  useEffect(() => {
    const isAiTurn =
      playerOrder.includes(currentTurn) && players[currentTurn]?.type === 'ai';
    if (isAiTurn && phase === 'ROLLING' && !winner && isMounted && phase !== 'PAUSED' && phase !== 'RESUMING') {
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
    if (!gameSetup || phase === 'RESUMING') return [];
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

  const handlePauseGame = () => {
    if (phase !== 'SETUP' && phase !== 'GAME_OVER') {
        setPreviousPhase(phase);
        setPhase('PAUSED');
        toast({ title: 'Game Paused', description: 'Your game is saved. You can return later.' });
        router.push('/');
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
  
  if (showResumeDialog) {
    return (
        <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Resume Game?</DialogTitle>
                    <DialogDescription>
                        You have a paused game in this mode. Would you like to resume it?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={handleNewGame}>Start New Game</Button>
                    <Button onClick={handleResume}>Resume Game</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  }

  if (phase === 'SETUP' && gameMode === 'classic') {
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
  
  const renderGameLayout = () => {
    const boardContent = (
      <>
        {renderPawns()}
        <AnimatePresence>
          {(countdown !== null) && (
            <motion.div
              key={countdown}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <span className="text-9xl font-extrabold text-white" style={{ WebkitTextStroke: '4px black' }}>
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  
    const gameBoard = (
      <GameBoard 
        showSecondarySafes={addSecondarySafePoints} 
        scores={scores} 
        gameMode={gameMode} 
        glassWalls={gameMode === 'quick' ? glassWalls : {red: false, green: false, blue: false, yellow: false}}
      >
        {boardContent}
      </GameBoard>
    );

    const isBoardInteractive = phase !== 'PAUSED' && phase !== 'RESUMING' && phase !== 'SETUP' && countdown === null;

    if (gameMode === 'classic') {
      return (
        gameSetup && (
          <ClassicGameLayout
            gameSetup={gameSetup}
            pawns={pawns}
            onGameSetupChange={handleGameSetup}
            currentTurn={currentTurn}
            isRolling={isRolling}
            diceRollDuration={diceRollDuration}
            onDiceRollDurationChange={handleDiceRollDurationChange}
            onRollStart={startRoll}
            onDiceRoll={handleDiceRollEnd}
            diceValue={diceValue}
            onResetAndGoHome={handleResetAndGoHome}
            onPauseGame={handlePauseGame}
            muteSound={muteSound}
            onToggleMuteSound={() => setMuteSound(prev => !prev)}
            showNotifications={showNotifications}
            onToggleShowNotifications={() => setShowNotifications(prev => !prev)}
            addSecondarySafePoints={addSecondarySafePoints}
            onToggleSecondarySafePoints={() => setAddSecondarySafePoints(prev => !prev)}
            phase={phase}
          >
            <div className={cn(!isBoardInteractive && 'pointer-events-none blur-sm transition-all')}>
              {gameBoard}
            </div>
          </ClassicGameLayout>
        )
      );
    }
    
    // Quick and 5-min mode use the same layout now
    return (
      gameSetup && (
        <FiveMinGameLayout
          gameSetup={gameSetup}
          pawns={pawns}
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
          onPauseGame={handlePauseGame}
          muteSound={muteSound}
          onToggleMuteSound={() => setMuteSound(prev => !prev)}
          showNotifications={showNotifications}
          onToggleShowNotifications={() => setShowNotifications(prev => !prev)}
          addSecondarySafePoints={addSecondarySafePoints}
          onToggleSecondarySafePoints={() => setAddSecondarySafePoints(prev => !prev)}
          phase={phase}
          scores={scores}
        >
            <div className={cn(!isBoardInteractive && 'pointer-events-none blur-sm transition-all')}>
            {gameBoard}
          </div>
        </FiveMinGameLayout>
      )
    );
  };


  return (
    <div className="min-h-screen bg-gray-100 text-foreground flex flex-col">
       <Dialog
        open={phase === 'GAME_OVER' && !!endGameSummary}
        onOpenChange={(open) => {
            if (!open) {
              handleGameSetup(gameSetup!);
            }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              {endGameSummary?.title}
              {endGameSummary?.winnerName && (
                <span className={cn(endGameSummary.winnerColor && PLAYER_TEXT_COLORS[endGameSummary.winnerColor])}>
                  {endGameSummary.winnerName}
                </span>
              )}
            </DialogTitle>
             <DialogDescription className="text-center pt-2">
                Final Rankings:
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {endGameSummary?.ranking.map((player, index) => (
                <div key={player.playerId} className="flex justify-between items-center p-2 rounded-md bg-muted">
                    <span className={cn("font-semibold", PLAYER_TEXT_COLORS[player.playerId])}>
                      {index + 1}. {player.name}
                    </span>
                    <span className="font-bold">{player.score}</span>
                </div>
            ))}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => handleGameSetup(gameSetup!)}>Play Again</Button>
            <Button variant="secondary" asChild>
              <Link href="/" onClick={() => localStorage.removeItem(LUDO_GAME_STATE_KEY)}>Back to Lobby</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <audio ref={diceRollAudioRef} src="/sounds/dice-Music.mp3" preload="auto" />
      <audio ref={glassBreakAudioRef} src="/sounds/glass-break.mp3" preload="auto" />

      <div className="flex flex-col flex-1 h-screen">
        <main className="flex-1 flex flex-col">
          {renderGameLayout()}
        </main>
      </div>

      <GameFooter />
    </div>
  );
}
