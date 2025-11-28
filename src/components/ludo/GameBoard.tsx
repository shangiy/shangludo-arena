
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
  GLASS_WALL_POSITIONS,
} from '@/lib/ludo-constants';
import { StarIcon } from '../icons/StarIcon';
import { PawnIcon } from '../icons/PawnIcon';
import { Ban } from 'lucide-react';

const gridCellStyle =
  'flex items-center justify-center border-r border-b border-black/40';

export function GameBoard({
  children,
  showSecondarySafes,
  scores,
  gameMode,
  glassWalls
}: {
  children: ReactNode;
  showSecondarySafes: boolean;
  scores: Record<PlayerColor, number>;
  gameMode: string;
  glassWalls: Record<PlayerColor, boolean>;
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
    
    // Path Entry Colors
    if (p(x,y) === START_POSITIONS.red) return <div className={cn(borderClasses, 'relative h-full w-full', HOME_RUN_BGS.red)}><StarIcon color="white" /></div>;
    if (p(x,y) === START_POSITIONS.green) return <div className={cn(borderClasses, 'relative h-full w-full', HOME_RUN_BGS.green)}><StarIcon color="white" /></div>;
    if (p(x,y) === START_POSITIONS.yellow) return <div className={cn(borderClasses, 'relative h-full w-full', HOME_RUN_BGS.yellow)}><StarIcon color="white" /></div>;
    if (p(x,y) === START_POSITIONS.blue) return <div className={cn(borderClasses, 'relative h-full w-full', HOME_RUN_BGS.blue)}><StarIcon color="white" /></div>;


    // 🟡 Surrounding 8 path boxes (center ring)
    if (
        (x >= 6 && x <= 8 && y >= 6 && y <= 8)
    ) {
        // Correctly colored home entries
        if (x === 7 && y === 6) return <div className={cn(borderClasses, HOME_RUN_BGS['green'])} />;
        if (x === 8 && y === 7) return <div className={cn(borderClasses, HOME_RUN_BGS['yellow'])} />;
        if (x === 7 && y === 8) return <div className={cn(borderClasses, HOME_RUN_BGS['blue'])} />;
        if (x === 6 && y === 7) return <div className={cn(borderClasses, HOME_RUN_BGS['red'])} />;
        
        // 🏠 Center cell at (7, 7) -> x=7, y=7
        if (x === 7 && y === 7) {
          return (
            <div className={cn(borderClasses, 'bg-white relative')}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="0,0 100,0 50,50" className="fill-green-500" />
                    <polygon points="100,0 100,100 50,50" className="fill-yellow-400" />
                    <polygon points="100,100 0,100 50,50" className="fill-blue-500" />
                    <polygon points="0,100 0,0 50,50" className="fill-red-500" />
                </svg>
            </div>
          );
        }

        let polygons: { points: string; className: string }[] = [];
        
        // Row 7, Col 7 (x=6, y=6)
        if (x === 6 && y === 6) { 
            polygons = [
                { points: '0,0 100,0 100,100', className: 'fill-green-500' },
                { points: '0,0 0,100 100,100', className: 'fill-red-500' },
            ];
        // Row 7, Col 9 (x=8, y=6)
        } else if (x === 8 && y === 6) {
            polygons = [
                { points: '0,0 100,0 0,100', className: 'fill-green-500' },
                { points: '0,100 100,0 100,100', className: 'fill-yellow-400' },
            ];
        // Row 9, Col 7 (x=6, y=8)
        } else if (x === 6 && y === 8) {
             polygons = [
                { points: '0,0 100,0 0,100', className: 'fill-red-500' },
                { points: '0,100 100,0 100,100', className: 'fill-blue-500' },
            ];
        // Row 9, Col 9 (x=8, y=8)
        } else if (x === 8 && y === 8) {
             polygons = [
                { points: '0,0 100,0 100,100', className: 'fill-yellow-400' },
                { points: '0,0 0,100 100,100', className: 'fill-blue-500' },
            ];
        }


        return (
            <div className={cn(borderClasses, 'bg-white/90', 'relative')}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {polygons.map((poly, i) => <polygon key={i} points={poly.points} className={poly.className} />)}
                </svg>
            </div>
        );
    }

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
      if (homePathColor) {
        bgColor = HOME_RUN_BGS[homePathColor];
      } else {
        if (gameMode === 'quick' || gameMode === '5-min') {
           bgColor = 'bg-yellow-400/20'; // Tint for modern modes
        }
      }
      
      const currentPos = p(x,y);
      if (x === 7 && y === 6) bgColor = HOME_RUN_BGS.green;
      if (x === 8 && y === 6) bgColor = HOME_RUN_BGS.green; // Make cell at (8,6) green
      if (x === 6 && y === 7) bgColor = HOME_RUN_BGS.red;
      if (x === 6 && y === 8) bgColor = HOME_RUN_BGS.red; // Make cell at (6,8) red
      if (x === 7 && y === 8) bgColor = HOME_RUN_BGS.blue;
      if (x === 8 && y === 7) bgColor = HOME_RUN_BGS.yellow;

      return (
        <div className={cn(borderClasses, bgColor, 'relative h-full w-full')}>
          {showSecondarySafes && currentPos === SECONDARY_RED_SAFE_ZONE && <StarIcon color="red" />}
          {showSecondarySafes && currentPos === SECONDARY_GREEN_SAFE_ZONE && <StarIcon color="green" />}
          {showSecondarySafes && currentPos === SECONDARY_BLUE_SAFE_ZONE && <StarIcon color="blue" />}
          {showSecondarySafes && currentPos === SECONDARY_YELLOW_SAFE_ZONE && <StarIcon color="yellow" />}
          
          {Object.entries(glassWalls).map(([color, isActive]) => 
             isActive && GLASS_WALL_POSITIONS[color as PlayerColor] === currentPos && (
                <div key={color} className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                    <Ban className="w-3/4 h-3/4 text-white/80" />
                </div>
             )
          )}
        </div>
      );
    }

    // 🏡 Yard rendering
    const renderYard = (color: PlayerColor) => (
      <div
        className={cn(
          'h-full w-full p-2 relative',
          YARD_BGS[color],
          borderClasses
        )}
      >
        <div className="h-full w-full p-2 relative grid grid-cols-2 grid-rows-2 gap-2 bg-white/30 rounded-md">
            {Array(4).fill(0).map((_, i) => (
                <div key={i} className="rounded-full border-2 border-white/50 bg-white/30" />
            ))}
        </div>
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
  stackCount: number;
  stackIndex: number;
}

export function Pawn({
  id,
  color,
  position,
  isHome,
  onPawnClick,
  highlight,
  stackCount,
  stackIndex,
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

  const stackOffsets = [
    { x: -15, y: -15 },
    { x: 15, y: -15 },
    { x: -15, y: 15 },
    { x: 15, y: 15 },
  ];
  
  let translateX = '0%';
  let translateY = '0%';
  let scale = 1;

  if (stackCount > 1) {
    // Ensure index stays within bounds of stackOffsets
    const offsetIndex = stackIndex % stackOffsets.length;
    const offset = stackOffsets[offsetIndex];
    translateX = `${offset.x}%`;
    translateY = `${offset.y}%`;
    scale = 0.7;
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
        zIndex: highlight ? 10 : isHome ? 0 : (stackIndex + 1),
        transform: `translateX(${translateX}) translateY(${translateY}) scale(${scale})`,
      }}
      className="p-0.5 pointer-events-auto"
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
        {stackCount > 1 && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold z-10 text-black">{stackCount}</span>
        )}
      </div>
    </motion.div>
  );
}
