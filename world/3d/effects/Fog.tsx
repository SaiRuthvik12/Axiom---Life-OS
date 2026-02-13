/**
 * DistrictFog — Semi-transparent fog dome for locked districts.
 *
 * A hemisphere of translucent material slowly rotating,
 * giving the impression of swirling mist obscuring the island.
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface DistrictFogProps {
  color?: string;
  radius?: number;
  opacity?: number;
}

export const DistrictFog: React.FC<DistrictFogProps> = ({
  color = '#1a1a2e',
  radius = 1.5,
  opacity = 0.35,
}) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer dome */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[radius * 1.3, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Inner wisp layer (slightly smaller, rotating opposite) */}
      <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI / 3, 0]}>
        <sphereGeometry args={[radius * 1.0, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity * 0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
