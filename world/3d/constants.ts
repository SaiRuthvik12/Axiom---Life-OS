/**
 * 3D Scene Constants
 * Layout positions, camera config, and color palettes for the Nexus 3D view.
 */

// ─── Overview Camera (static isometric) ──────────
export const CAMERA_POSITION: [number, number, number] = [12, 12, 12];
export const CAMERA_ZOOM = 28;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 100;

// ─── Detail Camera (top-down CoC-style) ──────────
export const DETAIL_CAMERA_POSITION: [number, number, number] = [0, 15, 9];
export const DETAIL_CAMERA_ZOOM = 55;

// ─── Island Layout (overview) ────────────────────

/** Districts in unlock order, left → right on screen. */
export const DISTRICT_ORDER = ['forge', 'archive', 'sanctum', 'command', 'vault', 'atelier'] as const;

/** Spacing between buildings along the row direction. */
const ROW_SPACING = 5;

/**
 * Get the world-space [x, y, z] for a district by its index in DISTRICT_ORDER.
 * Items are placed along the (1, 0, -1) direction so they appear as a
 * horizontal row under the isometric camera at [12, 12, 12].
 */
export function getDistrictPosition(districtId: string): [number, number, number] {
  const idx = DISTRICT_ORDER.indexOf(districtId as typeof DISTRICT_ORDER[number]);
  if (idx === -1) return [0, 0, 0];

  // Center the row around the origin
  const offset = (idx - (DISTRICT_ORDER.length - 1) / 2) * ROW_SPACING;
  // (1, 0, -1) normalised ≈ (0.707, 0, -0.707)
  const d = 0.7071;
  return [
    parseFloat((offset * d).toFixed(3)),
    0,
    parseFloat((-offset * d).toFixed(3)),
  ];
}

// ─── Detail View: Terrain & Plots ────────────────
export const TERRAIN_RADIUS = 4.5;

/** 5 building plot positions in the detail view, arranged organically. */
export const PLOT_POSITIONS: [number, number, number][] = [
  [-1.8, 0, 1.6],   // T1 — front left
  [1.8, 0, 1.6],    // T2 — front right
  [-2.8, 0, -0.4],  // T3 — mid left
  [2.8, 0, -0.4],   // T4 — mid right
  [0, 0, -2.3],     // T5 — back center (crown jewel)
];

export const PLOT_RING_RADIUS = 0.7;

// ─── Color Palettes ──────────────────────────────
export interface DistrictPalette {
  base: string;
  accent: string;
  neon: string;
  rock: string;
  terrain: string;   // ground color for detail view
}

export const DISTRICT_COLORS: Record<string, DistrictPalette> = {
  forge:   { base: '#5a4a3a', accent: '#ff4444', neon: '#ff6b6b', rock: '#2a2218', terrain: '#3d2e22' },
  archive: { base: '#2a3a4a', accent: '#00d4ff', neon: '#67e8f9', rock: '#1a2530', terrain: '#1e2d3a' },
  sanctum: { base: '#3a2a4a', accent: '#a855f7', neon: '#c084fc', rock: '#251a30', terrain: '#2a1e38' },
  command: { base: '#4a3a2a', accent: '#f59e0b', neon: '#fbbf24', rock: '#302518', terrain: '#38291a' },
  vault:   { base: '#2a4a35', accent: '#10b981', neon: '#34d399', rock: '#1a3020', terrain: '#1e3828' },
  atelier: { base: '#4a2a3a', accent: '#f43f5e', neon: '#fb7185', rock: '#301a25', terrain: '#381e2a' },
};

// ─── Scene Atmosphere ────────────────────────────
export const BG_COLOR = '#09090b';
export const AMBIENT_COLOR = '#ffeedd';
export const AMBIENT_INTENSITY = 2;
export const SUN_COLOR = '#fff5e6';
export const SUN_INTENSITY = 1.6;
export const SUN_POSITION: [number, number, number] = [8, 12, 6];
export const FOG_NEAR = 18;
export const FOG_FAR = 40;
