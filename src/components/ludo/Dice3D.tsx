"use client";

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import { PlayerColor } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { Dices } from 'lucide-react';
import { Button } from '../ui/button';

const DICE_FACE_COLORS: Record<PlayerColor, string> = {
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#f59e0b',
    blue: '#3b82f6',
};

const turnColorClasses: Record<PlayerColor, string> = {
    red: 'turn-red',
    green: 'turn-green',
    yellow: 'turn-yellow',
    blue: 'turn-blue',
};


function Dice({ onSettled, color, isRolling }: { onSettled: (val: number) => void, color: PlayerColor, isRolling: boolean }) {
    const [ref, api] = useBox(() => ({
        mass: 1,
        position: [0, 2, 0],
        angularDamping: 0.2,
        linearDamping: 0.2,
    }));
    
    const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
    const materials = useMemo(() => {
        const faceTextures = [
            'dice-face-4.png', 'dice-face-3.png',
            'dice-face-5.png', 'dice-face-2.png',
            'dice-face-6.png', 'dice-face-1.png',
        ];

        return faceTextures.map(face => new THREE.MeshStandardMaterial({
             map: textureLoader.load(`/textures/${face}`),
        }));
    }, [textureLoader]);

    useEffect(() => {
      if (isRolling) {
        // Reset dice
        api.position.set(Math.random() * 2 - 1, 2, Math.random() * 2 - 1);
        api.velocity.set(0, 0, 0);
        api.angularVelocity.set(0, 0, 0);

        // Give random force and torque
        api.applyImpulse([(Math.random() * 2 - 1) * 3, 2, (Math.random() * 2-1) * 3], [0, 0, 0]);
        api.applyTorque([Math.random() * 10, Math.random() * 10, Math.random() * 10]);
      }
    }, [isRolling, api]);

    const lastVel = useRef(new THREE.Vector3());
    const timeoutRef = useRef<NodeJS.Timeout>();
    const settled = useRef(false);

    useFrame(() => {
        if (!ref.current) return;
        
        const checkSettled = () => {
             const up = new THREE.Vector3(0, 1, 0);
             const rotationMatrix = new THREE.Matrix4().extractRotation(ref.current.matrix);
             up.applyMatrix4(rotationMatrix);

             const faces = [
                { value: 1, normal: [0, 0, 1] },   // Front face
                { value: 6, normal: [0, 0, -1] }, // Back face
                { value: 2, normal: [0, 1, 0] },   // Top face
                { value: 5, normal: [-0, -1, 0] },// Bottom face
                { value: 3, normal: [1, 0, 0] },   // Right face
                { value: 4, normal: [-1, 0, 0] }, // Left face
             ];

            let maxDot = -Infinity;
            let result = 0;
            
            for (const f of faces) {
              const normal = new THREE.Vector3(...f.normal);
              const dot = up.dot(normal);
              if (dot > maxDot) {
                maxDot = dot;
                result = f.value;
              }
            }
           onSettled(result);
           settled.current = true;
        }

        api.velocity.subscribe((v) => {
            if (!isRolling) return;

            const vel = new THREE.Vector3(...v);
            const isMoving = vel.length() > 0.05 || lastVel.current.length() > 0.05;

            if (!isMoving && !settled.current) {
                if (!timeoutRef.current) {
                    timeoutRef.current = setTimeout(checkSettled, 100);
                }
            } else {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = undefined;
                }
            }
            lastVel.current.copy(vel);
        });

        if (isRolling) {
            settled.current = false;
        }
    });

    return (
        // @ts-ignore
        <mesh ref={ref} castShadow material={materials}>
            <boxGeometry args={[1, 1, 1]} />
        </mesh>
    );
}

function Plane(props: any) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }))
  return (
    // @ts-ignore
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#f0f2fa" />
    </mesh>
  )
}


interface Dice3DProps {
  value: number | null;
  rolling: boolean;
  duration: number;
  color: PlayerColor;
  onClick: () => void;
  isHumanTurn: boolean;
  onDiceRoll: (value: number) => void;
}

export function Dice3D({ value, rolling, duration, color, onClick, isHumanTurn, onDiceRoll }: Dice3DProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [rolledValue, setRolledValue] = useState<number | null>(null);

  const handleRollClick = () => {
    if (isHumanTurn && !isRolling) {
        setIsRolling(true);
        setRolledValue(null);
        onClick();
    }
  }

  const onSettled = (val: number) => {
    setIsRolling(false);
    setRolledValue(val);
    onDiceRoll(val);
  }
  
  useEffect(() => {
    // For AI turns
    if (rolling && !isHumanTurn && !isRolling) {
        setIsRolling(true);
        setRolledValue(null);
    }
  }, [rolling, isHumanTurn, isRolling])
  
  return (
    <div className="flex flex-col items-center gap-4 w-full">
        {isHumanTurn && !isRolling && (
             <Button
                onClick={handleRollClick}
                disabled={!isHumanTurn || isRolling}
                className={cn(
                    'gradient-button text-lg font-bold py-3 px-6 rounded-lg',
                    isHumanTurn && !isRolling && 'animate-pulse',
                    turnColorClasses[color]
                )}
            >
                <Dices className="mr-2" />
                Roll Dice
            </Button>
        )}

      <div className="h-48 w-full relative">
        <Canvas shadows camera={{ position: [0, 2, 4], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Physics gravity={[0, -20, 0]}>
            <Dice onSettled={onSettled} color={color} isRolling={isRolling || rolling} />
            <Plane />
          </Physics>
        </Canvas>
      </div>
      <div id="rolled-value" className="text-md font-bold h-12 capitalize flex flex-col text-center">
        <span>
          {isHumanTurn && !isRolling && !value && "Your turn!"}
        </span>
        <span style={{ color: DICE_FACE_COLORS[color] }}>
          {!isRolling && value ? `${color} rolled a: ${value}` : (isRolling ? 'Rolling...' : '')}
        </span>
      </div>
    </div>
  );
}