/**
 * VitalityEffects — Visual particle effects driven by district vitality.
 *
 * EmberParticles  — warm floating embers when vitality >= 80 (PRISTINE)
 * DecayFog        — dark rising wisps when vitality < 40 (WORN / DECAYING / RUINED)
 */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ═══════════════════════════════════════════════════
// Ember Particles — shown at pristine vitality
// Warm orange-red point sprites drifting upward
// ═══════════════════════════════════════════════════

interface EmberProps {
  count?: number;
  color?: string;
  spread?: number;
  height?: number;
}

export const EmberParticles: React.FC<EmberProps> = ({
  count = 40,
  color = '#ff6b6b',
  spread = 2.5,
  height = 2.5,
}) => {
  const pointsRef = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = Math.random() * height;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return arr;
  }, [count, spread, height]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const attr = pointsRef.current.geometry.attributes.position;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      // Drift upward with slight horizontal wander
      arr[i * 3 + 1] += delta * (0.2 + Math.random() * 0.15);
      arr[i * 3]     += (Math.random() - 0.5) * delta * 0.1;
      arr[i * 3 + 2] += (Math.random() - 0.5) * delta * 0.1;
      // Reset when above ceiling
      if (arr[i * 3 + 1] > height) {
        arr[i * 3 + 1] = -0.1;
        arr[i * 3]     = (Math.random() - 0.5) * spread;
        arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.045}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ═══════════════════════════════════════════════════
// Decay Fog — shown at low vitality
// Slow-rotating dark translucent planes
// ═══════════════════════════════════════════════════

export const DecayFog: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map(i => (
        <mesh
          key={i}
          position={[0, 0.25 + i * 0.2, 0]}
          rotation={[0, (i * Math.PI * 2) / 3, 0]}
        >
          <planeGeometry args={[3.5, 0.35]} />
          <meshStandardMaterial
            color="#0a0a0f"
            transparent
            opacity={0.12 - i * 0.025}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};
