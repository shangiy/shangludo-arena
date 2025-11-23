
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
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
};

const rotations: Record<number, { x: number, y: number }> = {
    1: { x: 0, y: 0 },
    2: { x: -90, y: 0 },
    3: { x: 0, y: 90 },
    4: { x: 0, y: -90 },
    5: { x: 90, y: 0 },
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

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleRoll = async () => {
        if (isAnimatingRef.current || !isHumanTurn) return;
        onRollStart(); 
    };

    useEffect(() => {
        if (rolling && diceValue && !isAnimatingRef.current) {
            isAnimatingRef.current = true;
            
            controls.start({
                rotateX: [null, Math.random() * 1080 - 540, Math.random() * 1080 - 540, rotations[diceValue].x],
                rotateY: [null, Math.random() * 1080 - 540, Math.random() * 1080 - 540, rotations[diceValue].y],
                transition: { duration: duration / 1000, ease: "circOut" },
            }).then(() => {
                isAnimatingRef.current = false;
                onRollEnd(diceValue);
            });
        }
    }, [rolling, diceValue, controls, duration, onRollEnd]);
    
    useEffect(() => {
        if (!rolling && diceValue) {
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
        <div className="flex flex-col items-center justify-center gap-2 h-full">
            <div className="dice-container">
                <motion.div 
                    className="dice" 
                    animate={controls}
                    onClick={handleRoll}
                    style={{ cursor: isHumanTurn && !isAnimatingRef.current ? 'pointer' : 'default' }}
                >
                    {[1, 2, 3, 4, 5, 6].map(face => (
                        <DiceFace key={face} face={face} colorClass={faceColors[color]} />
                    ))}
                </motion.div>
            </div>
            <div className="text-center h-8 flex items-center justify-center">
                {isHumanTurn && !rolling && diceValue === null && (
                <button
                    onClick={handleRoll}
                    className={cn("font-bold text-sm animate-pulse", currentTurnColorClass)}
                >
                    Click to Roll
                </button>
                )}
                {showRollResult && (
                <p className={cn("text-sm font-semibold capitalize", currentTurnColorClass)}>
                    {playerName} Rolled: {diceValue}
                </p>
                )}
            </div>
        </div>
    );
}
