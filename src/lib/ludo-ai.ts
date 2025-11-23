
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
 * UTILITY HELPERS
 */

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
function countHomePawns(playerPawns: Pawn[]) {
  return playerPawns.filter((p) => p.position === -1).length;
}

function countFinishedPawns(playerPawns: Pawn[]) {
    return playerPawns.filter((p) => p.isHome).length;
}


/**
 * MAIN: chooseMove
 * Returns an object { pawn, newPosition } for the best move, or null.
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
      if (pawn.isHome) return;

      if (pawn.position === -1) {
        if (roll === 6) {
           const ownPawnsAtStart = pawns.filter(p => p.position === startSquare).length;
           if (!isClassic && ownPawnsAtStart >= 2 && !safeSquares.has(startSquare)) {
             // Blockade
           } else {
             moves.push({ pawn, newPosition: startSquare });
           }
        }
        return;
      }
      
      const currentPathIndex = playerPath.indexOf(pawn.position);
      if (currentPathIndex !== -1 && currentPathIndex + roll < playerPath.length) {
        const newPosition = playerPath[currentPathIndex + roll];
        const ownPawnsAtDestination = pawns.filter(p => p.position === newPosition).length;

        if (isClassic) {
          moves.push({ pawn, newPosition });
        } else {
          if (!safeSquares.has(newPosition) && ownPawnsAtDestination >= 2) {
            // Blocked by own blockade
          } else {
            moves.push({ pawn, newPosition });
          }
        }
      }
    });
    return moves;
  };

  const possibleMoves = getPossibleMoves(playerId, dice);
  if (possibleMoves.length === 0) {
    return null;
  }
  
  // Scoring heuristic (higher is better)
  const scoredMoves = possibleMoves.map((move) => {
    let score = 0;
    const { pawn, newPosition } = move;

    // 1. Finishing a pawn is the highest priority
    const newPathIndex = playerPath.indexOf(newPosition);
    if (newPathIndex === playerPath.length -1) {
      score += 1000;
    }

    // 2. Capturing an opponent is a high priority
    const opponents = findOpponentsOnSquare(gameState.pawns, newPosition, playerId);
    if (opponents.length > 0 && opponents.length < 2 && !safeSquares.has(newPosition)) {
      score += 500;
    }

    // 3. Moving a pawn out of the yard
    if (pawn.position === -1) {
      score += 100;
    }
    
    // 4. Moving to a safe square
    if (safeSquares.has(newPosition)) {
      score += 50;
    }

    // 5. General progress
    const oldPathIndex = pawn.position === -1 ? -1 : playerPath.indexOf(pawn.position);
    score += newPathIndex - oldPathIndex;

    // 6. Avoid breaking a blockade on a safe square
    const ownPawnsAtOldPos = playerPawns.filter(p => p.position === pawn.position).length;
    if (pawn.position !== -1 && safeSquares.has(pawn.position) && ownPawnsAtOldPos >= 2) {
        score -= 200; // It's a risk to move from a safe blockade
    }
    
    // 7. Slight randomness to break ties
    score += Math.random();

    return { ...move, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  
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
    const ranking = playerOrder.map(playerId => {
        const playerPawns = pawns[playerId];
        const finishedPawns = playerPawns ? countFinishedPawns(playerPawns) : 0;
        
        let progressSum = 0;
        if (playerPawns) {
            const playerPath = PATHS[playerId];
            progressSum = playerPawns.reduce((sum, pawn) => {
                if (pawn.isHome) return sum + playerPath.length;
                if (pawn.position === -1) return sum;
                const pathIndex = playerPath.indexOf(pawn.position);
                return sum + (pathIndex !== -1 ? pathIndex : 0);
            }, 0);
        }

        return {
            playerId,
            finishedPawns,
            score: gameMode === '5-min' ? scores[playerId] : finishedPawns,
            progressSum
        };
    });

    ranking.sort((a, b) => {
        if (gameMode === '5-min') {
            if (b.score !== a.score) return b.score - a.score;
        } else {
            if (b.finishedPawns !== a.finishedPawns) return b.finishedPawns - a.finishedPawns;
        }
        return b.progressSum - a.progressSum;
    });

    return ranking;
}

    
