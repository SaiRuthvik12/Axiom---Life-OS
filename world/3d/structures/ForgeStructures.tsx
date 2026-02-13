/**
 * ForgeStructures — Individual structure components for The Forge district.
 *
 * Each structure is exported individually so BuildPlot can render them
 * on their own plots. All render centered at origin [0,0,0].
 *
 * Also exports a GenericStructure for districts without custom 3D models,
 * and a STRUCTURE_MODEL_MAP for lookup by structure ID.
 */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { DISTRICT_COLORS } from '../constants';
import { getStructureMaterialProps, lerpColor } from '../materials';
import type { MaterialProps } from '../materials';

const FORGE = DISTRICT_COLORS.forge;

// ─── Shared Props ────────────────────────────────

export interface StructureModelProps {
  condition: number;
  vitality: number;
  baseColor?: string;
  accentColor?: string;
}

function mat(condition: number, accent: boolean, base?: string, accentC?: string): MaterialProps {
  return getStructureMaterialProps(base ?? FORGE.base, accentC ?? FORGE.accent, condition, accent);
}

// ═══════════════════════════════════════════════════
// T1 — Training Grounds
// ═══════════════════════════════════════════════════

const T1_PILLAR_OFFSETS: [number, number][] = [
  [0.28, 0.28], [-0.28, 0.28], [0.28, -0.28], [-0.28, -0.28],
];

export const TrainingGrounds: React.FC<StructureModelProps> = ({ condition, vitality, baseColor, accentColor }) => {
  const m = mat(condition, false, baseColor, accentColor);
  const a = mat(condition, true, baseColor, accentColor);
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.54, 0.08, 8]} />
        <meshStandardMaterial {...m} />
      </mesh>
      {T1_PILLAR_OFFSETS.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} castShadow>
          <boxGeometry args={[0.07, 0.32, 0.07]} />
          <meshStandardMaterial {...a} />
        </mesh>
      ))}
      {T1_PILLAR_OFFSETS.map(([x, z], i) => (
        <mesh key={`c${i}`} position={[x, 0.37, z]}>
          <boxGeometry args={[0.1, 0.03, 0.1]} />
          <meshStandardMaterial {...a} />
        </mesh>
      ))}
    </group>
  );
};

// ═══════════════════════════════════════════════════
// T2 — Sparring Arena
// ═══════════════════════════════════════════════════

export const SparringArena: React.FC<StructureModelProps> = ({ condition, vitality, baseColor, accentColor }) => {
  const m = mat(condition, false, baseColor, accentColor);
  const a = mat(condition, true, baseColor, accentColor);
  const posts = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      pts.push([Math.cos(angle) * 0.42, 0.22, Math.sin(angle) * 0.42]);
    }
    return pts;
  }, []);
  return (
    <group>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.12, 8]} />
        <meshStandardMaterial {...m} />
      </mesh>
      {posts.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.36, 6]} />
          <meshStandardMaterial {...a} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.015, 6, 8]} />
        <meshStandardMaterial {...a} />
      </mesh>
    </group>
  );
};

// ═══════════════════════════════════════════════════
// T3 — Bio-Enhancement Lab
// ═══════════════════════════════════════════════════

export const BioEnhancementLab: React.FC<StructureModelProps> = ({ condition, vitality, baseColor, accentColor }) => {
  const m = mat(condition, false, baseColor, accentColor);
  const t = condition / 100;
  const glowColor = lerpColor('#1a1a1a', '#00ff88', t);
  const glowIntensity = t > 0.6 ? 0.5 : t > 0.3 ? 0.2 : 0;
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.08, 8]} />
        <meshStandardMaterial {...m} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.48, 8]} />
        <meshStandardMaterial {...m} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={glowIntensity} transparent opacity={0.7} roughness={0.1} metalness={0.3} />
      </mesh>
      {glowIntensity > 0 && <pointLight position={[0, 0.5, 0]} color="#00ff88" intensity={0.4} distance={2} />}
    </group>
  );
};

// ═══════════════════════════════════════════════════
// T4 — Forge Core
// ═══════════════════════════════════════════════════

export const ForgeCore: React.FC<StructureModelProps> = ({ condition, vitality, baseColor, accentColor }) => {
  const m = mat(condition, false, baseColor, accentColor);
  const a = mat(condition, true, baseColor, accentColor);
  const t = condition / 100;
  const fireIntensity = t > 0.5 ? 0.7 : t > 0.25 ? 0.3 : 0;
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.18, 0.32]} />
        <meshStandardMaterial {...m} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.55, 0.12, 0.38]} />
        <meshStandardMaterial {...m} />
      </mesh>
      <mesh position={[0, 0.09, 0.17]}>
        <boxGeometry args={[0.46, 0.03, 0.008]} />
        <meshStandardMaterial {...a} />
      </mesh>
      <mesh position={[0, 0.09, -0.17]}>
        <boxGeometry args={[0.46, 0.03, 0.008]} />
        <meshStandardMaterial {...a} />
      </mesh>
      <ForgeFireParticles intensity={fireIntensity} />
      {fireIntensity > 0 && <pointLight position={[0, 0.6, 0]} color="#ff6622" intensity={fireIntensity} distance={2.5} />}
    </group>
  );
};

// ─── Fire Particle System ────────────────────────

const FIRE_COUNT = 30;

const ForgeFireParticles: React.FC<{ intensity: number }> = ({ intensity }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(FIRE_COUNT * 3);
    for (let i = 0; i < FIRE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.3;
      arr[i * 3 + 1] = Math.random() * 0.4 + 0.22;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return arr;
  }, []);
  useFrame((_, delta) => {
    if (!pointsRef.current || intensity <= 0) return;
    const attr = pointsRef.current.geometry.attributes.position;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < FIRE_COUNT; i++) {
      arr[i * 3 + 1] += delta * (0.35 + Math.random() * 0.25);
      if (arr[i * 3 + 1] > 0.9) {
        arr[i * 3 + 1] = 0.22;
        arr[i * 3] = (Math.random() - 0.5) * 0.3;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
    }
    attr.needsUpdate = true;
  });
  if (intensity <= 0) return null;
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ff6622" size={0.05} transparent opacity={intensity} sizeAttenuation depthWrite={false} />
    </points>
  );
};

// ═══════════════════════════════════════════════════
// T5 — Titan Framework (scaled down for plot)
// ═══════════════════════════════════════════════════

export const TitanFramework: React.FC<StructureModelProps> = ({ condition, vitality, baseColor, accentColor }) => {
  const a = mat(condition, true, baseColor, accentColor);
  const arches = useMemo(() => {
    const result: { pos: [number, number, number]; rot: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
      result.push({ pos: [Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55], rot: angle });
    }
    return result;
  }, []);
  return (
    <group>
      {/* Central platform */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.06, 6]} />
        <meshStandardMaterial {...mat(condition, false, baseColor, accentColor)} />
      </mesh>
      {arches.map((arch, i) => (
        <group key={i} position={arch.pos} rotation={[0, arch.rot, 0]}>
          <mesh position={[-0.12, 0.4, 0]} castShadow>
            <boxGeometry args={[0.045, 0.8, 0.045]} />
            <meshStandardMaterial {...a} />
          </mesh>
          <mesh position={[0.12, 0.4, 0]} castShadow>
            <boxGeometry args={[0.045, 0.8, 0.045]} />
            <meshStandardMaterial {...a} />
          </mesh>
          <mesh position={[0, 0.82, 0]} castShadow>
            <boxGeometry args={[0.3, 0.045, 0.045]} />
            <meshStandardMaterial {...a} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ═══════════════════════════════════════════════════
// Generic Structure (for districts without custom models)
// ═══════════════════════════════════════════════════

export const GenericStructure: React.FC<StructureModelProps> = ({ condition, vitality, baseColor, accentColor }) => {
  const m = mat(condition, false, baseColor, accentColor);
  const a = mat(condition, true, baseColor, accentColor);
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.25, 0.4]} />
        <meshStandardMaterial {...m} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.42, 0.04, 0.42]} />
        <meshStandardMaterial {...a} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <octahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial {...a} />
      </mesh>
    </group>
  );
};

// ─── Model Lookup ────────────────────────────────

export const STRUCTURE_MODEL_MAP: Record<string, React.FC<StructureModelProps>> = {
  'forge-t1': TrainingGrounds,
  'forge-t2': SparringArena,
  'forge-t3': BioEnhancementLab,
  'forge-t4': ForgeCore,
  'forge-t5': TitanFramework,
};
