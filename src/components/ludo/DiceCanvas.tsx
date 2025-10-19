"use client";

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { PlayerColor } from '@/lib/ludo-constants';
import { Dice } from './Dice';

export const DICE_FACE_COLORS: Record<PlayerColor, string> = {
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#f59e0b',
    blue: '#3b82f6',
};

interface DiceCanvasProps {
    currentTurn: PlayerColor;
    nextPlayerColor: PlayerColor;
    isHumanTurn: boolean;
    rolling: boolean;
    onRollStart: () => void;
    onDiceRoll: (value: number) => void;
}

export function DiceCanvas({ currentTurn, nextPlayerColor, isHumanTurn, rolling, onRollStart, onDiceRoll }: DiceCanvasProps) {

    const diceColor = useMemo(() => {
        if (rolling) {
          return DICE_FACE_COLORS[currentTurn];
        }
        return DICE_FACE_COLORS[nextPlayerColor];
      }, [rolling, currentTurn, nextPlayerColor]);


    return (
        <Canvas shadows camera={{ position: [0, 6, 10], fov: 25 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 5]} intensity={3} castShadow />
            <Suspense fallback={null}>
                <Physics gravity={[0, -30, 0]}>
                    <Dice 
                        color={diceColor}
                        isHumanTurn={isHumanTurn}
                        rolling={rolling}
                        onRollStart={onRollStart}
                        onDiceRoll={onDiceRoll}
                    />
                </Physics>
            </Suspense>
        </Canvas>
    );
}
