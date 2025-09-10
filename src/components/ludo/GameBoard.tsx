'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PlayerColor, Pawn as PawnType, PATHS, SAFE_ZONES } from '@/lib/ludo-constants';
import { StarIcon } from '../icons/StarIcon';

const gridCellStyle = "flex items-center justify-center border border-black/20";

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

        // Center 3x3 grid (Home)
        if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
            // Top-left corner
            if(x === 6 && y === 6) {
                 return <div className={cn("bg-yellow-400 relative h-full w-full", gridCellStyle)}>
                    <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                        <polygon points="0,0 100,0 0,100" className="fill-white" />
                    </svg>
                </div>;
            }
            // Top-right corner
            if(x === 8 && y === 6) {
                 return <div className={cn("bg-green-500 relative h-full w-full", gridCellStyle)}>
                    <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                        <polygon points="0,0 100,0 100,100" className="fill-white" />
                    </svg>
                </div>;
            }
            // Bottom-left corner
            if(x === 6 && y === 8) {
                 return <div className={cn("bg-red-500 relative h-full w-full", gridCellStyle)}>
                    <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                        <polygon points="0,0 0,100 100,100" className="fill-white" />
                    </svg>
                </div>;
            }
            // Bottom-right corner
            if(x === 8 && y === 8) {
                 return <div className={cn("bg-blue-500 relative h-full w-full", gridCellStyle)}>
                    <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                        <polygon points="100,0 0,100 100,100" className="fill-white" />
                    </svg>
                </div>;
            }

            // Adjacent cells
            if (x === 7 && y === 6) return <div className={cn(gridCellStyle, "bg-green-500")} />;
            if (x === 8 && y === 7) return <div className={cn(gridCellStyle, "bg-blue-500")} />;
            if (x === 7 && y === 8) return <div className={cn(gridCellStyle, "bg-red-500")} />;
            if (x === 6 && y === 7) return <div className={cn(gridCellStyle, "bg-yellow-400")} />;
            
            // Center cell
            if (x === 7 && y === 7) {
                return <div className={cn(gridCellStyle, "bg-white relative")}>
                     <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                        <polygon points="0,0 50,50 0,100" className="fill-yellow-400" />
                        <polygon points="0,0 100,0 50,50" className="fill-green-500" />
                        <polygon points="100,0 100,100 50,50" className="fill-blue-500" />
                        <polygon points="0,100 100,100 50,50" className="fill-red-500" />
                    </svg>
                </div>;
            }
        }
        
        let safeZoneColor: PlayerColor | null = null;
        // The 4 stars on colored paths
        if (x === 6 && y === 2) safeZoneColor = 'green';
        if (x === 2 && y === 8) safeZoneColor = 'yellow';
        if (x === 8 && y === 12) safeZoneColor = 'blue';
        if (x === 12 && y === 6) safeZoneColor = 'red';
        
        // Start positions also have stars
        if (x === 1 && y === 6) safeZoneColor = 'red';
        if (x === 8 && y === 1) safeZoneColor = 'green';
        if (x === 13 && y === 8) safeZoneColor = 'blue';
        if (x === 6 && y === 13) safeZoneColor = 'yellow';
        
        // Path cells
        const isPath = Object.values(PATHS).some(path => path.includes(x + y * 15));
        
        let homePathColor: PlayerColor | null = null;
        if (y === 7 && x >= 1 && x <= 5) homePathColor = 'red';
        if (x === 7 && y >= 1 && y <= 5) homePathColor = 'green';
        if (x === 7 && y >= 9 && y <= 13) homePathColor = 'blue';
        if (y === 7 && x >= 9 && x <= 13) homePathColor = 'yellow';


        if (isPath) {
            let bgColor = 'bg-white';
            
            if(homePathColor) {
                 bgColor = `${YARD_BGS[homePathColor].replace('500','400')}/50`;
            }

            return <div className={cn(gridCellStyle, bgColor, "relative h-full w-full")}>
              {safeZoneColor && <StarIcon color={safeZoneColor} />}
            </div>;
        }

        // Home yards
        const renderYard = (color: PlayerColor) => (
            <div className={cn('h-full w-full p-1 relative', YARD_BGS[color], gridCellStyle)}>
                <div className="h-full w-full bg-white/90 grid grid-cols-2 grid-rows-2 gap-2 p-2 rounded-md">
                    <div className="rounded-full border-2 border-black/80 bg-white flex items-center justify-center"></div>
                    <div className="rounded-full border-2 border-black/80 bg-white flex items-center justify-center"></div>
                    <div className="rounded-full border-2 border-black/80 bg-white flex items-center justify-center"></div>
                    <div className="rounded-full border-2 border-black/80 bg-white flex items-center justify-center"></div>
                </div>
            </div>
        );

        if (x < 6 && y < 6) return renderYard('red');
        if (x > 8 && y < 6) return renderYard('green');
        if (x < 6 && y > 8) return renderYard('yellow');
        if (x > 8 && y > 8) return renderYard('blue');
        
        return <div className={cn("h-full w-full", gridCellStyle, "bg-white")}></div>;
    }
  
  return (
    <div className="aspect-square w-full max-w-[70vh] mx-auto relative p-2 rounded-xl bg-white shadow-2xl border-4 border-black"
      style={{'--cell-size': 'calc(100% / 15)'} as React.CSSProperties}
    >
      <div className="grid grid-cols-15 grid-rows-15 h-full w-full overflow-hidden border-2 border-black">
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

const PAWN_COLORS: Record<PlayerColor, {bg: string, border:string}> = {
  red: { bg: 'bg-red-500', border: 'border-red-700' },
  green: { bg: 'bg-green-500', border: 'border-green-700' },
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-600' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-700' },
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
    // These map to the 4 circles inside the 6x6 yard
    const offsets = [
        {x: 1.5, y: 1.5},
        {x: 3.5, y: 1.5},
        {x: 1.5, y: 3.5},
        {x: 3.5, y: 3.5}
    ];
    return offsets[pawnId];
  }


  if (isHome) {
     const homeTriangleCenter: Record<PlayerColor, {x: number, y: number}> = {
        red: { x: 7, y: 3.5 },
        green: { x: 10.5, y: 7 },
        blue: { x: 3.5, y: 7 },
        yellow: { x: 7, y: 10.5 },
     }
     top = (homeTriangleCenter[color].y) * cellSize;
     left = (homeTriangleCenter[color].x) * cellSize;
  } else if (position === -1) {
    const yardBases: Record<PlayerColor, {x: number, y: number}> = {
        red: { x: 0, y: 0 },
        green: { x: 9, y: 0 },
        yellow: { x: 0, y: 9 },
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
    top = y * cellSize + cellSize * 0.1;
    left = x * cellSize + cellSize * 0.1;
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
        width: `${cellSize * (isHome ? 1 : 0.8)}%`,
        height: `${cellSize * (isHome ? 1 : 0.8)}%`,
        zIndex: highlight ? 10 : (isHome ? 0 : 1)
      }}
      className="p-1 pointer-events-auto"
      onClick={() => onPawnClick({ id, color, position, isHome })}
    >
      <div
        className={cn(
          'w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs border-4 shadow-lg cursor-pointer transition-all',
          'relative',
          PAWN_COLORS[color].bg,
          PAWN_COLORS[color].border,
          highlight && 'ring-4 ring-offset-0 ring-white scale-110'
        )}
      >
        <div className="absolute top-[15%] left-[15%] w-[70%] h-[70%] bg-white/30 rounded-full" />
        {isStacked && <span className="text-xs font-bold relative z-10">2</span>}
      </div>
    </motion.div>
  );
}
