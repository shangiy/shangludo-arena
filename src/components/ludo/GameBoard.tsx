'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  PlayerColor,
  Pawn as PawnType,
  START_POSITIONS,
  SECONDARY_RED_SAFE_ZONE,
  SECONDARY_GREEN_SAFE_ZONE,
  SECONDARY_BLUE_SAFE_ZONE,
  SECONDARY_YELLOW_SAFE_ZONE,
} from '@/lib/ludo-constants';
import { StarIcon } from '../icons/StarIcon';

const gridCellStyle =
  'flex items-center justify-center border-r border-b border-black/40';

export function GameBoard({
  children,
  showSecondarySafes,
}: {
  children: ReactNode;
  showSecondarySafes: boolean;
}) {
  const cells = Array.from({ length: 15 * 15 });

  const YARD_BGS: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-500',
  };

  const HOME_RUN_BGS: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-500',
  };

  const getCellContent = (index: number) => {
    const x = index % 15;
    const y = Math.floor(index / 15);
    const isFirstCol = x === 0;
    const isFirstRow = y === 0;

    const borderClasses = cn(
      gridCellStyle,
      isFirstCol && 'border-l',
      isFirstRow && 'border-t'
    );

    const p = (x: number, y: number) => y * 15 + x;

    // Special case for (9,8) to be blue
    if (x === 9 && y === 8) {
      return <div className={cn(borderClasses, 'bg-blue-500')} />;
    }

    // 🟡 Surrounding 8 path boxes (center ring)
if (
  (x === 6 && y === 7) || (x === 8 && y === 7) ||
  (x === 7 && y === 6) || (x === 7 && y === 8) ||
  (x === 6 && y === 6) || (x === 6 && y === 8) ||
  (x === 8 && y === 6) || (x === 8 && y === 8)
) {
  // Full color boxes
  if (x === 6 && y === 7) return <div className={cn(borderClasses, 'bg-green-500')} />;
  if (x === 8 && y === 7) return <div className={cn(borderClasses, 'bg-blue-500')} />;
  if (x === 7 && y === 6) return <div className={cn(borderClasses, 'bg-red-500')} />;
  if (x === 7 && y === 8) return <div className={cn(borderClasses, 'bg-yellow-400')} />;

  // Diagonal boxes
  let triangle1 = '', triangle2 = '', color1 = '', color2 = '';

      // --- Diagonal boxes (inverted triangles) ---
      if (x === 6 && y === 6) { // top-left
        triangle1 = '0,0 0,100 100,100';
        triangle2 = '0,0 100,0 100,100'  // bottom + right
        color1 = 'fill-red-500';
        color2 = 'fill-green-500';
      } else if (x === 6 && y === 8) { // top-right
        triangle1 =  '100,100 100,0 0,100';
        triangle2 = '0,0 100,0 0,100';
        color1 = 'fill-blue-500';
        color2 = 'fill-red-500';
      } else if (x === 8 && y === 6) { // bottom-left
        triangle1 =  '100,100 100,0 0,100';
        triangle2 = '0,0 100,0 0,100';
        color1 = 'fill-yellow-400';
        color2 = 'fill-green-500';
      } else if (x === 8 && y === 8) { // bottom-right
        triangle1 = '0,0 0,100 100,100';
        triangle2 = '0,0 100,0 100,100';
        color1 = 'fill-blue-500';
        color2 = 'fill-yellow-400';
      }

      return (
        <div className={cn(borderClasses, 'bg-white relative')}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points={triangle1} className={color1} />
            <polygon points={triangle2} className={color2} />
          </svg>
        </div>
      );
    }

    // 🏠 Center 3x3 grid (Home triangle star)
    if (x === 7 && y === 7) {
      return (
        <div className={cn(borderClasses, 'bg-white relative')}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon points="0,0 100,0 50,50" className="fill-green-500" stroke="white" strokeWidth="2" />
            <polygon points="100,0 100,100 50,50" className="fill-yellow-400" stroke="white" strokeWidth="2" />
            <polygon points="100,100 0,100 50,50" className="fill-blue-500" stroke="white" strokeWidth="2" />
            <polygon points="0,100 0,0 50,50" className="fill-red-500" stroke="white" strokeWidth="2" />
            <circle cx="50" cy="50" r="6" fill="white" stroke="black" strokeWidth="1" />
          </svg>
        </div>
      );
    }

    // ⭐ Safe zone logic
    const safeZonePositions: Record<number, PlayerColor | 'gray'> = {
      [START_POSITIONS.red]: 'red',
      [START_POSITIONS.green]: 'green',
      [START_POSITIONS.yellow]: 'yellow',
      [START_POSITIONS.blue]: 'blue',
    };
    const safeZoneColor = safeZonePositions[p(x, y)];

    const isPath =
      (x >= 6 && x <= 8 && y >= 0 && y < 6) ||
      (x >= 9 && x <= 14 && y >= 6 && y <= 8) ||
      (x >= 6 && x <= 8 && y >= 9 && y <= 14) ||
      (x >= 0 && x <= 5 && y >= 6 && y <= 8);

    let homePathColor: PlayerColor | null = null;
    if (y === 7 && x >= 1 && x <= 5) homePathColor = 'red';
    if (x === 7 && y >= 1 && y <= 5) homePathColor = 'green';
    if (y === 7 && x >= 9 && x <= 13) homePathColor = 'yellow';
    if (x === 7 && y >= 9 && y <= 13) homePathColor = 'blue';

    if (isPath) {
      let bgColor = 'bg-white';
      if (homePathColor) bgColor = HOME_RUN_BGS[homePathColor];

      return (
        <div className={cn(borderClasses, bgColor, 'relative h-full w-full')}>
          {safeZoneColor && <StarIcon color={safeZoneColor} />}
          {showSecondarySafes && p(x, y) === SECONDARY_RED_SAFE_ZONE && <StarIcon color="red" />}
          {showSecondarySafes && p(x, y) === SECONDARY_GREEN_SAFE_ZONE && <StarIcon color="green" />}
          {showSecondarySafes && p(x, y) === SECONDARY_BLUE_SAFE_ZONE && <StarIcon color="blue" />}
          {showSecondarySafes && p(x, y) === SECONDARY_YELLOW_SAFE_ZONE && <StarIcon color="yellow" />}
        </div>
      );
    }

    // 🏡 Yard rendering
    const renderYard = (color: PlayerColor) => (
      <div
        className={cn(
          'h-full w-full p-2 relative grid grid-cols-2 grid-rows-2 gap-2',
          YARD_BGS[color],
          borderClasses
        )}
      >
        <div className="rounded-full border-2 border-white/50 bg-transparent" />
        <div className="rounded-full border-2 border-white/50 bg-transparent" />
        <div className="rounded-full border-2 border-white/50 bg-transparent" />
        <div className="rounded-full border-2 border-white/50 bg-transparent" />
      </div>
    );

    if (x < 6 && y < 6) return renderYard('red');
    if (x > 8 && y < 6) return renderYard('green');
    if (x < 6 && y > 8) return renderYard('blue');
    if (x > 8 && y > 8) return renderYard('yellow');

    return <div className={cn('h-full w-full', borderClasses, 'bg-transparent')} />;
  };

  return (
    <div
      className="aspect-square w-full max-w-[70vh] mx-auto relative p-2 rounded-xl bg-white shadow-2xl border-4 border-gray-800"
      style={{ '--cell-size': 'calc(100% / 15)' } as React.CSSProperties}
    >
      <div className="grid grid-cols-15 grid-rows-15 h-full w-full overflow-hidden">
        {cells.map((_, i) => (
          <div key={i} className="relative aspect-square">
            {getCellContent(i)}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

// 🧍 Pawn + Player Names
const PAWN_COLORS: Record<PlayerColor, { bg: string; border: string }> = {
  red: { bg: 'bg-red-500', border: 'border-black' },
  green: { bg: 'bg-green-500', border: 'border-black' },
  yellow: { bg: 'bg-yellow-400', border: 'border-black' },
  blue: { bg: 'bg-blue-500', border: 'border-black' },
};

interface PawnProps extends PawnType {
  onPawnClick: (pawn: PawnType) => void;
  highlight: boolean;
  isStacked: boolean;
}

export function Pawn({
  id,
  color,
  position,
  isHome,
  onPawnClick,
  highlight,
  isStacked,
}: PawnProps) {
  const cellSize = 100 / 15;
  let top: number;
  let left: number;

  const getYardPosition = (pawnId: number) => {
    const offsets = [
      { x: 1.5, y: 1.5 },
      { x: 3.5, y: 1.5 },
      { x: 1.5, y: 3.5 },
      { x: 3.5, y: 3.5 },
    ];
    return offsets[pawnId];
  };

  if (isHome) {
    top = 7 * cellSize;
    left = 7 * cellSize;
  } else if (position === -1) {
    const yardBases: Record<PlayerColor, { x: number; y: number }> = {
      red: { x: 0, y: 0 },
      green: { x: 9, y: 0 },
      blue: { x: 0, y: 9 },
      yellow: { x: 9, y: 9 },
    };
    const base = yardBases[color];
    const yardPos = getYardPosition(id);

    top = (base.y + yardPos.y) * cellSize;
    left = (base.x + yardPos.x) * cellSize;
  } else {
    const x = position % 15;
    const y = Math.floor(position / 15);
    top = y * cellSize;
    left = x * cellSize;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
        width: `${cellSize}%`,
        height: `${cellSize}%`,
        zIndex: highlight ? 10 : isHome ? 0 : 1,
      }}
      className="p-1 pointer-events-auto"
      onClick={() => onPawnClick({ id, color, position, isHome })}
    >
      <div
        className={cn(
          'w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shadow-lg cursor-pointer transition-all',
          'relative',
          PAWN_COLORS[color].bg,
          PAWN_COLORS[color].border,
          highlight && 'ring-4 ring-offset-0 ring-white scale-110'
        )}
      >
        <div className="absolute inset-[3px] bg-white rounded-full" />
        <div
          className={cn(
            'absolute w-1/2 h-1/2 rounded-full',
            PAWN_COLORS[color].bg
          )}
        />
        {isStacked && (
          <span className="text-xs font-bold relative z-10 text-black">2</span>
        )}
      </div>
    </motion.div>
  );
}

export function PlayerNames({
  players,
}: {
  players: Record<PlayerColor, string>;
}) {
  const namePositions: Record<PlayerColor, string> = {
    red: 'top-2 left-2',
    green: 'top-2 right-2',
    blue: 'bottom-2 left-2',
    yellow: 'bottom-2 right-2',
  };
  const textColors: Record<PlayerColor, string> = {
    red: 'text-red-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-500',
  };

  return (
    <>
      {(Object.keys(players) as PlayerColor[]).map((color) => (
        <div
          key={color}
          className={cn(
            'absolute p-2 rounded-md font-bold text-lg bg-white/70 backdrop-blur-sm shadow-md',
            namePositions[color],
            textColors[color]
          )}
        >
          {players[color]}
        </div>
      ))}
    </>
  );
}
