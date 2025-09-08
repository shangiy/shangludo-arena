'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PlayerColor, Pawn as PawnType, HOME_YARDS, PATHS, SAFE_ZONES, START_POSITIONS } from '@/lib/ludo-constants';
import { HomeIcon } from '../icons/HomeIcon';
import { StarIcon } from '../icons/StarIcon';

const gridCellStyle = "flex items-center justify-center";

export function GameBoard({ children, playersInfo }: { children: ReactNode, playersInfo: ReactNode }) {
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
            let bgColor = 'bg-white/90';
            let starColor: PlayerColor | 'white' = 'white';
            
            // Home columns
            if(colorForPath) {
                bgColor = HOME_RUN_BGS[colorForPath]
                starColor = colorForPath;
            }

            if(isStart) {
                if (x === 1 && y === 6) { bgColor = YARD_BGS['red']; starColor = 'red'; }
                if (x === 8 && y === 1) { bgColor = YARD_BGS['yellow']; starColor = 'yellow'; }
                if (x === 13 && y === 8) { bgColor = YARD_BGS['green']; starColor = 'green'; }
                if (x === 6 && y === 13) { bgColor = YARD_BGS['blue']; starColor = 'blue'; }
            }

            return <div className={cn(gridCellStyle, bgColor, "relative h-full w-full border border-black/10")}>
              {isSafe && <StarIcon color={isStart ? 'white' : colorForPath || 'gray'} />}
            </div>;
        }

        // Home yards
        const renderYard = (color: PlayerColor) => (
            <div className={cn('h-full w-full p-1 relative', YARD_BGS[color])}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="h-full w-full rounded-md relative bg-black/10 shadow-inner">
                     <div className="absolute inset-2.5 rounded-lg bg-white/20 grid grid-cols-2 grid-rows-2 gap-2 p-2">
                        <div className="rounded-full bg-black/10 shadow-inner"></div>
                        <div className="rounded-full bg-black/10 shadow-inner"></div>
                        <div className="rounded-full bg-black/10 shadow-inner"></div>
                        <div className="rounded-full bg-black/10 shadow-inner"></div>
                     </div>
                </div>
            </div>
        );
        if (x < 6 && y < 6) return renderYard('blue'); // Top-left is blue in new design
        if (x > 8 && y < 6) return renderYard('yellow'); // Top-right
        if (x < 6 && y > 8) return renderYard('red'); // Bottom-left
        if (x > 8 && y > 8) return renderYard('green'); // Bottom-right
        
        // Center home triangle
        if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
            return <div className="h-full w-full flex items-center justify-center overflow-hidden bg-white/90 relative">
                 <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                    <polygon points="0,0 100,0 50,50" className="fill-yellow-400" /> 
                    <polygon points="100,0 100,100 50,50" className="fill-green-500" /> 
                    <polygon points="0,100 100,100 50,50" className="fill-blue-500" />
                    <polygon points="0,0 0,100 50,50" className="fill-red-500" />

                    {/* Arrows */}
                    <polygon points="50,15 60,35 40,35" className="fill-yellow-600" />
                    <polygon points="85,50 65,60 65,40" className="fill-green-600" />
                    <polygon points="50,85 40,65 60,65" className="fill-blue-600" />
                    <polygon points="15,50 35,40 35,60" className="fill-red-600" />
                </svg>
            </div>;
        }

        return <div className="h-full w-full bg-transparent"></div>;
    }
  
  return (
    <div className="aspect-square w-full max-w-[70vh] mx-auto relative p-2 rounded-xl bg-black/30 shadow-2xl"
      style={{'--cell-size': 'calc(100% / 15)'} as React.CSSProperties}
    >
      <div className="grid grid-cols-15 grid-rows-15 h-full w-full rounded-lg shadow-inner overflow-hidden border-2 border-black/20">
         {cells.map((_, i) => (
            <div key={i} className="relative aspect-square">
               {getCellContent(i)}
            </div>
         ))}
      </div>
       <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 pointer-events-none">
          {playersInfo}
        </div>
      <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

const PAWN_COLORS: Record<PlayerColor, {bg: string, border:string}> = {
  red: { bg: 'bg-red-500', border: 'border-red-800' },
  green: { bg: 'bg-green-500', border: 'border-green-800' },
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-600' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-800' },
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
        {x: 1.25, y: 1.25},
        {x: 3.25, y: 1.25},
        {x: 1.25, y: 3.25},
        {x: 3.25, y: 3.25}
    ];
    return offsets[pawnId];
  }


  if (isHome) {
     const homeYards: Record<PlayerColor, {x: number, y: number}> = {
        red: { x: 3.5, y: 11.5 },
        green: { x: 11.5, y: 11.5 },
        yellow: { x: 11.5, y: 3.5 },
        blue: { x: 3.5, y: 3.5 },
     }
     top = (homeYards[color].y) * cellSize;
     left = (homeYards[color].x) * cellSize;
  } else if (position === -1) {
    const base = HOME_YARDS[color][0];
    const yardPos = getYardPosition(id);
    const baseX = base%15;
    const baseY = Math.floor(base/15);
    
    top = (baseY + yardPos.y) * cellSize;
    left = (baseX + yardPos.x) * cellSize;
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
