'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Star } from 'lucide-react';
import { PlayerColor, Pawn as PawnType, HOME_YARDS, PATHS, SAFE_ZONES, START_POSITIONS } from '@/lib/ludo-constants';

const gridCellStyle = "flex items-center justify-center";

const StarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("h-5 w-5", className)}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" />
    </svg>
);


export function GameBoard({ children, playersInfo }: { children: ReactNode, playersInfo: ReactNode }) {
    const cells = Array.from({ length: 15 * 15 });
    
    const YARD_BGS: Record<PlayerColor, string> = {
        blue: 'bg-blue-500',
        yellow: 'bg-yellow-400',
        red: 'bg-red-500',
        green: 'bg-green-500',
    }

    const getCellContent = (index: number) => {
        const x = index % 15;
        const y = Math.floor(index / 15);

        // Path cells
        const isPath = Object.values(PATHS).some(path => path.includes(x + y * 15));
        const isSafe = SAFE_ZONES.includes(x + y * 15);
        const isStart = Object.values(START_POSITIONS).includes(x + y * 15);
        
        let colorForPath: PlayerColor | null = null;
        if (x === 1 && y === 6) colorForPath = 'red';
        if (x === 8 && y === 1) colorForPath = 'yellow';
        if (x === 13 && y === 8) colorForPath = 'green';
        if (x === 6 && y === 13) colorForPath = 'blue';

        if (isPath) {
            let bgColor = 'bg-white/90';
            
            // Home columns
            if (x === 7 && y > 0 && y < 6) bgColor = 'bg-yellow-400'; // Yellow home
            if (x > 8 && x < 14 && y === 7) bgColor = 'bg-green-500'; // Green home
            if (x === 7 && y > 8 && y < 14) bgColor = 'bg-blue-500'; // Blue home
            if (x > 0 && x < 6 && y === 7) bgColor = 'bg-red-500'; // Red home

            if(isStart && colorForPath) {
                bgColor = YARD_BGS[colorForPath];
            }

            return <div className={cn(gridCellStyle, bgColor, "relative h-full w-full border border-black/10")}>
              {isSafe && !isStart && <StarIcon className="text-gray-400" />}
              {isStart && colorForPath && <StarIcon className={`text-white`} />}
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
        if (x < 6 && y < 6) return renderYard('yellow'); // Top-left
        if (x > 8 && y < 6) return renderYard('green'); // Top-right
        if (x < 6 && y > 8) return renderYard('red'); // Bottom-left
        if (x > 8 && y > 8) return renderYard('blue'); // Bottom-right
        
        // Center home triangle
        if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
            return <div className="h-full w-full flex items-center justify-center overflow-hidden bg-white/90">
                <div style={{ position: 'absolute', width: '300%', height: '300%', transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', clipPath: 'polygon(100% 0, 0 100%, 0 0)', background: '#facc15' }} />
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: '50%', clipPath: 'polygon(100% 100%, 0 0, 100% 0)', background: '#22c55e' }} />
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '50%', height: '50%', clipPath: 'polygon(100% 0, 0 100%, 100% 100%)', background: '#ef4444' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '50%', height: '50%', clipPath: 'polygon(0 0, 0 100%, 100% 100%)', background: '#3b82f6' }} />
                </div>
            </div>;
        }

        return <div className="h-full w-full bg-background"></div>;
    }
  
  return (
    <div className="aspect-square w-full max-w-[70vh] mx-auto relative p-2 rounded-xl bg-black/30 shadow-2xl"
      style={{'--cell-size': 'calc(100% / 15)'} as React.CSSProperties}
    >
      <div className="grid grid-cols-15 grid-rows-15 h-full w-full rounded-lg shadow-inner overflow-hidden">
         {cells.map((_, i) => (
            <div key={i} className="relative aspect-square">
               {getCellContent(i)}
            </div>
         ))}
      </div>
       <div className="absolute inset-2 grid grid-cols-15 grid-rows-15 pointer-events-none">
          {playersInfo}
        </div>
      <div className="absolute inset-2 grid grid-cols-15 grid-rows-15 pointer-events-none">
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
        {x: 1, y: 1},
        {x: 3, y: 1},
        {x: 1, y: 3},
        {x: 3, y: 3}
    ];
    return offsets[pawnId];
  }


  if (isHome) {
     const homeOffsets: Record<PlayerColor, {t: number, l: number}> = {
        red: {t: 7, l: 5},
        green: {t: 9, l: 7},
        yellow: {t: 5, l: 7},
        blue: {t: 7, l: 9},
     }
     top = homeOffsets[color].t * cellSize;
     left = homeOffsets[color].l * cellSize;
  } else if (position === -1) {
    const base = HOME_YARDS[color][0];
    const yardPos = getYardPosition(id);
    const baseX = base%15;
    const baseY = Math.floor(base/15);
    
    top = (baseY + yardPos.y) * cellSize + cellSize * 0.25;
    left = (baseX + yardPos.x) * cellSize + cellSize * 0.25;
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
        width: `${cellSize * (isHome ? 1.5 : 0.8)}%`,
        height: `${cellSize * (isHome ? 1.5 : 0.8)}%`,
        zIndex: highlight ? 10 : 1
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
