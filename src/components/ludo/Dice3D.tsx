'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { PlayerColor } from '@/lib/ludo-constants';

interface Dice3DProps {
  value: number | null;
  rolling: boolean;
  duration: number; // ms
  color: PlayerColor;
  onClick: () => void;
  isHumanTurn: boolean;
}

const DICE_FACE_COLORS: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-500',
};

const turnColorClasses: Record<PlayerColor, string> = {
    red: 'shadow-red-500/50',
    green: 'shadow-green-500/50',
    yellow: 'shadow-yellow-400/50',
    blue: 'shadow-blue-500/50',
};

export function Dice3D({ value, rolling, duration, color, onClick, isHumanTurn }: Dice3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

  const faceRotations: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 0 },
    2: { x: -90, y: 0 },
    3: { x: 0, y: 90 },
    4: { x: 0, y: -90 },
    5: { x: 90, y: 0 },
    6: { x: 180, y: 0 },
  };

  useEffect(() => {
    if (rolling && value) {
      const target = faceRotations[value];
      setRotation({
        x: target.x + 720 + Math.random() * 180,
        y: target.y + 720 + Math.random() * 180,
        z: 360 * 3,
      });
    }
  }, [rolling, value]);

  return (
    <div className="flex flex-col items-center gap-2">
        <div 
            className={cn(
                "w-24 h-24",
                isHumanTurn && !rolling && 'cursor-pointer animate-pulse',
                isHumanTurn && !rolling && turnColorClasses[color]
            )}
            style={{ perspective: '1000px' }}
            onClick={onClick}
        >
        <motion.div
            className="relative w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateX: 0, rotateY: 0, rotateZ: 0 }}
            animate={rolling ? { rotateX: rotation.x, rotateY: rotation.y, rotateZ: rotation.z } : {}}
            transition={{ duration: duration / 1000, ease: 'easeInOut' }}
        >
            <DiceFace number={1} color={color} style={{ transform: 'rotateY(0deg) translateZ(3rem)' }} />
            <DiceFace number={6} color={color} style={{ transform: 'rotateX(180deg) translateZ(3rem)' }} />
            <DiceFace number={5} color={color} style={{ transform: 'rotateX(90deg) translateZ(3rem)' }} />
            <DiceFace number={2} color={color} style={{ transform: 'rotateX(-90deg) translateZ(3rem)' }} />
            <DiceFace number={3} color={color} style={{ transform: 'rotateY(90deg) translateZ(3rem)' }} />
            <DiceFace number={4} color={color} style={{ transform: 'rotateY(-90deg) translateZ(3rem)' }} />
        </motion.div>
        </div>
         <p id="rolled-value" className="text-md font-bold text-gray-800 h-6 capitalize">
            {isHumanTurn && !rolling && value === null && "Click to roll!"}
            {value !== null && !rolling ? `${color} rolled: ${value}` : ''}
        </p>
    </div>
  );
}

function DiceFace({ number, color, style }: { number: number; color: PlayerColor, style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'absolute w-24 h-24 rounded-lg flex items-center justify-center',
        DICE_FACE_COLORS[color]
      )}
      style={style}
    >
      <DiceDots number={number} />
    </div>
  );
}

function DiceDots({ number }: { number: number }) {
  const pip = 'w-3 h-3 bg-white rounded-full absolute';

  const positions: Record<number, string[]> = {
    1: ['top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'],
    2: ['top-4 left-4', 'bottom-4 right-4'],
    3: ['top-4 left-4', 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'bottom-4 right-4'],
    4: ['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'],
    5: [
      'top-4 left-4',
      'top-4 right-4',
      'bottom-4 left-4',
      'bottom-4 right-4',
      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    ],
    6: [
      'top-4 left-4',
      'top-4 right-4',
      'top-1/2 left-4 -translate-y-1/2',
      'top-1/2 right-4 -translate-y-1/2',
      'bottom-4 left-4',
      'bottom-4 right-4',
    ],
  };

  return (
    <div className="relative w-full h-full p-2">
      {(positions[number] || []).map((pos, i) => (
        <div key={i} className={`${pip} ${pos}`} />
      ))}
    </div>
  );
}
