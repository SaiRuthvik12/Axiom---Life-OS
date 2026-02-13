/**
 * Material utilities for vitality-reactive rendering.
 * Returns color strings and numeric props for R3F JSX <meshStandardMaterial>.
 *
 * All functions are pure — no Three.js objects allocated on every call
 * (we reuse two scratch Color instances).
 */

import { Color } from 'three';

// Scratch colors to avoid allocations
const _a = new Color();
const _b = new Color();

/** Linearly interpolate between two hex colors and return the result as '#rrggbb'. */
export function lerpColor(colorA: string, colorB: string, t: number): string {
  _a.set(colorA);
  _b.set(colorB);
  _a.lerp(_b, Math.max(0, Math.min(1, t)));
  return '#' + _a.getHexString();
}

// ─── Vitality Visuals ────────────────────────────

export interface VitalityVisuals {
  /** 0..1 — how saturated district materials should be */
  saturation: number;
  /** 0..1 — emissive glow intensity on accent surfaces */
  emissiveIntensity: number;
  /** Show ember / glow particles */
  showEmbers: boolean;
  /** Show dark decay fog wisps */
  showDecayFog: boolean;
  /** Point-light intensity for neon accents on the island */
  neonLightIntensity: number;
}

/** Derive visual parameters from a district's vitality (0-100). */
export function getVitalityVisuals(vitality: number): VitalityVisuals {
  if (vitality >= 80) {
    return { saturation: 1.0, emissiveIntensity: 0.5, showEmbers: true, showDecayFog: false, neonLightIntensity: 1.2 };
  }
  if (vitality >= 50) {
    return { saturation: 0.8, emissiveIntensity: 0.15, showEmbers: false, showDecayFog: false, neonLightIntensity: 0.4 };
  }
  if (vitality >= 25) {
    return { saturation: 0.4, emissiveIntensity: 0.0, showEmbers: false, showDecayFog: true, neonLightIntensity: 0.0 };
  }
  return { saturation: 0.15, emissiveIntensity: 0.0, showEmbers: false, showDecayFog: true, neonLightIntensity: 0.0 };
}

// ─── Structure Materials ─────────────────────────

const GREY = '#3a3a3a';

export interface MaterialProps {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
}

/**
 * Compute color / emissive props for a structure mesh.
 * @param baseColor    District base stone color
 * @param accentColor  District neon accent color
 * @param condition    Structure condition 0-100
 * @param isAccent     true for neon-glowing parts, false for stone/body
 */
export function getStructureMaterialProps(
  baseColor: string,
  accentColor: string,
  condition: number,
  isAccent: boolean,
): MaterialProps {
  const t = condition / 100;

  const color = isAccent
    ? lerpColor(GREY, accentColor, t)
    : lerpColor(GREY, baseColor, t * 0.7 + 0.3);

  const emissive =
    isAccent && t > 0.6
      ? lerpColor('#000000', accentColor, (t - 0.6) * 2.5)
      : '#000000';

  return {
    color,
    emissive,
    emissiveIntensity: isAccent && t > 0.6 ? 0.4 : 0,
    roughness: isAccent ? 0.3 : 0.75,
    metalness: isAccent ? 0.5 : 0.15,
  };
}

/** Compute island-base color, desaturating toward grey as vitality drops. */
export function getIslandColor(baseColor: string, vitality: number): string {
  const vis = getVitalityVisuals(vitality);
  return lerpColor(GREY, baseColor, vis.saturation);
}
