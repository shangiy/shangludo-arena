'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PlayerColor, Pawn as PawnType, PATHS, SAFE_ZONES, START_POSITIONS } from '@/lib/ludo-constants';
import { StarIcon } from '../icons/StarIcon';

const gridCellStyle = "flex items-center justify-center";

export function GameBoard({ children }: { children: ReactNode }) {
    const cells = Array.from({ length: 15 * 15 });
    
    const YARD_BGS: Record<PlayerColor, string> = {
        blue: 'bg-blue-500',
        yellow: 'bg-yellow-400',
        red: 'bg-red-500',
        green: 'bg-green-500',
    }
    
    const HOME_RUN_BGS: Record<PlayerColor, string> = {
        blue: 'bg-blue-300',
        yellow: 'bg-yellow-200',
        red: 'bg-red-300',
        green: 'bg-green-300',
    }

    const getCellContent = (index: number) => {
        const x = index % 15;
        const y = Math.floor(index / 15);

        // Path cells
        const isPath = Object.values(PATHS).some(path => path.includes(x + y * 15));
        const isSafe = SAFE_ZONES.includes(x + y * 15);
        const isStart = Object.values(START_POSITIONS).includes(x + y * 15);
        
        let colorForPath: PlayerColor | null = null;
        if (x >= 1 && x <= 5 && y === 7) colorForPath = 'red';
        if (x === 7 && y >= 8 && y <= 13) colorForPath = 'blue';
        if (x >= 9 && x <= 13 && y === 7) colorForPath = 'green';
        if (x === 7 && y >= 1 && y <= 5) colorForPath = 'yellow';

        if (isPath) {
            let bgColor = 'bg-white';
            let starColor: PlayerColor | 'white' = 'white';
            
            if(colorForPath) {
                bgColor = HOME_RUN_BGS[colorForPath]
            }

            if(isStart) {
                if (x === 1 && y === 6) { starColor = 'red'; }
                if (x === 8 && y === 1) { starColor = 'yellow'; }
                if (x === 13 && y === 8) { starColor = 'green'; }
                if (x === 6 && y === 13) { starColor = 'blue'; }
            }

            return <div className={cn(gridCellStyle, bgColor, "relative h-full w-full border border-black/20")}>
              {isSafe && <StarIcon color={isStart ? starColor : colorForPath || 'gray'} />}
            </div>;
        }

        // Home yards
        const renderYard = (color: PlayerColor) => (
            <div className={cn('h-full w-full p-1 relative', YARD_BGS[color])}>
                <div className="h-full w-full bg-white grid grid-cols-2 grid-rows-2 gap-2 p-2 rounded-md">
                    <div className="rounded-full border-2 border-dashed border-black/30"></div>
                    <div className="rounded-full border-2 border-dashed border-black/30"></div>
                    <div className="rounded-full border-2 border-dashed border-black/30"></div>
                    <div className="rounded-full border-2 border-dashed border-black/30"></div>
                </div>
            </div>
        );

        if (x < 6 && y < 6) return renderYard('red');
        if (x > 8 && y < 6) return renderYard('yellow');
        if (x < 6 && y > 8) return renderYard('blue');
        if (x > 8 && y > 8) return renderYard('green');
        
        // Center home triangle
        if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
            return <div className="h-full w-full flex items-center justify-center overflow-hidden bg-white relative border border-black/20">
                 <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                    <polygon points="0,0 100,0 50,50" className="fill-yellow-400" /> 
                    <polygon points="100,0 100,100 50,50" className="fill-green-500" /> 
                    <polygon points="0,100 100,100 50,50" className="fill-blue-500" />
                    <polygon points="0,0 0,100 50,50" className="fill-red-500" />
                </svg>
            </div>;
        }

        return <div className="h-full w-full bg-transparent"></div>;
    }
  
  return (
    <div className="aspect-square w-full max-w-[70vh] mx-auto relative p-2 rounded-xl bg-white shadow-2xl border-4 border-gray-800"
      style={{'--cell-size': 'calc(100% / 15)'} as React.CSSProperties}
    >
      <div className="grid grid-cols-15 grid-rows-15 h-full w-full rounded-lg shadow-inner overflow-hidden">
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
    const offsets = [
        {x: 1, y: 1},
        {x: 3, y: 1},
        {x: 1, y: 3},
        {x: 3, y: 3}
    ];
    return offsets[pawnId];
  }


  if (isHome) {
     const homeTriangleCenter: Record<PlayerColor, {x: number, y: number}> = {
        red: { x: 7, y: 3.5 },
        yellow: { x: 10.5, y: 7 },
        green: { x: 7, y: 10.5 },
        blue: { x: 3.5, y: 7 },
     }
     top = (homeTriangleCenter[color].y) * cellSize;
     left = (homeTriangleCenter[color].x) * cellSize;
  } else if (position === -1) {
    const yardBases: Record<PlayerColor, {x: number, y: number}> = {
        red: { x: 0, y: 0 },
        yellow: { x: 9, y: 0 },
        blue: { x: 0, y: 9 },
        green: { x: 9, y: 9 },
    }
    const base = yardBases[color];
    const yardPos = getYardPosition(id);
    
    top = (base.y + yardPos.y + 0.5) * cellSize;
    left = (base.x + yardPos.x + 0.5) * cellSize;
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
