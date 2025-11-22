
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
};

// Represents the face on top and the faces around it (front, right, back, left)
const DICE_FACES_GRAPH: { [key: number]: { top: number, front: number, right: number, back: number, left: number } } = {
    1: { top: 1, front: 2, right: 3, back: 5, left: 4 }, // Top 1 -> front is 2
    2: { top: 2, front: 6, right: 3, back: 1, left: 4 }, // Top 2 -> front is 6
    3: { top: 3, front: 2, right: 6, back: 5, left: 1 }, // Top 3 -> front is 2
    4: { top: 4, front: 2, right: 1, back: 5, left: 6 }, // Top 4 -> front is 2
    5: { top: 5, front: 1, right: 3, back: 6, left: 4 }, // Top 5 -> front is 1
    6: { top: 6, front: 5, right: 3, back: 2, left: 4 }, // Top 6 -> front is 5
};

const getTransformFromTopFace = (face: number): string => {
    switch (face) {
        case 1: return 'rotateX(0deg) rotateY(0deg)';
        case 2: return 'rotateX(-90deg)';
        case 3: return 'rotateY(90deg)';
        case 4: return 'rotateY(-90deg)';
        case 5: return 'rotateX(90deg)';
        case 6: return 'rotateX(180deg)';
        default: return '';
    }
};

export function Dice3D({ rolling, onRollStart, onRollEnd, color, duration, isHumanTurn, diceValue }: DiceProps) {
    const [visualFace, setVisualFace] = useState(diceValue || 1);
    const [isClient, setIsClient] = useState(false);
    const [finalValue, setFinalValue] = useState<number | null>(diceValue);
    const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        // Cleanup previous animations if a new roll starts
        if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
        if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

        if (rolling) {
            setFinalValue(null);
            const roll = Math.floor(Math.random() * 6) + 1;
            
            // Start a quick, random-looking spin animation
            animationIntervalRef.current = setInterval(() => {
                const randomFace = Math.floor(Math.random() * 6) + 1;
                setVisualFace(randomFace);
            }, 100);

            // Set a timeout to stop the animation and show the final result
            stopTimeoutRef.current = setTimeout(() => {
                if (animationIntervalRef.current) {
                    clearInterval(animationIntervalRef.current);
                }
                setVisualFace(roll);
                setFinalValue(roll);
                // Call the onRollEnd callback after a short delay to let the final face show
                setTimeout(() => onRollEnd(roll), 500); 
            }, duration);

        } else {
            // If not rolling, ensure we show the correct diceValue or default to 1
            const faceToShow = diceValue !== null ? diceValue : 1;
            setVisualFace(faceToShow);
            setFinalValue(diceValue);
        }

        // Cleanup function for when the component unmounts or dependencies change
        return () => {
            if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
            if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
        };
    }, [rolling, duration, diceValue, onRollEnd]);
    
    const handleHumanRoll = () => {
        if (rolling || !isHumanTurn) return;
        onRollStart();
    };

    if (!isClient) {
        return <div className="w-24 h-24" />; // Placeholder for SSR
    }

    const turnTextColor: Record<PlayerColor, string> = {
        red: 'text-red-500',
        green: 'text-green-500',
        yellow: 'text-yellow-400',
        blue: 'text-blue-500',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-24 h-24 perspective-500">
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    animate={{ transform: getTransformFromTopFace(visualFace) }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={handleHumanRoll}
                    style={{ cursor: isHumanTurn && !rolling ? 'pointer' : 'default' }}
                >
                    {/* Face 1 */}
                    <div className={cn("absolute w-24 h-24 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: getTransformFromTopFace(1) + ' translateZ(3rem)' }}>
                        <span className={cn("text-5xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", turnTextColor[color])}>1</span>
                    </div>
                    {/* Face 2 */}
                    <div className={cn("absolute w-24 h-24 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: getTransformFromTopFace(2) + ' translateZ(3rem)' }}>
                         <span className={cn("text-5xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", turnTextColor[color])}>2</span>
                    </div>
                    {/* Face 3 */}
                    <div className={cn("absolute w-24 h-24 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: getTransformFromTopFace(3) + ' translateZ(3rem)' }}>
                         <span className={cn("text-5xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", turnTextColor[color])}>3</span>
                    </div>
                    {/* Face 4 */}
                    <div className={cn("absolute w-24 h-24 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: getTransformFromTopFace(4) + ' translateZ(3rem)' }}>
                         <span className={cn("text-5xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", turnTextColor[color])}>4</span>
                    </div>
                    {/* Face 5 */}
                    <div className={cn("absolute w-24 h-24 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: getTransformFromTopFace(5) + ' translateZ(3rem)' }}>
                         <span className={cn("text-5xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", turnTextColor[color])}>5</span>
                    </div>
                    {/* Face 6 */}
                    <div className={cn("absolute w-24 h-24 border border-black/50 flex items-center justify-center bg-white")} style={{ transform: getTransformFromTopFace(6) + ' translateZ(3rem)' }}>
                         <span className={cn("text-5xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", turnTextColor[color])}>6</span>
                    </div>
                </motion.div>
            </div>
            <div className="text-center h-10">
                {isHumanTurn && !rolling && finalValue === null && (
                     <button
                        onClick={handleHumanRoll}
                        className={cn("font-bold text-lg animate-pulse", turnTextColor[color])}
                     >
                         Click to Roll
                     </button>
                )}
                 {finalValue !== null && !rolling && (
                    <p className="text-lg font-semibold">
                       <span className={cn("capitalize", turnTextColor[color])}>{color}</span> rolled: {finalValue}
                    </p>
                )}
            </div>
        </div>
    );

    