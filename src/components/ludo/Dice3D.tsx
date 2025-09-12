"use client";

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
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


function Dice({ onSettled, isRolling }: { onSettled: (val: number) => void, isRolling: boolean }) {
    const ref = useRef<any>();

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
      if (isRolling && ref.current) {
        ref.current.setTranslation({ x: 0, y: 2, z: 0 }, true);
        ref.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
        const impulse = { 
            x: (Math.random() - 0.5) * 8, 
            y: Math.random() * 5 + 5, 
            z: (Math.random() - 0.5) * 8 
        };
        const torque = { 
            x: (Math.random() - 0.5) * 20, 
            y: (Math.random() - 0.5) * 20, 
            z: (Math.random() - 0.5) * 20 
        };
        ref.current.applyImpulse(impulse, true);
        ref.current.applyTorqueImpulse(torque, true);
      }
    }, [isRolling]);


    const getDiceValue = () => {
        if (!ref.current) return;
        
        const quat = ref.current.rotation();
        const worldUp = new THREE.Vector3(0, 1, 0);

        const faces = [
            { value: 1, normal: new THREE.Vector3(0, 0, 1) },   // Front face
            { value: 6, normal: new THREE.Vector3(0, 0, -1) },  // Back face
            { value: 2, normal: new THREE.Vector3(0, -1, 0) }, // Bottom face
            { value: 5, normal: new THREE.Vector3(0, 1, 0) },   // Top face
            { value: 3, normal: new THREE.Vector3(-1, 0, 0) },  // Left face
            { value: 4, normal: new THREE.Vector3(1, 0, 0) },   // Right face
        ];

        let maxDot = -Infinity;
        let result = 0;
        
        for (const f of faces) {
          const localNormal = f.normal.clone();
          const worldNormal = localNormal.applyQuaternion(new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w));
          const dot = worldUp.dot(worldNormal);

          if (dot > maxDot) {
            maxDot = dot;
            result = f.value;
          }
        }
       onSettled(result);
    }
    
    useEffect(() => {
        if (!isRolling) return;

        const sleepSub = setInterval(() => {
            if (ref.current && ref.current.isSleeping()) {
                getDiceValue();
                clearInterval(sleepSub);
            }
        }, 100);

        return () => clearInterval(sleepSub);
    }, [isRolling]);

    return (
        <RigidBody ref={ref} colliders="cuboid" position={[0, 2, 0]} angularDamping={0.8} linearDamping={0.8}>
            <mesh castShadow material={materials}>
                <boxGeometry args={[1, 1, 1]} />
            </mesh>
        </RigidBody>
    );
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
  
  const handleRollClick = () => {
    if (isHumanTurn && !isRolling) {
        setIsRolling(true);
        onClick();
        setTimeout(() => {
            // This timeout is a fallback. The physics check is the primary method.
            if (isRollingRef.current) {
                setIsRolling(false);
            }
        }, duration);
    }
  }

  const isRollingRef = useRef(isRolling);
  isRollingRef.current = isRolling;

  const onSettled = (val: number) => {
    if(isRollingRef.current) {
        setIsRolling(false);
        onDiceRoll(val);
    }
  }
  
  useEffect(() => {
    // For AI turns
    if (rolling && !isHumanTurn && !isRolling) {
        setIsRolling(true);
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
        <Canvas shadows camera={{ position: [0, 5, 5], fov: 50 }}>
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[5, 5, 5]}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Physics gravity={[0, -25, 0]}>
            <Dice onSettled={onSettled} isRolling={isRolling || rolling} />
            <CuboidCollider position={[0, -1, 0]} args={[20, 1, 20]} friction={0.7} />
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