
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
import { PawnIcon } from '../icons/PawnIcon';

const gridCellStyle =
  'flex items-center justify-center border-r border-b border-black/40';

export function GameBoard({
  children,
  showSecondarySafes,
  scores,
  gameMode,
}: {
  children: ReactNode;
  showSecondarySafes: boolean;
  scores: Record<PlayerColor, number>;
  gameMode: string;
}) {
  const cells = Array.from({ length: 15 * 15 });

  const YARD_BGS: Record<PlayerColor, string> = {
    red: 'bg-red-500/80',
    green: 'bg-green-500/80',
    yellow: 'bg-yellow-400/80',
    blue: 'bg-blue-500/80',
  };

  const HOME_RUN_BGS: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-500',
  };
  
  const YARD_SCORE_TEXT_COLORS: Record<PlayerColor, string> = {
    red: 'text-white',
    green: 'text-white',
    yellow: 'text-gray-800',
    blue: 'text-white',
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
    
    // This is the green home run entry, which should be green
    if (x === 8 && y === 1) return <div className={cn(borderClasses, HOME_RUN_BGS['green'])} />;
    // This is the yellow home run entry, which should be yellow
    if (x === 13 && y === 8) return <div className={cn(borderClasses, HOME_RUN_BGS['yellow'])} />;
     // This is the blue home run entry, which should be blue
    if (x === 6 && y === 13) return <div className={cn(borderClasses, HOME_RUN_BGS['blue'])} />;
    // This is the red home run entry, which should be red
    if (x === 1 && y === 6) return <div className={cn(borderClasses, HOME_RUN_BGS['red'])} />;


    // 🟡 Surrounding 8 path boxes (center ring)
    if (
        (x >= 6 && x <= 8 && y >= 6 && y <= 8) && !(x === 7 && y === 7)
    ) {
        // Correctly colored home entries
        if (x === 6 && y === 7) return <div className={cn(borderClasses, HOME_RUN_BGS['red'])} />;
        if (x === 7 && y === 6) return <div className={cn(borderClasses, HOME_RUN_BGS['green'])} />;
        if (x === 8 && y === 7) return <div className={cn(borderClasses, HOME_RUN_BGS['yellow'])} />;
        if (x === 7 && y === 8) return <div className={cn(borderClasses, HOME_RUN_BGS['blue'])} />;

        // Diagonal boxes
        let triangle1 = '', triangle2 = '', color1 = '', color2 = '';

        if (x === 6 && y === 6) { // top-left
            triangle1 = '0,0 100,0 0,100';
            triangle2 = '100,0 100,100 0,100';
            color1 = 'fill-red-500';
            color2 = 'fill-green-500';
        } else if (x === 8 && y === 6) { // top-right
            triangle1 = '0,0 100,0 100,100';
            triangle2 = '0,0 0,100 100,100';
            color1 = 'fill-green-500';
            color2 = 'fill-yellow-400';
        } else if (x === 6 && y === 8) { // bottom-left
            triangle1 = '0,100 100,100 100,0';
            triangle2 = '0,0 0,100 100,0';
            color1 = 'fill-blue-500';
            color2 = 'fill-red-500';
        } else if (x === 8 && y === 8) { // bottom-right
            triangle1 = '0,0 100,100 0,100';
            triangle2 = '0,0 100,0 100,100';
            color1 = 'fill-yellow-400';
            color2 = 'fill-blue-500';
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
        {gameMode === '5-min' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-5xl font-bold opacity-80", YARD_SCORE_TEXT_COLORS[color])}>
                {scores[color]}
            </span>
          </div>
        ) : (
          <>
            <div className="rounded-full border-2 border-white/50 bg-white/30 flex items-center justify-center"><PawnIcon color={color} className="w-1/2 h-1/2 opacity-30" /></div>
            <div className="rounded-full border-2 border-white/50 bg-white/30 flex items-center justify-center"><PawnIcon color={color} className="w-1/2 h-1/2 opacity-30" /></div>
            <div className="rounded-full border-2 border-white/50 bg-white/30 flex items-center justify-center"><PawnIcon color={color} className="w-1/2 h-1/2 opacity-30" /></div>
            <div className="rounded-full border-2 border-white/50 bg-white/30 flex items-center justify-center"><PawnIcon color={color} className="w-1/2 h-1/2 opacity-30" /></div>
          </>
        )}
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
      className="aspect-square w-full max-w-[65vh] mx-auto relative p-2 rounded-xl bg-white shadow-2xl border-4 border-gray-800"
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
          highlight && 'ring-4 ring-offset-0 ring-white scale-110'
        )}
      >
        <PawnIcon color={color} className="w-full h-full drop-shadow-md" />
        {isStacked && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold z-10 text-black">2</span>
        )}
      </div>
    </motion.div>
  );
}

    

    