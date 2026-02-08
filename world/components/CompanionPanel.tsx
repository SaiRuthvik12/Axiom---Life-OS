/**
 * CompanionPanel — Overview of all companions and their moods
 *
 * Companions increase emotional stakes through presence, not guilt.
 * Their absence is more impactful than any words.
 */

import React from 'react';
import { Users, UserX } from 'lucide-react';
import type { CompanionDefinition, CompanionState, DistrictState } from '../types';
import { DISTRICTS } from '../constants';
import { getCompanionDialogue } from '../narrative';

interface CompanionPanelProps {
  companions: CompanionDefinition[];
  companionStates: CompanionState[];
  districts: DistrictState[];
}

const MOOD_INDICATOR: Record<string, { color: string; label: string }> = {
  ELATED:     { color: 'bg-emerald-400', label: 'Elated' },
  CONTENT:    { color: 'bg-green-400',   label: 'Content' },
  NEUTRAL:    { color: 'bg-amber-400',   label: 'Neutral' },
  CONCERNED:  { color: 'bg-orange-400',  label: 'Concerned' },
  DISTRESSED: { color: 'bg-red-400',     label: 'Distressed' },
  ABSENT:     { color: 'bg-zinc-700',    label: 'Departed' },
};

export const CompanionPanel: React.FC<CompanionPanelProps> = ({
  companions,
  companionStates,
  districts,
}) => {
  const presentCount = companionStates.filter(c => c.isPresent).length;

  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-zinc-500" />
        <span className="text-xs font-mono font-semibold text-zinc-400 uppercase">
          Companions
        </span>
        <span className="text-[10px] font-mono text-zinc-600 ml-auto">
          {presentCount}/{companions.length} present
        </span>
      </div>

      <div className="space-y-2">
        {companions.map(compDef => {
          const compState = companionStates.find(c => c.id === compDef.id);
          if (!compState) return null;

          const districtDef = DISTRICTS.find(d => d.id === compDef.districtId);
          const districtState = districts.find(d => d.id === compDef.districtId);
          const mood = MOOD_INDICATOR[compState.mood] ?? MOOD_INDICATOR.ABSENT;
          const isUnlocked = districtState?.isUnlocked ?? false;

          if (!isUnlocked) {
            return (
              <div key={compDef.id} className="flex items-center gap-2 p-2 rounded bg-black/20 opacity-40">
                <div className="h-2 w-2 rounded-full bg-zinc-800" />
                <span className="text-[10px] font-mono text-zinc-700">???</span>
                <span className="text-[10px] font-mono text-zinc-800 ml-auto">Unknown</span>
              </div>
            );
          }

          return (
            <div key={compDef.id} className="flex items-start gap-2 p-2 rounded bg-black/20">
              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${mood.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-zinc-300">{compDef.name}</span>
                  <span className="text-[9px] font-mono text-zinc-600">·</span>
                  <span className="text-[9px] font-mono text-zinc-500">{districtDef?.name}</span>
                  <span className={`text-[9px] font-mono ml-auto ${
                    compState.isPresent ? 'text-zinc-600' : 'text-red-800'
                  }`}>
                    {mood.label}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                  {compState.isPresent
                    ? `"${getCompanionDialogue(compDef.id, compState.mood)}"`
                    : <span className="flex items-center gap-1"><UserX className="h-3 w-3" /> Has departed. Complete quests to bring them back.</span>
                  }
                </p>
                {/* Loyalty bar */}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[8px] font-mono text-zinc-700 uppercase">Loyalty</span>
                  <div className="flex-1 h-0.5 rounded-full bg-zinc-800 max-w-[80px]">
                    <div
                      className="h-full rounded-full bg-zinc-600 transition-all duration-300"
                      style={{ width: `${compState.loyalty}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-700">{compState.loyalty}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
