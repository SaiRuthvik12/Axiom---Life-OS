/**
 * NexusScene — Two-level 3D scene manager.
 *
 * Level 1 (Overview):  Static isometric camera, 6 district islands, hover labels.
 * Level 2 (Detail):    Top-down camera, terrain with building plots, back button.
 *
 * One <Canvas> switches content based on `activeDistrict` state.
 */

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Stars, Grid } from '@react-three/drei';
import { ArrowLeft } from 'lucide-react';
import type { WorldState } from '../types';
import type { Player } from '../../types';
import { DISTRICTS } from '../constants';
import { OverviewIsland } from './OverviewIsland';
import { DistrictDetailView } from './DistrictDetailView';
import {
  CAMERA_POSITION,
  CAMERA_ZOOM,
  CAMERA_NEAR,
  CAMERA_FAR,
  DETAIL_CAMERA_POSITION,
  DETAIL_CAMERA_ZOOM,
  DISTRICT_ORDER,
  getDistrictPosition,
  BG_COLOR,
  AMBIENT_COLOR,
  AMBIENT_INTENSITY,
  SUN_COLOR,
  SUN_INTENSITY,
  SUN_POSITION,
  FOG_NEAR,
  FOG_FAR,
} from './constants';

// ─── Props ───────────────────────────────────────

interface NexusSceneProps {
  worldState: WorldState;
  player: Player;
  onBuildStructure: (districtId: string, structureId: string) => void;
  onRepairStructure: (districtId: string, structureId: string) => void;
}

// ─── Component ───────────────────────────────────

export const NexusScene: React.FC<NexusSceneProps> = ({
  worldState,
  player,
  onBuildStructure,
  onRepairStructure,
}) => {
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);

  const activeDistrictState = activeDistrict
    ? worldState.districts.find(d => d.id === activeDistrict)
    : null;

  const activeDistrictDef = activeDistrict
    ? DISTRICTS.find(d => d.id === activeDistrict)
    : null;

  return (
    <div className="relative rounded-lg border border-zinc-800/50 overflow-hidden h-[350px] md:h-[450px] bg-zinc-950">
      <Canvas
        dpr={[1, 1.5]}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        {/* ── Shared Atmosphere ── */}
        <color attach="background" args={[BG_COLOR]} />
        <fog attach="fog" args={[BG_COLOR, FOG_NEAR, FOG_FAR]} />
        <ambientLight intensity={AMBIENT_INTENSITY} color={AMBIENT_COLOR} />
        <directionalLight
          position={SUN_POSITION}
          intensity={SUN_INTENSITY}
          color={SUN_COLOR}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-camera-near={0.1}
          shadow-camera-far={30}
        />

        <Suspense fallback={null}>
          {activeDistrict === null ? (
            /* ════════════════════════════════════════
               LEVEL 1: OVERVIEW
               ════════════════════════════════════════ */
            <>
              <OrthographicCamera
                makeDefault
                position={CAMERA_POSITION}
                zoom={CAMERA_ZOOM}
                near={CAMERA_NEAR}
                far={CAMERA_FAR}
                onUpdate={(self) => self.lookAt(0, 0, 0)}
              />

              <Stars radius={60} depth={40} count={400} factor={2} saturation={0} fade speed={0.4} />

              <Grid
                position={[0, -2.2, 0]}
                infiniteGrid
                cellSize={1}
                cellThickness={0.3}
                cellColor="#111118"
                sectionSize={5}
                sectionThickness={0.6}
                sectionColor="#16162a"
                fadeDistance={25}
                fadeStrength={1.5}
              />

              {/* All 6 district islands in unlock order */}
              {DISTRICT_ORDER.map(districtId => {
                const state = worldState.districts.find(d => d.id === districtId);
                if (!state) return null;
                return (
                  <OverviewIsland
                    key={districtId}
                    districtId={districtId}
                    isUnlocked={state.isUnlocked}
                    vitality={state.vitality}
                    position={getDistrictPosition(districtId)}
                    onClick={() => {
                      if (state.isUnlocked) setActiveDistrict(districtId);
                    }}
                  />
                );
              })}
            </>
          ) : (
            /* ════════════════════════════════════════
               LEVEL 2: DISTRICT DETAIL
               ════════════════════════════════════════ */
            <>
              <OrthographicCamera
                makeDefault
                position={DETAIL_CAMERA_POSITION}
                zoom={DETAIL_CAMERA_ZOOM}
                near={CAMERA_NEAR}
                far={CAMERA_FAR}
                onUpdate={(self) => self.lookAt(0, 0, 0)}
              />

              <Stars radius={60} depth={40} count={200} factor={1.5} saturation={0} fade speed={0.3} />

              {activeDistrictState && (
                <DistrictDetailView
                  districtId={activeDistrict}
                  districtState={activeDistrictState}
                  player={player}
                  onBuild={onBuildStructure}
                  onRepair={onRepairStructure}
                />
              )}
            </>
          )}
        </Suspense>
      </Canvas>

      {/* ── UI Overlays ── */}
      {activeDistrict === null ? (
        <div className="absolute bottom-2 left-3 pointer-events-none select-none">
          <span className="text-[10px] font-mono text-zinc-600/70">
            Click an island to enter
          </span>
        </div>
      ) : (
        <button
          onClick={() => setActiveDistrict(null)}
          className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700/50 text-[11px] font-mono text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Nexus
        </button>
      )}
    </div>
  );
};
