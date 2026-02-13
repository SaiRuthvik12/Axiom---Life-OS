/**
 * DistrictDetailView — CoC-style top-down detail view for a single district.
 *
 * Shows: terrain ground plane, 5 BuildPlots, district name label.
 * The camera is set by the parent (NexusScene) to a top-down angle.
 */

import React from 'react';
import { Html } from '@react-three/drei';
import type { DistrictState } from '../types';
import type { Player } from '../../types';
import { STRUCTURES, DISTRICTS } from '../constants';
import { BuildPlot } from './BuildPlot';
import { PLOT_POSITIONS, TERRAIN_RADIUS, DISTRICT_COLORS } from './constants';

interface DistrictDetailViewProps {
  districtId: string;
  districtState: DistrictState;
  player: Player;
  onBuild: (districtId: string, structureId: string) => void;
  onRepair: (districtId: string, structureId: string) => void;
}

export const DistrictDetailView: React.FC<DistrictDetailViewProps> = ({
  districtId,
  districtState,
  player,
  onBuild,
  onRepair,
}) => {
  const colors = DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS.forge;
  const districtDef = DISTRICTS.find(d => d.id === districtId);
  const districtStructures = STRUCTURES.filter(s => s.districtId === districtId);

  return (
    <group>
      {/* ── Terrain Ground ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[TERRAIN_RADIUS, 48]} />
        <meshStandardMaterial color={colors.terrain} roughness={0.92} metalness={0.05} />
      </mesh>

      {/* Terrain edge ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[TERRAIN_RADIUS, 0.03, 8, 48]} />
        <meshStandardMaterial
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>

      {/* Subtle inner grid lines */}
      {[-2, -1, 0, 1, 2].map(i => (
        <React.Fragment key={`g${i}`}>
          <mesh position={[i * 1.5, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.01, TERRAIN_RADIUS * 1.8]} />
            <meshStandardMaterial color={colors.accent} transparent opacity={0.06} />
          </mesh>
          <mesh position={[0, 0.001, i * 1.5]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.01, TERRAIN_RADIUS * 1.8]} />
            <meshStandardMaterial color={colors.accent} transparent opacity={0.06} />
          </mesh>
        </React.Fragment>
      ))}

      {/* ── Building Plots ── */}
      {districtStructures.map((structDef, i) => {
        const structState = districtState.structures.find(s => s.id === structDef.id);
        if (!structState || i >= PLOT_POSITIONS.length) return null;

        return (
          <BuildPlot
            key={structDef.id}
            position={PLOT_POSITIONS[i]}
            structureDef={structDef}
            structureState={structState}
            districtVitality={districtState.vitality}
            baseColor={colors.base}
            accentColor={colors.accent}
            neonColor={colors.neon}
            playerLevel={player.level}
            playerCredits={player.credits}
            onBuild={onBuild}
            onRepair={onRepair}
          />
        );
      })}

      {/* ── District Label (floating above center) ── */}
      <Html position={[0, 3, -3]} center style={{ pointerEvents: 'none' }}>
        <div className="text-center whitespace-nowrap select-none">
          <div className="text-sm font-mono font-bold text-white/80">{districtDef?.name ?? districtId}</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
            Vitality {districtState.vitality}% · {districtState.structures.filter(s => s.isBuilt).length}/5 built
          </div>
        </div>
      </Html>
    </group>
  );
};
