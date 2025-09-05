'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Star } from 'lucide-react';
import { PlayerColor, Pawn as PawnType, HOME_YARDS, PATHS, SAFE_ZONES } from '@/lib/ludo-constants';

const gridCellStyle = "flex items-center justify-center border border-black/10";
const pathCellStyle = (color: string) => `bg-${color}-200`;

export function GameBoard({ children }: { children: ReactNode }) {
    const cells = Array.from({ length: 15 * 15 });

    const getCellContent = (index: number) => {
        const x = index % 15;
        const y = Math.floor(index / 15);

        // Path cells
        const isPath = Object.values(PATHS).some(path => path.includes(x + y * 15));
        const isSafe = SAFE_ZONES.includes(x + y * 15);

        if (isPath) {
            let bgColor = 'bg-gray-100';
            if (x > 0 && x < 6 && y > 5 && y < 9) bgColor = 'bg-yellow-200'; // Yellow path
            if (x > 5 && x < 9 && y > 0 && y < 6) bgColor = 'bg-blue-200'; // Blue path
            if (x > 8 && x < 14 && y > 5 && y < 9) bgColor = 'bg-green-200'; // Green path
            if (x > 5 && x < 9 && y > 8 && y < 14) bgColor = 'bg-red-200'; // Red path
            
            if (x === 7 && y > 0 && y < 6) bgColor = 'bg-blue-300'; // Blue home column
            if (x > 8 && x < 14 && y === 7) bgColor = 'bg-green-300'; // Green home column
            if (x === 7 && y > 8 && y < 14) bgColor = 'bg-red-300'; // Red home column
            if (x > 0 && x < 6 && y === 7) bgColor = 'bg-yellow-300'; // Yellow home column

            // Start positions
            if (x===1 && y===6) bgColor = 'bg-blue-300';
            if (x===6 && y===13) bgColor = 'bg-red-300';
            if (x===13 && y===8) bgColor = 'bg-green-300';
            if (x===8 && y===1) bgColor = 'bg-yellow-300';


            return <div className={cn(gridCellStyle, bgColor, "relative h-full w-full")}>
              {isSafe && <Star className="h-4 w-4 text-black/50" fill="currentColor"/>}
            </div>;
        }

        // Home yards
        if (x < 6 && y < 6) return <div className={cn(gridCellStyle, 'bg-blue-400 h-full w-full')}></div>;
        if (x > 8 && y < 6) return <div className={cn(gridCellStyle, 'bg-yellow-400 h-full w-full')}></div>;
        if (x < 6 && y > 8) return <div className={cn(gridCellStyle, 'bg-red-400 h-full w-full')}></div>;
        if (x > 8 && y > 8) return <div className={cn(gridCellStyle, 'bg-green-400 h-full w-full')}></div>;
        
        // Center home triangle
        if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
            return <div className="h-full w-full bg-background flex items-center justify-center">
              <div
                style={{
                    width: 0,
                    height: 0,
                    borderLeft: '40px solid transparent',
                    borderRight: '40px solid transparent',
                    borderBottom: '40px solid #60a5fa', // blue
                    transform: 'translateY(-20px)',
                    position: 'absolute'
                }}
              />
              <div
                style={{
                    width: 0,
                    height: 0,
                    borderTop: '40px solid #f87171', // red
                    borderLeft: '40px solid transparent',
                    borderRight: '40px solid transparent',
                    transform: 'translateY(20px)',
                    position: 'absolute'
                }}
              />
               <div
                style={{
                    width: 0,
                    height: 0,
                    borderTop: '40px solid transparent',
                    borderBottom: '40px solid transparent',
                    borderLeft: '40px solid #facc15', // yellow
                    transform: 'translateX(-20px)',
                    position: 'absolute'
                }}
              />
               <div
                style={{
                    width: 0,
                    height: 0,
                    borderTop: '40px solid transparent',
                    borderBottom: '40px solid transparent',
                    borderRight: '40px solid #4ade80', // green
                    transform: 'translateX(20px)',
                    position: 'absolute'
                }}
              />
            </div>
        }

        return <div className="bg-background h-full w-full"></div>;
    }
  
  return (
    <div className="aspect-square w-full max-w-[70vh] mx-auto relative">
      <div className="grid grid-cols-15 grid-rows-15 h-full w-full bg-white p-2 rounded-lg shadow-lg border">
         {cells.map((_, i) => (
            <div key={i} className="relative aspect-square">
               {getCellContent(i)}
            </div>
         ))}
      </div>
      <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 p-2 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

const PAWN_COLORS: Record<PlayerColor, string> = {
  red: 'bg-red-500 border-red-700',
  green: 'bg-green-500 border-green-700',
  yellow: 'bg-yellow-500 border-yellow-700',
  blue: 'bg-blue-500 border-blue-700',
};

interface PawnProps extends PawnType {
  onPawnClick: (pawn: PawnType) => void;
  highlight: boolean;
}

export function Pawn({ id, color, position, isHome, onPawnClick, highlight }: PawnProps) {
  const cellSize = 100/15; // percentage
  let top, left;

  if (isHome) {
    // Position pawns in the center when they are home
    const homeOffsets: Record<PlayerColor, {t: number, l: number}> = {
      blue: {t: 6.5, l: 7},
      green: {t: 7, l: 7.5},
      red: {t: 7.5, l: 7},
      yellow: {t: 7, l: 6.5},
    }
    top = homeOffsets[color].t * cellSize;
    left = homeOffsets[color].l * cellSize;
  } else if (position === -1) {
    // Position in home yard
    const yardPos = HOME_YARDS[color][id];
    top = yardPos.y * cellSize;
    left = yardPos.x * cellSize;
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
      }}
      className="p-1 pointer-events-auto"
      onClick={() => onPawnClick({ id, color, position, isHome })}
    >
      <div
        className={cn(
          'w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs border-2 shadow-md cursor-pointer transition-all',
          PAWN_COLORS[color],
          highlight && 'ring-4 ring-offset-2 ring-accent scale-110'
        )}
      >
        {isHome ? <Home className="h-4 w-4" /> : ""}
      </div>
    </motion.div>
  );
}
