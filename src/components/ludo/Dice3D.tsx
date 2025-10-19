"use client";

import { useState, useEffect } from 'react';
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

const DICE_FACES: { [key: number]: number[] } = {
    1: [5, 2, 4, 3],
    2: [1, 6, 4, 3],
    3: [1, 6, 2, 5],
    4: [1, 6, 5, 2],
    5: [1, 6, 3, 4],
    6: [2, 5, 4, 3],
};

const DICE_FACE_TRANSFORMS: { [key: number]: string } = {
    1: 'rotateX(-90deg)', // top
    2: 'rotateY(90deg)', // right
    3: 'rotateY(-90deg)', // left
    4: 'rotateX(90deg)', // bottom
    5: 'rotateY(180deg)', // back
    6: 'rotateY(0deg)', // front
};


export function Dice3D({ rolling, onRollStart, onRollEnd, color, duration, isHumanTurn, diceValue }: DiceProps) {
    const [finalFace, setFinalFace] = useState(1);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleRoll = () => {
        if (rolling || !isHumanTurn) return;
        onRollStart();

        const roll = Math.floor(Math.random() * 6) + 1;
        
        // Start animation
        let faceIndex = 0;
        const animationInterval = 100;
        const totalSteps = duration / animationInterval;
        let currentStep = 0;

        const interval = setInterval(() => {
            const faces = DICE_FACES[finalFace] || DICE_FACES[1];
            setFinalFace(faces[faceIndex]);
            faceIndex = (faceIndex + 1) % faces.length;
            currentStep++;

            if (currentStep >= totalSteps) {
                clearInterval(interval);
                setFinalFace(roll);
                setTimeout(() => onRollEnd(roll), 500); 
            }
        }, animationInterval);
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
                    animate={{ transform: DICE_FACE_TRANSFORMS[finalFace] }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={handleRoll}
                    style={{ cursor: isHumanTurn && !rolling ? 'pointer' : 'default' }}
                >
                    {Object.keys(DICE_FACE_TRANSFORMS).map(face => (
                        <div
                            key={face}
                            className={cn(
                                "absolute w-24 h-24 border border-black/50 flex items-center justify-center bg-white"
                            )}
                            style={{ transform: `${DICE_FACE_TRANSFORMS[Number(face)]} translateZ(3rem)` }}
                        >
                            <span className={cn("text-5xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]", turnTextColor[color])}>{face}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
            <div className="text-center h-10">
                {isHumanTurn && !rolling && diceValue === null && (
                     <button
                        onClick={handleRoll}
                        className={cn("font-bold text-lg animate-pulse", turnTextColor[color])}
                     >
                         Roll Dice
                     </button>
                )}
                 {diceValue !== null && (
                    <p className="text-lg font-semibold">
                       <span className={cn("capitalize", turnTextColor[color])}>{color}</span> rolled: {diceValue}
                    </p>
                )}
            </div>
        </div>
    );
}
