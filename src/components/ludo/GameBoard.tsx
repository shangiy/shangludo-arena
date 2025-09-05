'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Star } from 'lucide-react';
import { PlayerColor, Pawn as PawnType, HOME_YARDS, PATHS, SAFE_ZONES } from '@/lib/ludo-constants';

const gridCellStyle = "flex items-center justify-center border border-black/10";

export function GameBoard({ children }: { children: ReactNode }) {
    const cells = Array.from({ length: 15 * 15 });

    const getCellContent = (index: number) => {
        const x = index % 15;
        const y = Math.floor(index / 15);

        // Path cells
        const isPath = Object.values(PATHS).some(path => path.includes(x + y * 15));
        const isSafe = SAFE_ZONES.includes(x + y * 15);

        if (isPath) {
            let bgColor = 'bg-white';
            
            // Home columns
            if (x === 7 && y > 0 && y < 6) bgColor = 'bg-yellow-300';
            if (x > 8 && x < 14 && y === 7) bgColor = 'bg-green-300';
            if (x === 7 && y > 8 && y < 14) bgColor = 'bg-blue-300';
            if (x > 0 && x < 6 && y === 7) bgColor = 'bg-red-300';

            // Start positions
            if (x===1 && y===6) bgColor = 'bg-red-300';
            if (x===8 && y===1) bgColor = 'bg-yellow-300';
            if (x===13 && y===8) bgColor = 'bg-green-300';
            if (x===6 && y===13) bgColor = 'bg-blue-300';


            return <div className={cn(gridCellStyle, bgColor, "relative h-full w-full")}>
              {isSafe && <Star className="h-4 w-4 text-black/50" fill="currentColor"/>}
            </div>;
        }

        // Home yards
        const renderYard = (color: string) => (
            <div className={cn('h-full w-full p-1')}>
                <div className={cn('h-full w-full rounded-md relative', `bg-${color}-500`)}>
                     <div className="absolute inset-0 rounded-md bg-black/10"></div>
                     <div className="absolute inset-2 rounded bg-white/30 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                        <div className="rounded-full bg-white/50"></div>
                        <div className="rounded-full bg-white/50"></div>
                        <div className="rounded-full bg-white/50"></div>
                        <div className="rounded-full bg-white/50"></div>
                     </div>
                </div>
            </div>
        );
        if (x < 6 && y < 6) return renderYard('red');
        if (x > 8 && y < 6) return renderYard('yellow');
        if (x < 6 && y > 8) return renderYard('blue');
        if (x > 8 && y > 8) return renderYard('green');
        
        // Center home triangle
        if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
            return <div className="h-full w-full flex items-center justify-center overflow-hidden">
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300%', height: '300%' }}>
                    {/* Blue Arrow pointing down */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '33.33%', height: '33.33%', transform: 'translate(-50%, -100%)', clipPath: 'polygon(50% 100%, 0 0, 100% 0)', backgroundColor: '#3b82f6' }} />
                    {/* Green Arrow pointing left */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '33.33%', height: '33.33%', transform: 'translate(0, -50%)', clipPath: 'polygon(0 0, 100% 50%, 0 100%)', backgroundColor: '#22c55e' }} />
                    {/* Yellow Arrow pointing up */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '33.33%', height: '33.33%', transform: 'translate(-50%, 0)', clipPath: 'polygon(0 100%, 50% 0, 100% 100%)', backgroundColor: '#facc15' }} />
                    {/* Red Arrow pointing right */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '33.33%', height: '33.33%', transform: 'translate(-100%, -50%)', clipPath: 'polygon(100% 0, 0 50%, 100% 100%)', backgroundColor: '#ef4444' }} />
                </div>
            </div>;
        }

        return <div className="h-full w-full"></div>;
    }
  
  return (
    <div className="aspect-square w-full max-w-[70vh] mx-auto relative p-4 rounded-3xl bg-gray-800/50 shadow-2xl"
      style={{'--cell-size': 'calc(100% / 15)'} as React.CSSProperties}
    >
      <div className="grid grid-cols-15 grid-rows-15 h-full w-full bg-gray-200 p-2 rounded-lg shadow-inner border border-gray-900/50">
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
    const homeOffsets: Record<PlayerColor, {t: number, l: number}> = {
      blue: {t: 6.5, l: 7},
      green: {t: 7, l: 7.5},
      red: {t: 7.5, l: 7},
      yellow: {t: 7, l: 6.5},
    }
    top = homeOffsets[color].t * cellSize;
    left = homeOffsets[color].l * cellSize;
  } else if (position === -1) {
    const base = HOME_YARDS[color][0];
    const yardPos = getYardPosition(id);
    top = (Math.floor(base/15) + yardPos.y) * cellSize / 1.5;
    left = ((base%15) + yardPos.x) * cellSize / 1.5;
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
          'relative',
          PAWN_COLORS[color],
          highlight && 'ring-4 ring-offset-2 ring-accent scale-110'
        )}
      >
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-white/30 rounded-full" />
        {isHome ? <Home className="h-4 w-4" /> : ""}
      </div>
    </motion.div>
  );
}
