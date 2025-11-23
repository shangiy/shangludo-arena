
"use client";

import { useState, useEffect, useRef } from 'react';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type DiceProps = {
  rolling: boolean;
  onRollStart: () => void;
  onRollEnd: (value: number) => void;
  color: PlayerColor;
  duration: number;
  isHumanTurn: boolean;
  diceValue: number | null;
  playerName: string;
};

const getTransformFromFrontFace = (face: number): string => {
    switch (face) {
        case 1: return 'rotateX(0deg) rotateY(0deg)'; // Front
        case 2: return 'rotateX(-90deg)';             // Top -> Front
        case 3: return 'rotateY(90deg)';            // Right -> Front
        case 4: return 'rotateY(-90deg)';             // Left -> Front
        case 5: return 'rotateX(90deg)';            // Bottom -> Front
        case 6: return 'rotateX(180deg)';            // Back -> Front
        default: return '';
    }
};

export function Dice3D({ rolling, onRollStart, onRollEnd, color, duration, isHumanTurn, diceValue, playerName }: DiceProps) {
    const [visualFace, setVisualFace] = useState(diceValue || 1);
    const [isClient, setIsClient] = useState(false);
    const [showRollResult, setShowRollResult] = useState(false);
    const isRollingRef = useRef(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Show roll result only when not rolling and a dice value is present for the current turn
        if (!rolling && diceValue !== null) {
          setShowRollResult(true);
        } else {
          setShowRollResult(false);
        }
      }, [rolling, diceValue]);
    
    const handleHumanRoll = () => {
        if (isRollingRef.current || !isHumanTurn) return;
        startRollingProcess();
    };

    const startRollingProcess = () => {
        if (isRollingRef.current) return;
        isRollingRef.current = true;
        onRollStart();

        const animationInterval = setInterval(() => {
            setVisualFace(Math.floor(Math.random() * 6) + 1);
        }, 100);
        
        const stopTimeout = setTimeout(() => {
            clearInterval(animationInterval);
            const finalRoll = Math.floor(Math.random() * 6) + 1;
            setVisualFace(finalRoll);
            isRollingRef.current = false;
            onRollEnd(finalRoll);
        }, duration);
    };

    useEffect(() => {
        if (rolling && !isRollingRef.current) {
            startRollingProcess();
        } else if (!rolling && diceValue) {
            setVisualFace(diceValue);
        }
    }, [rolling, diceValue]);

    if (!isClient) {
        return <div className="w-12 h-12" />; // Placeholder for SSR
    }

    const turnTextColor: Record<PlayerColor, string> = {
        red: 'text-red-500',
        green: 'text-green-500',
        yellow: 'text-yellow-400',
        blue: 'text-blue-500',
    };

    const currentTurnColorClass = turnTextColor[color];

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 perspective-500">
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    animate={{ transform: getTransformFromFrontFace(visualFace) }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={handleHumanRoll}
                    style={{ cursor: isHumanTurn && !rolling ? 'pointer' : 'default' }}
                >
                    {/* Face 1 (Front) */}
                    <div className={cn("absolute w-12 h-12 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: 'translateZ(1.5rem)' }}>
                        <span className={cn("text-2xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", currentTurnColorClass)}>1</span>
                    </div>
                    {/* Face 6 (Back) */}
                    <div className={cn("absolute w-12 h-12 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: 'rotateX(180deg) translateZ(1.5rem)' }}>
                         <span className={cn("text-2xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", currentTurnColorClass)}>6</span>
                    </div>
                    {/* Face 2 (Top) */}
                    <div className={cn("absolute w-12 h-12 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: 'rotateX(90deg) translateZ(1.5rem)' }}>
                         <span className={cn("text-2xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", currentTurnColorClass)}>2</span>
                    </div>
                    {/* Face 5 (Bottom) */}
                    <div className={cn("absolute w-12 h-12 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: 'rotateX(-90deg) translateZ(1.5rem)' }}>
                         <span className={cn("text-2xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", currentTurnColorClass)}>5</span>
                    </div>
                    {/* Face 3 (Right) */}
                    <div className={cn("absolute w-12 h-12 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: 'rotateY(-90deg) translateZ(1.5rem)' }}>
                         <span className={cn("text-2xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", currentTurnColorClass)}>3</span>
                    </div>
                    {/* Face 4 (Left) */}
                    <div className={cn("absolute w-12 h-12 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: 'rotateY(90deg) translateZ(1.5rem)' }}>
                         <span className={cn("text-2xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", currentTurnColorClass)}>4</span>
                    </div>
                </motion.div>
            </div>
            <div className="text-center h-8">
                {isHumanTurn && !rolling && diceValue === null && (
                     <button
                        onClick={handleHumanRoll}
                        className={cn("font-bold text-sm animate-pulse", currentTurnColorClass)}
                     >
                         Click to Roll
                     </button>
                )}
                 {showRollResult && (
                    <p className={cn("text-sm font-semibold capitalize", currentTurnColorClass)}>
                       {playerName} rolled: {diceValue}
                    </p>
                )}
            </div>
        </div>
    );
}
