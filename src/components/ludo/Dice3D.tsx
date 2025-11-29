
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import './Dice3D.css';

const DiceDot = () => <span className="dot" />;

const DiceFace = ({ face, colorClass }: { face: number, colorClass: string }) => {
  return (
    <div className={cn("dice-face", `face-${face}`, colorClass)}>
      {Array(face).fill(0).map((_, i) => <DiceDot key={i} />)}
    </div>
  );
};

const faceColors: Record<PlayerColor, string> = {
  red: 'bg-gradient-to-br from-red-400 to-red-600',
  green: 'bg-gradient-to-br from-green-400 to-green-600',
  yellow: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
  blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
};

const rotations: Record<number, { x: number, y: number }> = {
    1: { x: 0, y: 0 },
    2: { x: 90, y: 0 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    5: { x: -90, y: 0 },
    6: { x: 180, y: 0 },
};

type Dice3DProps = {
  rolling: boolean;
  onRollStart: () => void;
  onRollEnd: (value: number) => void;
  color: PlayerColor;
  duration: number;
  isHumanTurn: boolean;
  diceValue: number | null;
  playerName: string;
};

export function Dice3D({ rolling, onRollStart, onRollEnd, color, duration, isHumanTurn, diceValue, playerName }: Dice3DProps) {
    const [isClient, setIsClient] = useState(false);
    const controls = useAnimation();
    const isAnimatingRef = useRef(false);
    const [finalValue, setFinalValue] = useState(diceValue);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleRoll = async () => {
        if (isAnimatingRef.current || !isHumanTurn || rolling) return;
        onRollStart(); 
    };
    
    useEffect(() => {
        if (rolling && !isAnimatingRef.current) {
            isAnimatingRef.current = true;
            
            const newFinalValue = Math.floor(Math.random() * 6) + 1;
            setFinalValue(newFinalValue);
            
            controls.start({
                rotateX: [null, Math.random() * 1440 - 720, Math.random() * 1440 - 720, rotations[newFinalValue].x],
                rotateY: [null, Math.random() * 1440 - 720, Math.random() * 1440 - 720, rotations[newFinalValue].y],
                transition: { duration: duration / 1000, ease: "circOut" },
            }).then(() => {
                isAnimatingRef.current = false;
                onRollEnd(newFinalValue);
            });
        }
    }, [rolling, controls, duration, onRollEnd]);
    
    useEffect(() => {
        if (!rolling && diceValue !== null) {
            setFinalValue(diceValue);
            controls.set({
                rotateX: rotations[diceValue].x,
                rotateY: rotations[diceValue].y,
            });
        }
    }, [diceValue, rolling, controls]);


    if (!isClient) {
        return <div className="w-16 h-16 md:w-24 md:h-24" />;
    }

    const turnTextColor: Record<PlayerColor, string> = {
        red: 'text-red-500',
        green: 'text-green-500',
        yellow: 'text-yellow-400',
        blue: 'text-blue-500',
    };
    const currentTurnColorClass = turnTextColor[color];
    
    const showRollResult = !rolling && diceValue !== null;

    return (
        <div className="flex flex-col items-center justify-center gap-1 h-full">
            <div className="dice-container">
                <motion.div 
                    className="dice" 
                    animate={controls}
                    onClick={handleRoll}
                    style={{ cursor: isHumanTurn && !rolling ? 'pointer' : 'default' }}
                >
                    {[1, 2, 3, 4, 5, 6].map(face => (
                        <DiceFace key={face} face={face} colorClass={faceColors[color]} />
                    ))}
                </motion.div>
            </div>
            <div className="text-center h-6 flex items-end justify-center">
                {isHumanTurn && !rolling && diceValue === null && (
                <button
                    onClick={handleRoll}
                    className={cn("font-bold text-xs md:text-sm animate-pulse", currentTurnColorClass)}
                >
                    Click to Roll
                </button>
                )}
                {showRollResult && (
                <p className={cn("text-xs md:text-sm font-semibold capitalize", currentTurnColorClass)}>
                    {playerName} Rolled: {diceValue}
                </p>
                )}
            </div>
        </div>
    );
}

    