/**
 * MilestoneGallery — Grid of earned and unearned milestones.
 *
 * "Marks of Resilience" — markers of behavioral identity,
 * not achievements for hitting numbers.
 */

import React from 'react';
import {
  Hammer, MapPin, Building, Building2 as Building2Icon, Globe, Flame, Shield,
  Compass, Map, Heart, Zap, Award, Lock, HelpCircle,
} from 'lucide-react';
import type { WorldState, MilestoneState } from '../../world/types';
import { MILESTONES } from '../../world/constants';
import { formatDateShort } from '../../chronicle/utils';

interface MilestoneGalleryProps {
  worldState: WorldState;
}

const ICON_MAP: Record<string, any> = {
  Hammer, MapPin, Building, Building2: Building2Icon, Globe, Flame, Shield,
  Compass, Map, Heart, Zap, Award,
};

const RARITY_CLASSES: Record<string, string> = {
  COMMON: 'border-zinc-600/40 bg-zinc-900/30',
  UNCOMMON: 'border-emerald-600/40 bg-emerald-950/10',
  RARE: 'border-violet-500/40 bg-violet-950/10',
  LEGENDARY: 'border-amber-500/40 bg-amber-950/10 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
};

const RARITY_ICON_COLORS: Record<string, string> = {
  COMMON: 'text-zinc-400',
  UNCOMMON: 'text-emerald-400',
  RARE: 'text-violet-400',
  LEGENDARY: 'text-amber-400',
};

const RARITY_BORDER_TOP: Record<string, string> = {
  COMMON: 'border-t-zinc-600/50',
  UNCOMMON: 'border-t-emerald-500/50',
  RARE: 'border-t-violet-500/50',
  LEGENDARY: 'border-t-amber-500/50',
};

export const MilestoneGallery: React.FC<MilestoneGalleryProps> = ({ worldState }) => {
  const earned = worldState.milestones.filter(m => m.isEarned).length;
  const total = MILESTONES.length;

  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Award className="h-3.5 w-3.5" />
          Marks of Resilience
        </h3>
        <span className="text-[10px] font-mono text-zinc-600">
          {earned}/{total} earned
        </span>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {MILESTONES.map(milestoneDef => {
          const state = worldState.milestones.find(m => m.id === milestoneDef.id);
          const isEarned = state?.isEarned ?? false;
          const IconComponent = ICON_MAP[milestoneDef.icon] ?? HelpCircle;
          const rarityClass = RARITY_CLASSES[milestoneDef.rarity] ?? RARITY_CLASSES.COMMON;
          const iconColor = RARITY_ICON_COLORS[milestoneDef.rarity] ?? 'text-zinc-400';
          const borderTop = RARITY_BORDER_TOP[milestoneDef.rarity] ?? '';

          if (!isEarned) {
            return (
              <div
                key={milestoneDef.id}
                className="rounded-md border border-zinc-800/30 bg-zinc-900/20 p-3 flex flex-col items-center justify-center text-center opacity-40"
              >
                <Lock className="h-4 w-4 text-zinc-700 mb-1" />
                <span className="text-[9px] font-mono text-zinc-700">???</span>
              </div>
            );
          }

          return (
            <div
              key={milestoneDef.id}
              className={`rounded-md border border-t-2 ${rarityClass} ${borderTop} p-3 flex flex-col items-center justify-center text-center transition-all hover:scale-105`}
              title={milestoneDef.description}
            >
              <IconComponent className={`h-4 w-4 ${iconColor} mb-1`} />
              <span className="text-[9px] font-mono text-zinc-300 font-semibold leading-tight">
                {milestoneDef.name}
              </span>
              {state?.earnedAt && (
                <span className="text-[8px] font-mono text-zinc-600 mt-0.5">
                  {formatDateShort(state.earnedAt.split('T')[0])}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
