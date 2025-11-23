
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
    <div className={cn("w-2 h-2 md:w-3 md:h-3 rounded-full", colorClass, className)} />
);

const DiceFace = ({ face, colorClass }: { face: number; colorClass: string }) => {
    const dotLayouts: Record<number, React.ReactNode> = {
        1: (
            <div className="flex items-center justify-center h-full">
                <DiceDot colorClass={colorClass} />
            </div>
        ),
        2: (
             <div className="flex flex-col justify-between h-full p-1.5">
                <div className="flex justify-start"><DiceDot colorClass={colorClass} /></div>
                <div className="flex justify-end"><DiceDot colorClass={colorClass} /></div>
            </div>
        ),
        3: (
            <div className="flex flex-col justify-between h-full p-1.5">
                <div className="flex justify-start"><DiceDot colorClass={colorClass} /></div>
                <div className="flex justify-center"><DiceDot colorClass={colorClass} /></div>
                <div className="flex justify-end"><DiceDot colorClass={colorClass} /></div>
            </div>
        ),
        4: (
            <div className="grid grid-cols-2 grid-rows-2 h-full gap-2 p-1.5">
                <DiceDot colorClass={colorClass} />
                <DiceDot colorClass={colorClass} />
                <DiceDot colorClass={colorClass} />
                <DiceDot colorClass={colorClass} />
            </div>
        ),
        5: (
             <div className="grid grid-cols-3 grid-rows-3 h-full p-1.5">
                <DiceDot colorClass={colorClass} className="col-start-1 row-start-1" />
                <DiceDot colorClass={colorClass} className="col-start-3 row-start-1" />
                <DiceDot colorClass={colorClass} className="col-start-2 row-start-2" />
                <DiceDot colorClass={colorClass} className="col-start-1 row-start-3" />
                <DiceDot colorClass={colorClass} className="col-start-3 row-start-3" />
            </div>
        ),
        6: (
            <div className="grid grid-cols-2 h-full gap-x-2 gap-y-1.5 p-1.5">
                <DiceDot colorClass={colorClass} />
                <DiceDot colorClass={colorClass} />
                <DiceDot colorClass={colorClass} />
                <DiceDot colorClass={colorClass} />
                <DiceDot colorClass={colorClass} />
                <DiceDot colorClass={colorClass} />
            </div>
        ),
    };

    return <div className="w-full h-full">{dotLayouts[face]}</div>;
};


export function Dice3D({ rolling, onRollStart, onRollEnd, color, duration, isHumanTurn, diceValue, playerName }: DiceProps) {
    const [isClient, setIsClient] = useState(false);
    const [localDiceValue, setLocalDiceValue] = useState<number | null>(diceValue);
    const [isRollingInternal, setIsRollingInternal] = useState(false);
    const isRollingRef = useRef(false);
    const controls = useAnimation();
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const handleHumanRoll = () => {
        if (isRollingRef.current || !isHumanTurn) return;
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        startRollingProcess(finalRoll);
    };

    const startRollingProcess = async (finalRoll: number) => {
        if (isRollingRef.current) return;
        isRollingRef.current = true;
        setIsRollingInternal(true);
        setLocalDiceValue(null);
        onRollStart();

        const rollStartTime = Date.now();
        
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
                setLocalDiceValue(finalRoll);
                setIsRollingInternal(false);
                isRollingRef.current = false;
                onRollEnd(finalRoll);
            }
        };
        
        rollAnimation();
    };

    useEffect(() => {
        if (rolling && !isRollingRef.current) {
            const finalRoll = Math.floor(Math.random() * 6) + 1;
            startRollingProcess(finalRoll);
        } else if (!rolling && isRollingRef.current) {
            isRollingRef.current = false;
            setIsRollingInternal(false);
        }
    }, [rolling]);

     useEffect(() => {
        if (diceValue) {
            setLocalDiceValue(diceValue);
            controls.start({
                transform: getTransformFromFace(diceValue),
                transition: { type: "spring", stiffness: 300, damping: 20 }
            });
        } else {
             controls.set({ transform: getTransformFromFace(1) });
             setLocalDiceValue(null);
        }
    }, [diceValue, controls]);

    if (!isClient) {
        return <div className="w-16 h-16" />; // Placeholder for SSR
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
    const faceStyle = "absolute w-12 h-12 md:w-16 md:h-16 border border-black/50 flex items-center justify-center bg-white rounded-lg";
    const diceSize = 'w-12 h-12 md:w-16 md:h-16';
    const transformZ = '2rem';
    const mobileTransformZ = '1.5rem';

    const showRollResult = !isRollingInternal && localDiceValue !== null;

    return (
        <div className="flex flex-col items-center justify-center gap-2 h-full">
            <div className={cn("perspective-500", diceSize)}>
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    animate={controls}
                    onClick={handleHumanRoll}
                    style={{ cursor: isHumanTurn && !isRollingInternal ? 'pointer' : 'default' }}
                >
                    {/* Face 1 (Front) */}
                    <div className={cn(faceStyle)} style={{ transform: 'translateZ(var(--tz))' }}>
                        <DiceFace face={1} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 2 (Bottom) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateX(-90deg) translateZ(var(--tz))' }}>
                         <DiceFace face={2} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 3 (Left) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateY(90deg) translateZ(var(--tz))' }}>
                         <DiceFace face={3} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 4 (Right) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateY(-90deg) translateZ(var(--tz))' }}>
                         <DiceFace face={4} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 5 (Top) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateX(90deg) translateZ(var(--tz))' }}>
                         <DiceFace face={5} colorClass={currentDotColorClass} />
                    </div>
                    {/* Face 6 (Back) */}
                    <div className={cn(faceStyle)} style={{ transform: 'rotateX(180deg) translateZ(var(--tz))' }}>
                         <DiceFace face={6} colorClass={currentDotColorClass} />
                    </div>
                </motion.div>
            </div>
            <div className="text-center h-8 flex items-center justify-center">
                {isHumanTurn && !isRollingInternal && localDiceValue === null && (
                     <button
                        onClick={handleHumanRoll}
                        className={cn("font-bold text-sm animate-pulse", currentTurnColorClass)}
                     >
                         Click to Roll
                     </button>
                )}
                 {showRollResult && (
                    <p className={cn("text-sm font-semibold capitalize", currentTurnColorClass)}>
                       {playerName} Rolled: {localDiceValue}
                    </p>
                )}
            </div>
            <style jsx>{`
                .perspective-500 {
                    perspective: 500px;
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                    --tz: ${mobileTransformZ};
                }
                @media (min-width: 768px) {
                    .preserve-3d {
                        --tz: ${transformZ};
                    }
                }
            `}</style>
        </div>
    );
}
