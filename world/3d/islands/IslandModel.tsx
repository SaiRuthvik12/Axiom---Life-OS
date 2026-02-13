/**
 * IslandModel — Loads and composes Kenney GLB models per district.
 *
 * Each district has a unique building composition loaded via useGLTF.
 * The Kenney models have a shared colormap texture (external PNG reference).
 * Models are organized by kit (pirate / fantasy / castle) so the GLTF
 * loader resolves the `Textures/colormap.png` URI relative to each GLB.
 */

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { DISTRICT_COLORS } from '../constants';

// ─── Model paths (organized by source kit) ───────

const PIRATE = '/models/islands/pirate';
const FANTASY = '/models/islands/fantasy';
const CASTLE = '/models/islands/castle';

// ─── Props ───────────────────────────────────────

interface IslandModelProps {
  districtId: string;
  isUnlocked: boolean;
  vitality: number;
  hovered: boolean;
}

// ─── Clone helper ────────────────────────────────

/**
 * Clone a GLTF scene with independent material instances.
 * Object3D.clone(true) shares material references — we clone each
 * material so we can mutate color / emissive per instance.
 */
function cloneScene(original: THREE.Object3D): THREE.Object3D {
  const cloned = original.clone(true);

  cloned.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Clone the material so we get an independent copy
      // Material.clone() preserves texture (map) references
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m: THREE.Material) => m.clone());
      } else {
        child.material = child.material.clone();
      }
    }
  });

  return cloned;
}

// ─── Scene styling ───────────────────────────────

function styleScene(
  scene: THREE.Object3D,
  accentColor: string,
  isUnlocked: boolean,
  vitality: number,
  hovered: boolean,
) {
  const accent = new THREE.Color(accentColor);

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mat = child.material;
    if (!(mat instanceof THREE.MeshStandardMaterial)) return;

    if (!isUnlocked) {
      // Locked: desaturate — multiply texture by dark grey
      mat.color.set('#333340');
      mat.emissive.set('#000000');
      mat.emissiveIntensity = 0;
      mat.opacity = 0.5;
      mat.transparent = true;
    } else {
      // Unlocked: white color = full original texture shows through
      mat.color.set(hovered ? '#f5f5f5' : '#ffffff');

      // Emissive accent glow — scales with vitality
      const vf = vitality / 100;
      mat.emissive.copy(accent);
      mat.emissiveIntensity = hovered ? 0.12 : 0.01 + vf * 0.05;

      mat.opacity = 1;
      mat.transparent = false;
    }

    mat.needsUpdate = true;
  });
}

// ─── Individual district compositions ────────────

const ForgeModel: React.FC<IslandModelProps> = (props) => {
  const tower = useGLTF(`${PIRATE}/forge-tower.glb`);
  const chimney = useGLTF(`${FANTASY}/forge-chimney.glb`);

  const scenes = useMemo(() => ({
    tower: cloneScene(tower.scene),
    chimney: cloneScene(chimney.scene),
  }), [tower.scene, chimney.scene]);

  useEffect(() => {
    const a = DISTRICT_COLORS.forge.accent;
    styleScene(scenes.tower, a, props.isUnlocked, props.vitality, props.hovered);
    styleScene(scenes.chimney, a, props.isUnlocked, props.vitality, props.hovered);
  }, [props.isUnlocked, props.vitality, props.hovered, scenes]);

  return (
    <group scale={0.45}>
      <primitive object={scenes.tower} />
      <primitive object={scenes.chimney} position={[0.5, 0.6, 0.3]} scale={[1.5, 1.5, 1.5]} />
    </group>
  );
};

const ArchiveModel: React.FC<IslandModelProps> = (props) => {
  const tBase = useGLTF(`${CASTLE}/archive-tower-base.glb`);
  const tMid = useGLTF(`${CASTLE}/archive-tower-mid.glb`);
  const tTop = useGLTF(`${CASTLE}/archive-tower-top.glb`);

  const scenes = useMemo(() => ({
    base: cloneScene(tBase.scene),
    mid: cloneScene(tMid.scene),
    top: cloneScene(tTop.scene),
  }), [tBase.scene, tMid.scene, tTop.scene]);

  useEffect(() => {
    const a = DISTRICT_COLORS.archive.accent;
    Object.values(scenes).forEach(s => styleScene(s, a, props.isUnlocked, props.vitality, props.hovered));
  }, [props.isUnlocked, props.vitality, props.hovered, scenes]);

  return (
    <group scale={1.2}>
      <primitive object={scenes.base} position={[0, 0, 0]} />
      <primitive object={scenes.mid} position={[0, 0.5, 0]} />
      <primitive object={scenes.top} position={[0, 1.0, 0]} />
    </group>
  );
};

const SanctumModel: React.FC<IslandModelProps> = (props) => {
  const fountain = useGLTF(`${FANTASY}/sanctum-fountain.glb`);
  const tree = useGLTF(`${FANTASY}/sanctum-tree.glb`);

  const scenes = useMemo(() => ({
    fountain: cloneScene(fountain.scene),
    tree: cloneScene(tree.scene),
  }), [fountain.scene, tree.scene]);

  useEffect(() => {
    const a = DISTRICT_COLORS.sanctum.accent;
    styleScene(scenes.fountain, a, props.isUnlocked, props.vitality, props.hovered);
    styleScene(scenes.tree, a, props.isUnlocked, props.vitality, props.hovered);
  }, [props.isUnlocked, props.vitality, props.hovered, scenes]);

  return (
    <group scale={1.2}>
      <primitive object={scenes.fountain} />
      <primitive object={scenes.tree} position={[0.6, 0, -0.4]} scale={[0.8, 0.8, 0.8]} />
    </group>
  );
};

const CommandModel: React.FC<IslandModelProps> = (props) => {
  const tBase = useGLTF(`${CASTLE}/command-tower-base.glb`);
  const tMid = useGLTF(`${CASTLE}/command-tower-mid.glb`);
  const tTop = useGLTF(`${CASTLE}/command-tower-top.glb`);
  const tRoof = useGLTF(`${CASTLE}/command-tower-roof.glb`);
  const flag = useGLTF(`${CASTLE}/command-flag.glb`);

  const scenes = useMemo(() => ({
    base: cloneScene(tBase.scene),
    mid: cloneScene(tMid.scene),
    top: cloneScene(tTop.scene),
    roof: cloneScene(tRoof.scene),
    flag: cloneScene(flag.scene),
  }), [tBase.scene, tMid.scene, tTop.scene, tRoof.scene, flag.scene]);

  useEffect(() => {
    const a = DISTRICT_COLORS.command.accent;
    Object.values(scenes).forEach(s => styleScene(s, a, props.isUnlocked, props.vitality, props.hovered));
  }, [props.isUnlocked, props.vitality, props.hovered, scenes]);

  return (
    <group scale={1.2}>
      <primitive object={scenes.base} />
      <primitive object={scenes.mid} position={[0, 0.5, 0]} />
      <primitive object={scenes.top} position={[0, 1.0, 0]} />
      <primitive object={scenes.roof} position={[0, 1.5, 0]} />
      <primitive object={scenes.flag} position={[0.15, 1.8, 0]} scale={[0.7, 0.7, 0.7]} />
    </group>
  );
};

const VaultModel: React.FC<IslandModelProps> = (props) => {
  const gate = useGLTF(`${CASTLE}/vault-gate.glb`);
  const chest = useGLTF(`${PIRATE}/vault-chest.glb`);

  const scenes = useMemo(() => ({
    gate: cloneScene(gate.scene),
    chest: cloneScene(chest.scene),
  }), [gate.scene, chest.scene]);

  useEffect(() => {
    const a = DISTRICT_COLORS.vault.accent;
    styleScene(scenes.gate, a, props.isUnlocked, props.vitality, props.hovered);
    styleScene(scenes.chest, a, props.isUnlocked, props.vitality, props.hovered);
  }, [props.isUnlocked, props.vitality, props.hovered, scenes]);

  return (
    <group scale={1.2}>
      <primitive object={scenes.gate} />
      <primitive object={scenes.chest} position={[0, 0.05, 0.5]} scale={[1.2, 1.2, 1.2]} />
    </group>
  );
};

const AtelierModel: React.FC<IslandModelProps> = (props) => {
  const watermill = useGLTF(`${FANTASY}/atelier-watermill.glb`);
  const lantern = useGLTF(`${FANTASY}/atelier-lantern.glb`);

  const scenes = useMemo(() => ({
    watermill: cloneScene(watermill.scene),
    lantern: cloneScene(lantern.scene),
  }), [watermill.scene, lantern.scene]);

  useEffect(() => {
    const a = DISTRICT_COLORS.atelier.accent;
    styleScene(scenes.watermill, a, props.isUnlocked, props.vitality, props.hovered);
    styleScene(scenes.lantern, a, props.isUnlocked, props.vitality, props.hovered);
  }, [props.isUnlocked, props.vitality, props.hovered, scenes]);

  return (
    <group scale={1.2}>
      <primitive object={scenes.watermill} />
      <primitive object={scenes.lantern} position={[0.7, 0, 0.3]} scale={[1.3, 1.3, 1.3]} />
    </group>
  );
};

// ─── Lookup map ──────────────────────────────────

const MODEL_COMPONENTS: Record<string, React.FC<IslandModelProps>> = {
  forge: ForgeModel,
  archive: ArchiveModel,
  sanctum: SanctumModel,
  command: CommandModel,
  vault: VaultModel,
  atelier: AtelierModel,
};

// ─── Main export ─────────────────────────────────

export const IslandModel: React.FC<IslandModelProps> = (props) => {
  const Component = MODEL_COMPONENTS[props.districtId];
  if (!Component) return null;
  return <Component {...props} />;
};

// ─── Preload all models ──────────────────────────

const ALL_PATHS = [
  `${PIRATE}/forge-tower.glb`, `${FANTASY}/forge-chimney.glb`,
  `${CASTLE}/archive-tower-base.glb`, `${CASTLE}/archive-tower-mid.glb`, `${CASTLE}/archive-tower-top.glb`,
  `${FANTASY}/sanctum-fountain.glb`, `${FANTASY}/sanctum-tree.glb`,
  `${CASTLE}/command-tower-base.glb`, `${CASTLE}/command-tower-mid.glb`, `${CASTLE}/command-tower-top.glb`, `${CASTLE}/command-tower-roof.glb`, `${CASTLE}/command-flag.glb`,
  `${CASTLE}/vault-gate.glb`, `${PIRATE}/vault-chest.glb`,
  `${FANTASY}/atelier-watermill.glb`, `${FANTASY}/atelier-lantern.glb`,
];
ALL_PATHS.forEach((p) => useGLTF.preload(p));

export { ALL_PATHS as ALL_MODEL_PATHS };
