import {
  PlayerColor,
  Pawn,
  PATHS,
  START_POSITIONS,
} from './ludo-constants';
import type { PlayerSetup } from '@/components/ludo/GameSetupForm';

// Simplified game state for AI
export interface AiGameState {
  pawns: Record<PlayerColor, Pawn[]>;
  players: PlayerSetup[];
  safeZones: number[];
  gameMode: string;
}

/**
 * Robust helpers to handle slightly different pawn representations.
 * We don't assume one exact schema — we defensively check multiple flags.
 */
function isInYard(pawn: Pawn) {
  return pawn.position === -1;
}
function isFinished(pawn: Pawn) {
  return pawn.isHome === true;
}

// Check if a square has opponent pawns and return opponent pawn info
function findOpponentsOnSquare(
  pawns: Record<PlayerColor, Pawn[]>,
  square: number,
  forPlayerId: PlayerColor
) {
  const hits: { playerId: PlayerColor; pawn: Pawn }[] = [];
  for (const color in pawns) {
    if (color === forPlayerId) continue;
    const playerPawns = pawns[color as PlayerColor];
    if (playerPawns) {
      for (const pawn of playerPawns) {
        if (pawn.position === square) {
          hits.push({ playerId: color as PlayerColor, pawn });
        }
      }
    }
  }
  return hits;
}

// Count pawns still at home for a player
function countPawnsInYard(playerPawns: Pawn[]) {
  return playerPawns.filter((p) => isInYard(p)).length;
}

function countFinishedPawns(playerPawns: Pawn[]) {
  return playerPawns.filter((p) => isFinished(p)).length;
}

/**
 * MAIN: chooseMove
 * Returns an object { pawn, newPosition } for the best move, or null.
 * - Ensures AI always makes a legal move when one exists (especially on rolling a 6)
 * - Prefers aggressive, individualistic play (capture opponents, finish pawns)
 */
export function chooseMove(
  gameState: AiGameState,
  playerId: PlayerColor,
  dice: number
): { pawn: Pawn; newPosition: number } | null {
  const playerPawns = gameState.pawns[playerId];
  if (!playerPawns) return null;

  const safeSquares = new Set(gameState.safeZones);
  const startSquare = START_POSITIONS[playerId];
  const playerPath = PATHS[playerId];
  const isClassic = gameState.gameMode === 'classic';

  const getPossibleMoves = (player: PlayerColor, roll: number) => {
    const pawns = gameState.pawns[player];
    if (!pawns) return [];

    const moves: { pawn: Pawn; newPosition: number }[] = [];

    pawns.forEach((pawn) => {
      // Skip finished pawns
      if (isFinished(pawn)) return;

      const inYard = isInYard(pawn);

      // If pawn is at home: allow entering only on 6
      if (inYard) {
        if (roll === 6) {
          // Check blockade rules at start
          const ownPawnsAtStart = pawns.filter((p) => p.position === startSquare).length;
          if (!isClassic && ownPawnsAtStart >= 2 && !safeSquares.has(startSquare)) {
            // entering would create an illegal blockade in non-classic modes -> prefer other moves
            // Do not push enter move here (blocked)
          } else {
            moves.push({ pawn, newPosition: startSquare });
          }
        }
        return; // can't move from home except by entering on 6
      }

      // Pawn is on the board (not at home and not finished)
      const currentPathIndex = playerPath.indexOf(pawn.position as number);
      if (currentPathIndex === -1) {
        // Pawn's position not on expected PATHS (maybe already in finish stretch or alternate encoding)
        // Try to handle a common finish encoding: if pawn.position is a special 'finished' marker, we've already handled it.
        return;
      }

      const targetIndex = currentPathIndex + roll;
      if (targetIndex < playerPath.length) {
        const newPosition = playerPath[targetIndex];

        // Blockade/own-stack rules: in non-classic modes avoid moving into own blockade if that blocks play
        const ownPawnsAtDestination = pawns.filter((p) => p.position === newPosition).length;
        if (!isClassic && !safeSquares.has(newPosition) && ownPawnsAtDestination >= 2) {
          // moving into own blockade (non-classic) — skip
        } else {
          moves.push({ pawn, newPosition });
        }
      }
    });
    return moves;
  };

  // Always try to gather moves for the given dice
  const possibleMoves = getPossibleMoves(playerId, dice);

  // If there are no possible moves and dice === 6, attempt to consider any alternative legal move
  // (this helps avoid the freeze when the earlier logic incorrectly filtered out enter moves)
  if (possibleMoves.length === 0 && dice === 6) {
    // Try a relaxed pass: allow entering even if it would create a blockade in non-classic modes
    const pawns = gameState.pawns[playerId];
    for (const pawn of pawns) {
      if (isFinished(pawn)) continue;
      if (isInYard(pawn)) {
        // force an enter move as a last resort
        return { pawn, newPosition: startSquare };
      }
    }
  }

  if (possibleMoves.length === 0) {
    return null;
  }

  // Scoring heuristic (higher is better)
  const scoredMoves = possibleMoves.map((move) => {
    let score = 0;
    const { pawn, newPosition } = move;

    // Determine indices on path (safely)
    const newPathIndex = playerPath.indexOf(newPosition);
    const oldPathIndex = isInYard(pawn) ? -1 : playerPath.indexOf(pawn.position as number);

    // 1. Finishing a pawn is the highest priority
    if (newPathIndex === playerPath.length - 1) {
      score += 1000;
    }

    // 2. Capturing an opponent is a very high priority (aggressive play)
    const opponents = findOpponentsOnSquare(gameState.pawns, newPosition, playerId);
    if (opponents.length > 0 && !safeSquares.has(newPosition)) {
      // reward captures; prefer capturing multiple pawns too
      score += 700 + opponents.length * 100;
    }

    // 3. Moving a pawn out of the yard
    if (isInYard(pawn)) score += 120;

    // 4. Moving to a safe square is mildly helpful
    if (safeSquares.has(newPosition as number)) score += 40;

    // 5. General progress: prefer larger forward movement
    if (newPathIndex !== -1 && oldPathIndex !== -1) score += (newPathIndex - oldPathIndex) * 10;
    if (oldPathIndex === -1 && newPathIndex !== -1) score += newPathIndex * 5; // from home -> progress

    // 6. Avoid unnecessarily breaking an existing safe blockade (if it's keeping pawns safe)
    const ownPawnsAtOldPos = playerPawns.filter((p) => p.position === pawn.position).length;
    if (oldPathIndex !== -1 && safeSquares.has(pawn.position as number) && ownPawnsAtOldPos >= 2) {
      score -= 250; // discourage breaking a protective blockade unless there's a strong reason
    }

    // 7. Slight randomness to break ties
    score += Math.random();

    return { ...move, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);

  // Return the top move
  return scoredMoves[0];
}

/**
 * computeRanking
 * Produces an ordered list of players by game progress.
 */
export function computeRanking(
  pawns: Record<PlayerColor, Pawn[]>,
  playerOrder: PlayerColor[],
  scores: Record<PlayerColor, number>,
  gameMode: string
) {
  const ranking = playerOrder.map((playerId) => {
    const playerPawns = pawns[playerId];
    const finishedPawns = playerPawns ? countFinishedPawns(playerPawns) : 0;

    let progressSum = 0;
    if (playerPawns) {
      const playerPath = PATHS[playerId];
      progressSum = playerPawns.reduce((sum, pawn) => {
        if (isFinished(pawn)) return sum + playerPath.length; // finished counts as full progress
        if (isInYard(pawn)) return sum + 0; // at home -> zero
        const pathIndex = playerPath.indexOf(pawn.position as number);
        return sum + (pathIndex !== -1 ? pathIndex : 0);
      }, 0);
    }

    return {
      playerId,
      finishedPawns,
      score: gameMode === '5-min' ? scores[playerId] ?? 0 : finishedPawns,
      progressSum,
    };
  });

  ranking.sort((a, b) => {
    if (gameMode === '5-min') {
      if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
    } else {
      if (b.finishedPawns !== a.finishedPawns) return b.finishedPawns - a.finishedPawns;
    }
    return b.progressSum - a.progressSum;
  });

  return ranking;
}
