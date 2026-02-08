/**
 * DistrictCard — Visual representation of a single district
 *
 * Shows district health, structures, companion, and build options.
 * Locked districts display as fog with hints.
 */

import React, { useState } from 'react';
import {
  Flame, BookOpen, Brain, Target, Landmark, Palette,
  Lock, ChevronDown, ChevronRight, Wrench, Hammer, AlertTriangle,
  Dumbbell, Swords, HeartPulse, Orbit, Crown,
  Monitor, Microscope, Library, Atom, Sparkles,
  Flower2, Waves, TreePine, Mountain, Sun,
  Radio, LayoutDashboard, Map, Ship, Castle,
  ArrowLeftRight, Gem, Building2, TrendingUp,
  PenTool, Box, Lightbulb, Infinity,
  type LucideIcon,
} from 'lucide-react';
import type { DistrictDefinition, StructureDefinition, DistrictState, CompanionDefinition, CompanionState, StructureState } from '../types';
import { getCompanionDialogue, getLockedDistrictHint, getDistrictNarrative } from '../narrative';
import { getDistrictCondition } from '../engine';

// ── Icon Map ──
const ICON_MAP: Record<string, LucideIcon> = {
  Flame, BookOpen, Brain, Target, Landmark, Palette,
  Lock, Dumbbell, Swords, HeartPulse, Orbit, Crown,
  Monitor, Microscope, Library, Atom, Sparkles,
  Flower2, Waves, TreePine, Mountain, Sun,
  Radio, LayoutDashboard, Map, Ship, Castle,
  ArrowLeftRight, Gem, Building2, TrendingUp,
  PenTool, Wrench, Box, Lightbulb, Infinity,
};

// ── Color Mapping ──
const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string; bar: string }> = {
  red:     { bg: 'bg-red-950/30',     border: 'border-red-800/40',     text: 'text-red-400',     glow: 'shadow-red-900/20',     bar: 'bg-red-500' },
  cyan:    { bg: 'bg-cyan-950/30',    border: 'border-cyan-800/40',    text: 'text-cyan-400',    glow: 'shadow-cyan-900/20',    bar: 'bg-cyan-500' },
  violet:  { bg: 'bg-violet-950/30',  border: 'border-violet-800/40',  text: 'text-violet-400',  glow: 'shadow-violet-900/20',  bar: 'bg-violet-500' },
  amber:   { bg: 'bg-amber-950/30',   border: 'border-amber-800/40',   text: 'text-amber-400',   glow: 'shadow-amber-900/20',   bar: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-950/30', border: 'border-emerald-800/40', text: 'text-emerald-400', glow: 'shadow-emerald-900/20', bar: 'bg-emerald-500' },
  rose:    { bg: 'bg-rose-950/30',    border: 'border-rose-800/40',    text: 'text-rose-400',    glow: 'shadow-rose-900/20',    bar: 'bg-rose-500' },
};

interface DistrictCardProps {
  districtDef: DistrictDefinition;
  districtState: DistrictState;
  structures: StructureDefinition[];
  companionDef?: CompanionDefinition;
  companionState?: CompanionState;
  playerLevel: number;
  playerCredits: number;
  onBuild: (districtId: string, structureId: string) => void;
  onRepair: (districtId: string, structureId: string) => void;
}

export const DistrictCard: React.FC<DistrictCardProps> = ({
  districtDef,
  districtState,
  structures,
  companionDef,
  companionState,
  playerLevel,
  playerCredits,
  onBuild,
  onRepair,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = COLOR_MAP[districtDef.color] ?? COLOR_MAP.emerald;
  const Icon = ICON_MAP[districtDef.icon] ?? Flame;
  const condition = getDistrictCondition(districtState.vitality);
  const builtCount = districtState.structures.filter(s => s.isBuilt).length;

  // ── Locked District ──
  if (!districtState.isUnlocked) {
    return (
      <div className={`relative rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4 opacity-60 backdrop-blur-sm self-start`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/60">
            <Lock className="h-5 w-5 text-zinc-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-semibold text-zinc-500">{districtDef.name}</span>
              <span className="text-[10px] font-mono uppercase text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                LVL {districtDef.unlockLevel}
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-1 italic">{getLockedDistrictHint(districtDef.id)}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Vitality bar color ──
  const vitalityBarColor =
    districtState.vitality >= 80 ? 'bg-emerald-500' :
    districtState.vitality >= 60 ? 'bg-green-500' :
    districtState.vitality >= 40 ? 'bg-amber-500' :
    districtState.vitality >= 25 ? 'bg-orange-500' :
    districtState.vitality >= 10 ? 'bg-red-500' :
    'bg-red-800';

  // ── Condition badge ──
  const conditionColors: Record<string, string> = {
    PRISTINE: 'text-emerald-400 bg-emerald-950/50',
    THRIVING: 'text-green-400 bg-green-950/50',
    STABLE: 'text-amber-400 bg-amber-950/50',
    WORN: 'text-orange-400 bg-orange-950/50',
    DECAYING: 'text-red-400 bg-red-950/50',
    RUINED: 'text-red-300 bg-red-950/70',
  };

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} shadow-lg ${colors.glow} transition-all duration-300 self-start`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-center gap-3"
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-black/30 ${colors.text}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono font-semibold ${colors.text}`}>{districtDef.name}</span>
            <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${conditionColors[condition] ?? ''}`}>
              {condition}
            </span>
          </div>
          {/* Vitality bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${vitalityBarColor}`}
                style={{ width: `${districtState.vitality}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">{districtState.vitality}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500">{builtCount}/5</span>
          {isExpanded
            ? <ChevronDown className="h-4 w-4 text-zinc-600" />
            : <ChevronRight className="h-4 w-4 text-zinc-600" />
          }
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/50">
          {/* Narrative */}
          <p className="text-xs text-zinc-400 italic mt-3">
            {getDistrictNarrative(districtDef.id, districtState.vitality)}
          </p>

          {/* Companion */}
          {companionDef && companionState && (
            <div className="flex items-start gap-2 p-2 rounded bg-black/20">
              <div className="mt-0.5">
                {companionState.isPresent ? (
                  <div className={`h-2 w-2 rounded-full ${
                    companionState.mood === 'ELATED' ? 'bg-emerald-400' :
                    companionState.mood === 'CONTENT' ? 'bg-green-400' :
                    companionState.mood === 'NEUTRAL' ? 'bg-amber-400' :
                    companionState.mood === 'CONCERNED' ? 'bg-orange-400' :
                    'bg-red-400'
                  }`} />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-zinc-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {companionDef.name} · {companionDef.role}
                  {!companionState.isPresent && ' · DEPARTED'}
                </span>
                <p className="text-xs text-zinc-300 mt-0.5">
                  "{getCompanionDialogue(companionDef.id, companionState.mood)}"
                </p>
              </div>
            </div>
          )}

          {/* Structures */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Structures</span>
            {structures.map(structDef => {
              const structState = districtState.structures.find(s => s.id === structDef.id);
              if (!structState) return null;

              const StructIcon = ICON_MAP[structDef.icon] ?? Hammer;
              const canBuild = !structState.isBuilt && playerLevel >= structDef.unlockLevel;
              const canAfford = playerCredits >= structDef.buildCost;
              const needsRepair = structState.isBuilt && structState.condition < 95;
              const repairCost = needsRepair
                ? Math.max(10, Math.round(structDef.buildCost * ((100 - structState.condition) / 100) * 0.5))
                : 0;
              const canRepair = needsRepair && playerCredits >= repairCost;

              // Check previous tier is built
              const prevTier = structures.find(s => s.tier === structDef.tier - 1);
              const prevBuilt = !prevTier || (districtState.structures.find(s => s.id === prevTier.id)?.isBuilt ?? false);

              return (
                <div
                  key={structDef.id}
                  className={`flex items-center gap-2 p-2 rounded ${
                    structState.isBuilt ? 'bg-zinc-800/30' : 'bg-black/20'
                  } ${!structState.isBuilt && playerLevel < structDef.unlockLevel ? 'opacity-40' : ''}`}
                >
                  <StructIcon className={`h-3.5 w-3.5 ${structState.isBuilt ? colors.text : 'text-zinc-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono ${structState.isBuilt ? 'text-zinc-200' : 'text-zinc-500'}`}>
                        {structDef.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-600">T{structDef.tier}</span>
                    </div>
                    {structState.isBuilt && structState.condition < 100 && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <div className="flex-1 h-0.5 rounded-full bg-zinc-800 max-w-[60px]">
                          <div
                            className={`h-full rounded-full ${
                              structState.condition > 60 ? 'bg-green-500' :
                              structState.condition > 30 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${structState.condition}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-600">{structState.condition}%</span>
                      </div>
                    )}
                  </div>

                  {/* Build button */}
                  {!structState.isBuilt && canBuild && prevBuilt && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onBuild(districtDef.id, structDef.id); }}
                      disabled={!canAfford}
                      className={`text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                        canAfford
                          ? 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/80'
                          : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                      }`}
                      title={!canAfford ? `Need ${structDef.buildCost} credits` : `Build for ${structDef.buildCost} credits`}
                    >
                      <Hammer className="h-3 w-3" />
                      {structDef.buildCost}c
                    </button>
                  )}

                  {/* Level requirement */}
                  {!structState.isBuilt && playerLevel < structDef.unlockLevel && (
                    <span className="text-[9px] font-mono text-zinc-600">
                      LVL {structDef.unlockLevel}
                    </span>
                  )}

                  {/* Repair button */}
                  {needsRepair && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRepair(districtDef.id, structDef.id); }}
                      disabled={!canRepair}
                      className={`text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                        canRepair
                          ? 'bg-amber-900/50 text-amber-400 hover:bg-amber-900/80'
                          : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                      }`}
                      title={!canRepair ? `Need ${repairCost} credits` : `Repair for ${repairCost} credits`}
                    >
                      <Wrench className="h-3 w-3" />
                      {repairCost}c
                    </button>
                  )}

                  {/* Built indicator */}
                  {structState.isBuilt && structState.condition >= 95 && (
                    <div className={`h-2 w-2 rounded-full ${colors.bar}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
