/**
 * BuildPlot — A single building plot in the district detail view.
 *
 * Empty:  glowing ring outline + "?" marker. Click opens build panel.
 * Built:  structure 3D model + condition indicator. Click opens info panel.
 */

import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { StructureDefinition, StructureState } from '../types';
import { STRUCTURE_MODEL_MAP, GenericStructure } from './structures/ForgeStructures';
import type { StructureModelProps } from './structures/ForgeStructures';
import { PLOT_RING_RADIUS } from './constants';

interface BuildPlotProps {
  position: [number, number, number];
  structureDef: StructureDefinition;
  structureState: StructureState;
  districtVitality: number;
  baseColor: string;
  accentColor: string;
  neonColor: string;
  playerLevel: number;
  playerCredits: number;
  onBuild: (districtId: string, structureId: string) => void;
  onRepair: (districtId: string, structureId: string) => void;
}

export const BuildPlot: React.FC<BuildPlotProps> = ({
  position,
  structureDef,
  structureState,
  districtVitality,
  baseColor,
  accentColor,
  neonColor,
  playerLevel,
  playerCredits,
  onBuild,
  onRepair,
}) => {
  const [hovered, setHovered] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null!);

  // Pulse the ring when empty
  useFrame(({ clock }) => {
    if (ringRef.current && !structureState.isBuilt) {
      const pulse = 0.15 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = hovered ? 0.5 : pulse;
    }
  });

  const canBuild = playerLevel >= structureDef.unlockLevel && playerCredits >= structureDef.buildCost;
  const needsRepair = structureState.isBuilt && structureState.condition < 70;

  const ModelComponent: React.FC<StructureModelProps> = STRUCTURE_MODEL_MAP[structureDef.id] ?? GenericStructure;

  return (
    <group position={position}>
      {/* ── Ground Ring (always visible) ── */}
      <mesh
        ref={ringRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onClick={(e) => { e.stopPropagation(); setShowPanel(!showPanel); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={(e) => { document.body.style.cursor = 'auto'; setHovered(false); }}
      >
        <torusGeometry args={[PLOT_RING_RADIUS, structureState.isBuilt ? 0.025 : 0.035, 8, 24]} />
        <meshStandardMaterial
          color={structureState.isBuilt ? accentColor : neonColor}
          emissive={neonColor}
          emissiveIntensity={structureState.isBuilt ? 0.15 : 0.2}
          transparent
          opacity={structureState.isBuilt ? 0.4 : 0.7}
        />
      </mesh>

      {/* ── Built: render structure model ── */}
      {structureState.isBuilt && (
        <group position={[0, 0.05, 0]}>
          <ModelComponent
            condition={structureState.condition}
            vitality={districtVitality}
            baseColor={baseColor}
            accentColor={accentColor}
          />
        </group>
      )}

      {/* ── Empty: "?" marker ── */}
      {!structureState.isBuilt && (
        <group position={[0, 0.3, 0]}>
          <mesh>
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={neonColor}
              emissiveIntensity={hovered ? 0.5 : 0.15}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      )}

      {/* ── Panel Overlay ── */}
      {showPanel && (
        <Html position={[0, structureState.isBuilt ? 1.2 : 0.8, 0]} center>
          <div
            className="bg-zinc-900/95 border border-zinc-700/60 rounded-lg p-3 w-52 shadow-xl backdrop-blur-sm select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono font-bold text-white">{structureDef.name}</span>
              <span className="text-[9px] font-mono text-zinc-500">T{structureDef.tier}</span>
            </div>
            <p className="text-[9px] text-zinc-400 leading-tight">{structureDef.description}</p>

            {structureState.isBuilt ? (
              <>
                {/* Condition bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-mono text-zinc-500">Condition</span>
                    <span className="text-[9px] font-mono text-zinc-400">{structureState.condition}%</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${structureState.condition}%`,
                        backgroundColor: structureState.condition > 70 ? '#10b981' : structureState.condition > 40 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
                {needsRepair && (
                  <button
                    onClick={() => { onRepair(structureDef.districtId, structureDef.id); setShowPanel(false); }}
                    className="mt-2 w-full py-1 rounded text-[10px] font-mono bg-amber-900/50 text-amber-400 hover:bg-amber-900/80 transition-colors"
                  >
                    Repair
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Build info */}
                <div className="mt-2 flex items-center gap-3 text-[9px] font-mono text-zinc-500">
                  <span>Cost: {structureDef.buildCost}c</span>
                  <span>LVL {structureDef.unlockLevel}</span>
                </div>
                <button
                  disabled={!canBuild}
                  onClick={() => { onBuild(structureDef.districtId, structureDef.id); setShowPanel(false); }}
                  className={`mt-2 w-full py-1 rounded text-[10px] font-mono transition-colors ${
                    canBuild
                      ? 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/80'
                      : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {canBuild ? 'Build' : playerLevel < structureDef.unlockLevel ? `Requires LVL ${structureDef.unlockLevel}` : 'Not enough credits'}
                </button>
              </>
            )}

            {/* Close */}
            <button
              onClick={() => setShowPanel(false)}
              className="mt-1.5 w-full py-0.5 rounded text-[9px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Close
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};
