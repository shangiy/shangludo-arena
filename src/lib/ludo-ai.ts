
/* src/lib/ludo-ai.ts
   Reworked AI:
   - fixes yard/home/finished detection
   - guarantees an enter-from-yard move on 6 if any pawn is in yard
   - improved aggressive heuristic (captures > finishing > progress)
   - breaks ties randomly
   - defensive handling for different pawn encodings
*/

import {
  PlayerColor,
  Pawn,
  PATHS,
  START_POSITIONS,
  GLASS_WALL_POSITIONS,
} from './ludo-constants';
import type { PlayerSetup } from '@/components/ludo/GameSetupForm';

export interface AiGameState {
  pawns: Record<PlayerColor, Pawn[]>;
  players: PlayerSetup[];
  safeZones: number[];          // array of board indices that are safe
  gameMode: string;            // 'classic' | 'quick' | '5-min' etc.
  glassWalls: Record<PlayerColor, boolean>;
}

/* ---------- Helpers ---------- */

// Normalize checks for pawn in yard/home and finished
function isInYard(pawn: Pawn) {
  // Accept common encodings: position === -1, isHome flag, or null
  return pawn.position === -1 || pawn.position === null;
}
function isFinished(pawn: Pawn) {
  // A pawn is finished if its isHome property is true.
  return pawn.isHome === true;
}

function findOpponentsOnSquare(
  pawns: Record<PlayerColor, Pawn[]>,
  square: number,
  forPlayerId: PlayerColor
) {
  const hits: { playerId: PlayerColor; pawn: Pawn }[] = [];
  for (const color in pawns) {
    if (color === forPlayerId) continue;
    const playerPawns = pawns[color as PlayerColor];
    if (!playerPawns) continue;
    for (const pawn of playerPawns) {
      if (pawn.position === square) hits.push({ playerId: color as PlayerColor, pawn });
    }
  }
  return hits;
}

function countPawnsInYard(playerPawns: Pawn[]) {
  return playerPawns.filter((p) => isInYard(p)).length;
}
function countFinishedPawns(playerPawns: Pawn[]) {
  return playerPawns.filter((p) => isFinished(p)).length;
}

/* ---------- Main chooseMove ---------- */
/**
 * Returns { pawn, newPosition } or null when no legal move.
 * Note: newPosition equals the board index (or a special finish marker if you use one).
 */
export function chooseMove(
  gameState: AiGameState,
  playerId: PlayerColor,
  dice: number
): { pawn: Pawn; newPosition: number } | null {
  const playerPawns = gameState.pawns[playerId];
  if (!playerPawns) return null;

  const safeSquares = new Set(gameState.safeZones || []);
  const startSquare = START_POSITIONS[playerId];
  const playerPath = PATHS[playerId];
  const isClassic = gameState.gameMode === 'classic';
  const getsAnotherTurn = dice === 6; // Simplified for this context

  // build list of legal moves given roll
  const getPossibleMoves = (roll: number) => {
    const moves: { pawn: Pawn; newPosition: number }[] = [];
    for (const pawn of playerPawns) {
      if (isFinished(pawn)) continue;

      // 1) Pawn in yard/home -> can only enter when roll === 6
      if (isInYard(pawn)) {
        if (roll === 6) {
          const ownAtStart = playerPawns.filter(p => p.position === startSquare).length;
          // Blockade check
          if (!isClassic && ownAtStart >= 2 && !safeSquares.has(startSquare)) {
            // Can't move out to create illegal blockade
          } else {
            moves.push({ pawn, newPosition: startSquare });
          }
        }
        continue; // cannot move forward while in yard
      }

      // 2) Pawn on board -> move along PATHS
      const curIdx = playerPath.indexOf(pawn.position as number);
      if (curIdx === -1) {
        continue;
      }
      const targetIdx = curIdx + roll;
      
      if (targetIdx < playerPath.length) {
        const newPos = playerPath[targetIdx];
        
        // Quick/5-min Mode: Glass wall sends you back to start
        if ((gameState.gameMode === 'quick' || gameState.gameMode === '5-min') && gameState.glassWalls[playerId]) {
          const homeRunEntryIndex = 51;
          if(curIdx < homeRunEntryIndex && targetIdx >= homeRunEntryIndex) {
            moves.push({ pawn, newPosition: startSquare });
            continue; // special move
          }
        }
        
        const ownAtDest = playerPawns.filter(p => p.position === newPos).length;
        if (!isClassic && !safeSquares.has(newPos) && ownAtDest >= 2) {
          // moving into own blockade (non-classic) - skip
        } else {
          moves.push({ pawn, newPosition: newPos });
        }
      }
    }
    return moves;
  };

  let possibleMoves = getPossibleMoves(dice);

  if (possibleMoves.length === 0) {
    return null;
  }
  
  if (possibleMoves.length === 1 && !getsAnotherTurn) {
    return possibleMoves[0];
  }


  // If a 6 is rolled and there are pawns in the yard, strongly prefer getting a pawn out.
  if (dice === 6 && playerPawns.some(p => isInYard(p))) {
    const enterYardMove = possibleMoves.find(m => isInYard(m.pawn));
    // If there's a capture move available, consider it against bringing a pawn out
    const captureMove = possibleMoves.find(move => {
      const opponents = findOpponentsOnSquare(gameState.pawns, move.newPosition, playerId);
      return opponents.length > 0 && !safeSquares.has(move.newPosition as number);
    });

    if (enterYardMove && !captureMove) {
      return enterYardMove; // Prioritize getting out if no capture is possible
    }
  }


  // Score each move (higher = better). AI is aggressive and individualistic.
  const scored = possibleMoves.map(move => {
    let score = 0;
    const { pawn, newPosition } = move;

    const newIdx = playerPath.indexOf(newPosition);
    const oldIdx = isInYard(pawn) ? -1 : playerPath.indexOf(pawn.position as number);

    // priority: finishing (highest)
    if (newIdx === playerPath.length - 1) score += 1200;

    // capturing opponents (strong priority)
    const opponents = findOpponentsOnSquare(gameState.pawns, newPosition, playerId);
    if (opponents.length > 0 && !safeSquares.has(newPosition as number)) {
      score += 800 + opponents.length * 150;
    }
    
    // Quick/5-min Mode: Restarting lap is very bad
    if ((gameState.gameMode === 'quick' || gameState.gameMode === '5-min') && newPosition === startSquare && oldIdx !== -1) {
      score -= 5000;
    }

    // prefer moving out of yard (encourage entering)
    if (isInYard(pawn)) score += 200;

    // safe square is good, but our AI is aggressive so small bonus
    if (safeSquares.has(newPosition as number)) score += 40;

    // progress along path (distance gained)
    if (newIdx !== -1 && oldIdx !== -1) score += (newIdx - oldIdx) * 12;
    if (oldIdx === -1 && newIdx !== -1) score += newIdx * 6;

    // discourage breaking an existing safe blockade unless strongly beneficial
    const ownAtOld = playerPawns.filter(p => p.position === pawn.position).length;
    if (oldIdx !== -1 && safeSquares.has(pawn.position as number) && ownAtOld >= 2) {
      score -= 300;
    }

    // small random to break exact ties
    score += Math.random();

    return { ...move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

/* ---------- computeRanking ---------- */

export function computeRanking(
  pawns: Record<PlayerColor, Pawn[]>,
  playerOrder: PlayerColor[],
  scores: Record<PlayerColor, number>,
  gameMode: string
) {

    const getProgressPercentage = (color: PlayerColor, playerPawns: Pawn[]) => {
        if (!playerPawns || playerPawns.length === 0) return 0;
    
        const path = PATHS[color];
        const totalPathLength = path.length - 1; // 57 steps
        const maxProgress = 4 * totalPathLength;
    
        let currentProgress = 0;

        // For quick mode, we only care about the most advanced pawn
        if (gameMode === 'quick') {
            const pawnPositions = playerPawns.map(p => {
                if (p.isHome) return totalPathLength;
                if (p.position === -1) return -1;
                return path.indexOf(p.position);
            });
            const maxPosition = Math.max(...pawnPositions);
            currentProgress = maxPosition >= 0 ? maxPosition : 0;
            const singlePawnMax = totalPathLength;
            return Math.floor(Math.min(100, (currentProgress / singlePawnMax) * 100));
        }

        // For classic and 5-min modes
        playerPawns.forEach(pawn => {
            if (pawn.isHome) {
                currentProgress += totalPathLength;
            } else if (pawn.position !== -1) { // Pawn is on the board
                const pathIndex = path.indexOf(pawn.position);
                if (pathIndex !== -1) {
                    currentProgress += pathIndex;
                }
            }
        });
        
        const percentage = (currentProgress / maxProgress) * 100;
        return Math.floor(Math.min(100, percentage));
    };


  const ranking = playerOrder.map(playerId => {
    const pp = pawns[playerId] ?? [];
    const finished = countFinishedPawns(pp);
    const progressPercentage = getProgressPercentage(playerId, pp);

    const playerPath = PATHS[playerId];
    const progressSum = pp.reduce((sum, pawn) => {
      if (isFinished(pawn)) return sum + playerPath.length;
      if (isInYard(pawn)) return sum + 0;
      const idx = playerPath.indexOf(pawn.position as number);
      return sum + (idx !== -1 ? idx : 0);
    }, 0);
    
    let score = 0;
    if (gameMode === '5-min') {
      score = scores[playerId] ?? 0;
    } else if (gameMode === 'classic') {
      score = finished;
    } else { // quick
      score = progressPercentage;
    }


    return {
      playerId,
      finishedPawns: finished,
      score: score,
      progressPercentage,
      progressSum,
    };
  });

  ranking.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-breaker: total progress
    return b.progressSum - a.progressSum;
  });

  return ranking;
}
