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


// Draw pips for a given face
function createDiceFace(value: number) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "black";
  const r = 12; // radius of pip
  const offset = size / 4;

  const drawPip = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  const center = size / 2;

  // Pip patterns
  const positions: Record<number, [number, number][]> = {
    1: [[center, center]],
    2: [[offset, offset], [size - offset, size - offset]],
    3: [[offset, offset], [center, center], [size - offset, size - offset]],
    4: [
      [offset, offset],
      [size - offset, offset],
      [offset, size - offset],
      [size - offset, size - offset],
    ],
    5: [
      [offset, offset],
      [size - offset, offset],
      [center, center],
      [offset, size - offset],
      [size - offset, size - offset],
    ],
    6: [
      [offset, offset],
      [size - offset, offset],
      [offset, center],
      [size - offset, center],
      [offset, size - offset],
      [size - offset, size - offset],
    ],
  };
  
  if (positions[value]) {
    positions[value].forEach(([x, y]) => drawPip(x, y));
  }


  return new THREE.CanvasTexture(canvas);
}


function Dice({ onSettled, isRolling }: { onSettled: (val: number) => void, isRolling: boolean }) {
    const ref = useRef<any>();

    const materials = useMemo(() => [
        new THREE.MeshStandardMaterial({ map: createDiceFace(4) }), // right
        new THREE.MeshStandardMaterial({ map: createDiceFace(3) }), // left
        new THREE.MeshStandardMaterial({ map: createDiceFace(5) }), // top
        new THREE.MeshStandardMaterial({ map: createDiceFace(2) }), // bottom
        new THREE.MeshStandardMaterial({ map: createDiceFace(1) }), // front
        new THREE.MeshStandardMaterial({ map: createDiceFace(6) }), // back
    ], []);
    
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

        // Normals of the dice faces in local space
        const faces = [
            { value: 1, normal: new THREE.Vector3(0, 0, 1) },   // Front face (value 1)
            { value: 6, normal: new THREE.Vector3(0, 0, -1) },  // Back face (value 6)
            { value: 2, normal: new THREE.Vector3(0, -1, 0) }, // Bottom face (value 2)
            { value: 5, normal: new THREE.Vector3(0, 1, 0) },   // Top face (value 5)
            { value: 3, normal: new THREE.Vector3(-1, 0, 0) },  // Left face (value 3)
            { value: 4, normal: new THREE.Vector3(1, 0, 0) },   // Right face (value 4)
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
