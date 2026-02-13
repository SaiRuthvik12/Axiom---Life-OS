/**
 * IslandBase — Reusable floating hexagonal platform with rock underside.
 *
 * Used for both The Forge (large, detailed) and locked/unlocked placeholders.
 * Wraps children in a <Float> animation and provides hover + click events.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

interface IslandBaseProps {
  radius?: number;
  height?: number;
  color?: string;
  rockColor?: string;
  accentColor?: string;
  accentIntensity?: number;
  floatIntensity?: number;
  hovered?: boolean;
  onClick?: (e: THREE.Event) => void;
  onPointerOver?: (e: THREE.Event) => void;
  onPointerOut?: (e: THREE.Event) => void;
  children?: React.ReactNode;
}

/** Create a flat-top hexagon Shape for extrusion. */
function createHexagonShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export const IslandBase: React.FC<IslandBaseProps> = ({
  radius = 2,
  height = 0.35,
  color = '#5a4a3a',
  rockColor = '#2a2218',
  accentColor = '#ff4444',
  accentIntensity = 0.3,
  floatIntensity = 1,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
  children,
}) => {
  const hexGeometry = useMemo(() => {
    const shape = createHexagonShape(radius);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
    });
    // Rotate so the extrusion goes upward (+Y) and the hex lies in XZ.
    // After rotation: bottom face at y=0, top face at y=height.
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [radius, height]);

  const edgeRadius = radius * 0.92;

  return (
    <Float
      speed={1.5}
      rotationIntensity={0}
      floatIntensity={floatIntensity * 0.25}
      floatingRange={[-0.08, 0.08]}
    >
      <group
        onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onPointerOver?.(e);
        }}
        onPointerOut={(e) => {
          document.body.style.cursor = 'auto';
          onPointerOut?.(e);
        }}
      >
        {/* ── Top Platform ── */}
        <mesh geometry={hexGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={hovered ? liftColor(color) : color}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* ── Rock Underside ── */}
        <mesh position={[0, -(0.45), 0]} castShadow>
          <coneGeometry args={[radius * 0.85, 0.9, 6]} />
          <meshStandardMaterial color={rockColor} roughness={0.95} metalness={0.05} />
        </mesh>
        <mesh position={[radius * 0.3, -0.3, radius * 0.2]} castShadow>
          <coneGeometry args={[radius * 0.2, 0.5, 5]} />
          <meshStandardMaterial color={rockColor} roughness={0.95} metalness={0.05} />
        </mesh>
        <mesh position={[-radius * 0.25, -0.25, -radius * 0.3]} castShadow>
          <coneGeometry args={[radius * 0.15, 0.4, 4]} />
          <meshStandardMaterial color={rockColor} roughness={0.95} metalness={0.05} />
        </mesh>

        {/* ── Neon Edge Ring ── */}
        <mesh position={[0, height + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[edgeRadius, 0.018, 8, 6]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={hovered ? accentIntensity + 0.3 : accentIntensity}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>

        {/* ── Children (structures, lights, effects) ── */}
        <group position={[0, height + 0.06, 0]}>
          {children}
        </group>
      </group>
    </Float>
  );
};

/** Brighten a hex color slightly for hover feedback. */
function liftColor(hex: string): string {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, 0.08);
  return '#' + c.getHexString();
}
