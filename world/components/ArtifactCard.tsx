/**
 * ArtifactCard — Public-facing representation of progress
 *
 * Others compare WHAT WAS BUILT, not raw XP.
 * Artifacts inspire through accomplishment, not shame.
 */

import React from 'react';
import {
  Globe, Shield, Compass, Map, Heart, Award, Zap, Flame,
  Hammer, MapPin, Building, Building2, Camera, RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import type { WorldArtifact } from '../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Globe, Shield, Compass, Map, Heart, Award, Zap, Flame,
  Hammer, MapPin, Building, Building2, Camera, RotateCcw,
};

const RARITY_STYLES: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  COMMON:    { border: 'border-zinc-700',   text: 'text-zinc-400',    bg: 'bg-zinc-900/60',    glow: '' },
  UNCOMMON:  { border: 'border-green-800',  text: 'text-green-400',   bg: 'bg-green-950/20',   glow: 'shadow-green-900/10' },
  RARE:      { border: 'border-blue-700',   text: 'text-blue-400',    bg: 'bg-blue-950/20',    glow: 'shadow-blue-900/10' },
  LEGENDARY: { border: 'border-amber-600',  text: 'text-amber-400',   bg: 'bg-amber-950/20',   glow: 'shadow-amber-900/20 shadow-lg' },
};

interface ArtifactCardProps {
  artifact: WorldArtifact;
  compact?: boolean;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, compact = false }) => {
  const styles = RARITY_STYLES[artifact.rarity] ?? RARITY_STYLES.COMMON;
  const Icon = ICON_MAP[artifact.icon] ?? Globe;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${styles.border} ${styles.bg}`}>
        <Icon className={`h-3 w-3 ${styles.text}`} />
        <span className={`text-[10px] font-mono ${styles.text}`}>{artifact.label}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} ${styles.glow} p-3 transition-all duration-300`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-black/30 ${styles.text}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-semibold ${styles.text}`}>
              {artifact.label}
            </span>
            <span className={`text-[8px] font-mono uppercase px-1 py-0.5 rounded ${styles.border} ${styles.text} border`}>
              {artifact.rarity}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">{artifact.description}</p>
          {artifact.earnedAt && (
            <span className="text-[9px] font-mono text-zinc-700 mt-1 block">
              {new Date(artifact.earnedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
