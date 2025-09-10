'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PlayerColor, Pawn as PawnType } from '@/lib/ludo-constants';
import { StarIcon } from '../icons/StarIcon';

const gridCellStyle = "flex items-center justify-center border-r border-b border-black/40";

export function GameBoard({ children }: { children: ReactNode }) {
    const cells = Array.from({ length: 15 * 15 });
    
    const YARD_BGS: Record<PlayerColor, string> = {
        red: 'bg-red-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-400',
        blue: 'bg-blue-500',
    }
    
    const HOME_RUN_BGS: Record<PlayerColor, string> = {
        red: 'bg-red-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-400',
        blue: 'bg-blue-500',
    }

    const getCellContent = (index: number) => {
        const x = index % 15;
        const y = Math.floor(index / 15);
        const isFirstCol = x === 0;
        const isFirstRow = y === 0;

        const borderClasses = cn(
            gridCellStyle,
            isFirstCol && "border-l",
            isFirstRow && "border-t"
        );

        // Center 3x3 grid (Home)
        if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
             if (x === 7 && y === 7) {
                return <div className={cn(borderClasses, "bg-white relative")}>
                     <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                        <polygon points="0,0 100,0 50,50" className="fill-yellow-400" />
                        <polygon points="100,0 100,100 50,50" className="fill-green-500" />
                        <polygon points="100,100 0,100 50,50" className="fill-blue-500" />
                        <polygon points="0,100 0,0 50,50" className="fill-red-500" />
                    </svg>
                </div>;
            }
            // Corner cells
            if (x === 6 && y === 6) return <div className={cn(borderClasses, "bg-red-500")} />;
            if (x === 8 && y === 6) return <div className={cn(borderClasses, "bg-yellow-400")} />;
            if (x === 6 && y === 8) return <div className={cn(borderClasses, "bg-red-500")} />;
            if (x === 8 && y === 8) return <div className={cn(borderClasses, "bg-green-500")} />;

            // Adjacent cells
            if (x === 7 && y === 6) return <div className={cn(borderClasses, "bg-yellow-400")} />;
            if (x === 8 && y === 7) return <div className={cn(borderClasses, "bg-green-500")} />; 
            if (x === 7 && y === 8) return <div className={cn(borderClasses, "bg-blue-500")} />;
            if (x === 6 && y === 7) return <div className={cn(borderClasses, "bg-red-500")} />;
        }
        
        let safeZoneColor: PlayerColor | null = null;
        if (x === 2 && y === 8) safeZoneColor = 'red';
        if (x === 6 && y === 2) safeZoneColor = 'yellow';
        if (x === 12 && y === 6) safeZoneColor = 'blue';
        if (x === 8 && y === 12) safeZoneColor = 'green';
        
        const isPath = 
            (x >= 6 && x <= 8 && y >=0 && y < 6) || // green path area
            (x >= 9 && x <= 14 && y >= 6 && y <= 8) || // blue path area
            (x >= 6 && x <= 8 && y >= 9 && y <= 14) || // yellow path area
            (x >= 0 && x <= 5 && y >= 6 && y <= 8); // red path area

        let homePathColor: PlayerColor | null = null;
        if (y === 7 && x >= 1 && x <= 5) homePathColor = 'red';
        if (x === 7 && y >= 1 && y <= 5) homePathColor = 'yellow';
        if (y === 7 && x >= 9 && x <= 13) homePathColor = 'blue';
        if (x === 7 && y >= 9 && y <= 13) homePathColor = 'green';

        if (isPath) {
            let bgColor = 'bg-white';
            
            if(homePathColor) {
                 bgColor = HOME_RUN_BGS[homePathColor];
            }

            return <div className={cn(borderClasses, bgColor, "relative h-full w-full")}>
              {safeZoneColor && <StarIcon color={safeZoneColor} />}
            </div>;
        }

        // Home yards
        const renderYard = (color: PlayerColor) => (
            <div className={cn('h-full w-full p-1 relative', YARD_BGS[color], borderClasses)}>
                <div className={cn('h-full w-full grid grid-cols-2 grid-rows-2 gap-1 p-1', YARD_BGS[color])}>
                    <div className="flex items-center justify-center p-1">
                      <div className={cn('h-full w-full rounded-full', YARD_BGS[color])}></div>
                    </div>
                    <div className="flex items-center justify-center p-1">
                       <div className={cn('h-full w-full rounded-full', YARD_BGS[color])}></div>
                    </div>
                    <div className="flex items-center justify-center p-1">
                       <div className={cn('h-full w-full rounded-full', YARD_BGS[color])}></div>
                    </div>
                    <div className="flex items-center justify-center p-1">
                       <div className={cn('h-full w-full rounded-full', YARD_BGS[color])}></div>
                    </div>
                </div>
            </div>
        );

        if (x < 6 && y < 6) return renderYard('red');
        if (x > 8 && y < 6) return renderYard('yellow');
        if (x < 6 && y > 8) return renderYard('green');
        if (x > 8 && y > 8) return renderYard('blue');
        
        return <div className={cn("h-full w-full", borderClasses, "bg-transparent")}></div>;
    }
  
  return (
    <div className="aspect-square w-full max-w-[70vh] mx-auto relative p-2 rounded-xl bg-white shadow-2xl border-4 border-gray-800"
      style={{'--cell-size': 'calc(100% / 15)'} as React.CSSProperties}
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

const PAWN_COLORS: Record<PlayerColor, { bg: string; border:string }> = {
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

export function Pawn({ id, color, position, isHome, onPawnClick, highlight, isStacked }: PawnProps) {
  const cellSize = 100/15; // percentage
  let top, left;

  const getYardPosition = (pawnId: number) => {
    const offsets = [
        {x: 1.5, y: 1.5},
        {x: 3.5, y: 1.5},
        {x: 1.5, y: 3.5},
        {x: 3.5, y: 3.5}
    ];
    return offsets[pawnId];
  }


  if (isHome) {
     top = 7 * cellSize;
     left = 7 * cellSize;
  } else if (position === -1) {
    const yardBases: Record<PlayerColor, {x: number, y: number}> = {
        red: { x: 0, y: 0 },
        yellow: { x: 9, y: 0 },
        green: { x: 0, y: 9 },
        blue: { x: 9, y: 9 },
    }
    const base = yardBases[color];
    const yardPos = getYardPosition(id);
    
    top = (base.y + yardPos.y) * cellSize;
    left = (base.x + yardPos.x) * cellSize;
  } else {
    // Position on board path
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
        zIndex: highlight ? 10 : (isHome ? 0 : 1)
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
         <div className={cn("absolute w-1/2 h-1/2 rounded-full", PAWN_COLORS[color].bg)} />
        {isStacked && <span className="text-xs font-bold relative z-10 text-black">2</span>}
      </div>
    </motion.div>
  );
}

    