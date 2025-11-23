
"use client";

import { useState, useEffect, useRef } from 'react';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { motion, useAnimation } from 'framer-motion';

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

const getTransformFromFace = (face: number): string => {
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

const getRandomRotation = () => {
    const x = Math.floor(Math.random() * 8) * 90;
    const y = Math.floor(Math.random() * 8) * 90;
    return `rotateX(${x}deg) rotateY(${y}deg)`;
}

const DiceDot = ({ colorClass, className }: { colorClass: string, className?: string }) => (
    <div className={cn("w-2 h-2 rounded-full", colorClass, className)} />
);

const DiceFace = ({ face, colorClass }: { face: number; colorClass: string }) => {
    const dotGrid: Record<number, string> = {
        1: "flex items-center justify-center",
        2: "flex justify-between p-1",
        3: "flex p-1",
        4: "grid grid-cols-2 grid-rows-2 gap-1 p-1",
        5: "grid grid-cols-3 grid-rows-3 gap-0.5 p-1",
        6: "grid grid-cols-2 grid-rows-3 gap-1 p-1",
    };

    const dots: Record<number, React.ReactNode[]> = {
        1: [<DiceDot key="1" colorClass={colorClass} />],
        2: [
            <DiceDot key="1" colorClass={colorClass} className="self-start" />,
            <DiceDot key="2" colorClass={colorClass} className="self-end" />,
        ],
        3: [
            <DiceDot key="1" colorClass={colorClass} className="self-start" />,
            <DiceDot key="2" colorClass={colorClass} className="self-center mx-auto" />,
            <DiceDot key="3" colorClass={colorClass} className="self-end" />,
        ],
        4: [
            <DiceDot key="1" colorClass={colorClass} />,
            <DiceDot key="2" colorClass={colorClass} />,
            <DiceDot key="3" colorClass={colorClass} />,
            <DiceDot key="4" colorClass={colorClass} />,
        ],
        5: [
            <DiceDot key="1" colorClass={colorClass} className="col-start-1 row-start-1" />,
            <DiceDot key="2" colorClass={colorClass} className="col-start-3 row-start-1" />,
            <DiceDot key="3" colorClass={colorClass} className="col-start-2 row-start-2" />,
            <DiceDot key="4" colorClass={colorClass} className="col-start-1 row-start-3" />,
            <DiceDot key="5" colorClass={colorClass} className="col-start-3 row-start-3" />,
        ],
        6: [
            <DiceDot key="1" colorClass={colorClass} />,
            <DiceDot key="2" colorClass={colorClass} />,
            <DiceDot key="3" colorClass={colorClass} />,
            <DiceDot key="4" colorClass={colorClass} />,
            <DiceDot key="5" colorClass={colorClass} />,
            <DiceDot key="6" colorClass={colorClass} />,
        ],
    };

    return <div className={cn("w-full h-full", dotGrid[face])}>{dots[face]}</div>;
};


export function Dice3D({ rolling, onRollStart, onRollEnd, color, duration, isHumanTurn, diceValue, playerName }: DiceProps) {
    const [visualFace, setVisualFace] = useState(diceValue || 1);
    const [isClient, setIsClient] = useState(false);
    const [showRollResult, setShowRollResult] = useState(false);
    const isRollingRef = useRef(false);
    const controls = useAnimation();
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
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

    const startRollingProcess = async () => {
        if (isRollingRef.current) return;
        isRollingRef.current = true;
        onRollStart();

        const rollStartTime = Date.now();
        const finalRoll = Math.floor(Math.random() * 6) + 1;

        const rollAnimation = async () => {
            if (Date.now() - rollStartTime < duration) {
                await controls.start({
                    transform: getRandomRotation(),
                    transition: { type: 'spring', stiffness: 200, damping: 15 }
                });
                requestAnimationFrame(rollAnimation);
            } else {
                await controls.start({
                    transform: getTransformFromFace(finalRoll),
                    transition: { type: 'spring', stiffness: 300, damping: 20 }
                });
                setVisualFace(finalRoll);
                isRollingRef.current = false;
                onRollEnd(finalRoll);
            }
        };
        
        rollAnimation();
    };

    useEffect(() => {
        if (rolling && !isRollingRef.current) {
            startRollingProcess();
        } else if (!rolling && diceValue) {
            setVisualFace(diceValue);
            controls.start({
                transform: getTransformFromFace(diceValue),
                transition: { duration: 0.3 }
            });
        }
    }, [rolling]);

     useEffect(() => {
        if (diceValue) {
            setVisualFace(diceValue);
            controls.set({ transform: getTransformFromFace(diceValue) });
        }
    }, [diceValue, controls]);

    if (!isClient) {
        return <div className="w-12 h-12" />; // Placeholder for SSR
    }

    const turnTextColor: Record<PlayerColor, string> = {
        red: 'text-red-500',
        green: 'text-green-500',
        yellow: 'text-yellow-400',
        blue: 'text-blue-500',
    };
    
    const dotColor: Record<PlayerColor, string> = {
        red: 'bg-red-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-400',
        blue: 'bg-blue-500',
    };

    const currentTurnColorClass = turnTextColor[color];
    const currentDotColorClass = dotColor[color];
    const faceStyle = "absolute w-12 h-12 border border-black/50 flex items-center justify-center bg-white p-1 rounded-lg";

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 perspective-500">
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    animate={controls}
                    onClick={handleHumanRoll}
                    style={{ cursor: isHumanTurn && !rolling ? 'pointer' : 'default' }}
                >
                    {/* Face 1 (Front) */}
                    <div className={cn(faceStyle)} style={{ transform: 'translateZ(1.5rem)' }}>
                        <DiceFace face={1} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 6 (Back) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateX(180deg) translateZ(1.5rem)' }}>
                         <DiceFace face={6} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 5 (Top) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateX(90deg) translateZ(1.5rem)' }}>
                         <DiceFace face={5} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 2 (Bottom) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateX(-90deg) translateZ(1.5rem)' }}>
                         <DiceFace face={2} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 4 (Right from perspective) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateY(-90deg) translateZ(1.5rem)' }}>
                         <DiceFace face={4} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 3 (Left from perspective) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateY(90deg) translateZ(1.5rem)' }}>
                         <DiceFace face={3} colorClass={currentDotColorClass} />
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

    
    