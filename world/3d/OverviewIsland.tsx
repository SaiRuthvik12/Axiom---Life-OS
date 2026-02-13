/**
 * OverviewIsland — Unified island component for the overview scene.
 *
 * Renders a unique Kenney GLB building model per district + Html hover tooltip.
 * Replaces the old hexagonal IslandBase + DistrictIcons approach.
 */

import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { IslandModel } from './islands/IslandModel';
import { DISTRICT_COLORS } from './constants';
import { DISTRICTS } from '../constants';

interface OverviewIslandProps {
  districtId: string;
  isUnlocked: boolean;
  vitality: number;
  position: [number, number, number];
  onClick?: () => void;
}

export const OverviewIsland: React.FC<OverviewIslandProps> = ({
  districtId,
  isUnlocked,
  vitality,
  position,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const districtDef = DISTRICTS.find(d => d.id === districtId);
  const colors = DISTRICT_COLORS[districtId] ?? DISTRICT_COLORS.forge;

  return (
    <group position={position}>
      {/* Clickable hit area — invisible box around the model */}
      <mesh
        visible={false}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = isUnlocked ? 'pointer' : 'default'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
      >
        <boxGeometry args={[2.5, 3.5, 2.5]} />
      </mesh>

      {/* 3D Model */}
      <IslandModel
        districtId={districtId}
        isUnlocked={isUnlocked}
        vitality={vitality}
        hovered={hovered}
      />

      {/* Accent ground glow */}
      {isUnlocked && vitality > 50 && (
        <pointLight
          position={[0, 0.5, 0]}
          color={colors.neon}
          intensity={hovered ? 0.8 : 0.3}
          distance={4}
        />
      )}

      {/* Hover label */}
      {hovered && districtDef && (
        <Html position={[0, 3.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-center whitespace-nowrap shadow-lg backdrop-blur-sm">
            {isUnlocked ? (
              <>
                <div className="text-[11px] font-mono font-bold text-white">{districtDef.name}</div>
                <div className="text-[9px] font-mono text-zinc-400 mt-0.5">{districtDef.tagline}</div>
              </>
            ) : (
              <>
                <div className="text-[11px] font-mono font-bold text-zinc-500">{districtDef.name}</div>
                <div className="text-[9px] font-mono text-zinc-600 mt-0.5">Locked — LVL {districtDef.unlockLevel}</div>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
