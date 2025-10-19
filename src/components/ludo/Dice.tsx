"use client";

import * as THREE from 'three';
import React, { useRef, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import type { GLTF } from 'three-stdlib';
import { useFrame } from '@react-three/fiber';

type GLTFResult = GLTF & {
  nodes: {
    Cube: THREE.Mesh
  }
  materials: {
    Material: THREE.MeshStandardMaterial
  }
}

const DICE_FACE_MAP = [
    { vector: new THREE.Vector3(0, 0, 1), value: 1 },
    { vector: new THREE.Vector3(1, 0, 0), value: 2 },
    { vector: new THREE.Vector3(0, 0, -1), value: 3 },
    { vector: new THREE.Vector3(-1, 0, 0), value: 4 },
    { vector: new THREE.Vector3(0, 1, 0), value: 5 },
    { vector: new THREE.Vector3(0, -1, 0), value: 6 },
];

export function Dice(props: any) {
  const body = useRef<any>();
  const { nodes, materials } = useGLTF('/red_dice.glb') as GLTFResult;

  const onSelect = (e: any) => {
    if (props.isHumanTurn && !props.rolling) {
      props.onRollStart();
      body.current?.applyImpulse(
        {
          x: Math.random() * 2,
          y: Math.random() * 5,
          z: Math.random() * 2,
        },
        true
      );
      body.current?.applyTorqueImpulse(
        {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10,
        },
        true
      );
    }
  };

  useFrame(() => {
    if (body.current) {
        if(props.rolling) {
            const linearVelocity = body.current.linvel();
            const angularVelocity = body.current.angvel();
            if (
              Math.abs(linearVelocity.x) < 0.1 &&
              Math.abs(linearVelocity.y) < 0.1 &&
              Math.abs(linearVelocity.z) < 0.1 &&
              Math.abs(angularVelocity.x) < 0.1 &&
              Math.abs(angularVelocity.y) < 0.1 &&
              Math.abs(angularVelocity.z) < 0.1
            ) {
              const rotation = new THREE.Quaternion().copy(body.current.rotation());
              let maxDot = -1;
              let diceValue = -1;
      
              for (const face of DICE_FACE_MAP) {
                const rotatedVector = face.vector.clone().applyQuaternion(rotation);
                const dot = rotatedVector.dot(new THREE.Vector3(0, 1, 0));
                if (dot > maxDot) {
                  maxDot = dot;
                  diceValue = face.value;
                }
              }
              props.onDiceRoll(diceValue);
            }
        }
    }
  });
  
  const clonedMaterial = useMemo(() => materials.Material.clone(), [materials.Material]);

  useEffect(() => {
    if (props.color) {
        clonedMaterial.color = new THREE.Color(props.color);
        clonedMaterial.needsUpdate = true;
    }
  }, [props.color, clonedMaterial]);


  return (
    <group {...props} dispose={null}>
      <RigidBody ref={body} colliders={false} position={[0, 4, 0]}>
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cube.geometry}
          material={clonedMaterial}
          onClick={onSelect}
        />
      </RigidBody>
    </group>
  );
}

useGLTF.preload('/red_dice.glb');
