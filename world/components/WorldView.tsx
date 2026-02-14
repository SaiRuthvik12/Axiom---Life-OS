/**
 * WorldView — Main world page for the Nexus
 *
 * Shows the full world state: districts, companions, events,
 * expeditions, and artifacts. This is the emotional center
 * of the application — where ownership becomes tangible.
 */

import React, { useState } from 'react';
import {
  Globe, Clock, Star, Compass, Eye, ChevronDown, ChevronRight,
  AlertTriangle, Sparkles, Lock, Coins, Award,
} from 'lucide-react';
import type { WorldState, WorldEvent, WorldArtifact } from '../types';
import type { StatKey, PlayerStats } from '../../types';
import { DISTRICTS, STRUCTURES, COMPANIONS, EXPEDITIONS, ERA_NAMES, ERA_DESCRIPTIONS, getWorldTitle } from '../constants';
import { getWorldArtifacts } from '../engine';
import { getWorldStatusNarrative } from '../narrative';
import { DistrictCard } from './DistrictCard';
import { CompanionPanel } from './CompanionPanel';
import { ArtifactCard } from './ArtifactCard';
import type { Player } from '../../types';

interface WorldViewProps {
  worldState: WorldState;
  player: Player;
  onBuildStructure: (districtId: string, structureId: string) => void;
  onRepairStructure: (districtId: string, structureId: string) => void;
  onLaunchExpedition: (expeditionId: string) => void;
  onEventRead: (eventId: string) => void;
}

export const WorldView: React.FC<WorldViewProps> = ({
  worldState,
  player,
  onBuildStructure,
  onRepairStructure,
  onLaunchExpedition,
  onEventRead,
}) => {
  const [showEvents, setShowEvents] = useState(false);
  const [showExpeditions, setShowExpeditions] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(false);

  const worldTitle = getWorldTitle(worldState);
  const statusNarrative = getWorldStatusNarrative(worldState);
  const artifacts = getWorldArtifacts(worldState, player);
  const unreadEvents = worldState.events.filter(e => !e.isRead);
  const unlockedCount = worldState.districts.filter(d => d.isUnlocked).length;
  const avgVitality = unlockedCount > 0
    ? Math.round(worldState.districts.filter(d => d.isUnlocked).reduce((s, d) => s + d.vitality, 0) / unlockedCount)
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/60 p-4 md:p-5">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-5 w-5 text-emerald-400 shrink-0" />
          <h2 className="text-lg font-mono font-bold text-white truncate">
            {(player.name?.trim() || 'Operative')}'s Nexus
          </h2>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/30">
            {worldTitle}
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-400 border border-zinc-700/40">
            Era of {ERA_NAMES[worldState.era] ?? 'Foundation'}
          </span>
        </div>

        {/* Narrative */}
        <p className="text-xs text-zinc-400 italic">{statusNarrative}</p>

        {/* Stats bar */}
        <div className="grid grid-cols-3 md:flex md:items-center gap-3 md:gap-6 mt-4 pt-3 border-t border-zinc-800/50">
          <StatBadge label="Districts" value={`${unlockedCount}/6`} />
          <StatBadge label="Structures" value={`${worldState.totalStructuresBuilt}/30`} />
          <StatBadge label="Avg Vitality" value={`${avgVitality}%`} />
          <StatBadge label="Recoveries" value={`${worldState.totalRecoveries}`} />
          <StatBadge label="Best Streak" value={`${worldState.longestPristineStreak}d`} />
          {unreadEvents.length > 0 && (
            <div className="col-span-3 md:col-span-1 md:ml-auto flex items-center gap-1 text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-[10px] font-mono">{unreadEvents.length} new events</span>
            </div>
          )}
        </div>
      </div>

      {/* ── District Grid ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-mono font-semibold text-zinc-400 uppercase">Districts</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {DISTRICTS.map(districtDef => {
            const districtState = worldState.districts.find(d => d.id === districtDef.id);
            if (!districtState) return null;

            const districtStructures = STRUCTURES.filter(s => s.districtId === districtDef.id);
            const companionDef = COMPANIONS.find(c => c.districtId === districtDef.id);
            const companionState = companionDef
              ? worldState.companions.find(c => c.id === companionDef.id)
              : undefined;

            return (
              <DistrictCard
                key={districtDef.id}
                districtDef={districtDef}
                districtState={districtState}
                structures={districtStructures}
                companionDef={companionDef}
                companionState={companionState}
                playerLevel={player.level}
                playerCredits={player.credits}
                onBuild={onBuildStructure}
                onRepair={onRepairStructure}
              />
            );
          })}
        </div>
      </div>

      {/* ── Companions Panel ── */}
      <CompanionPanel
        companions={COMPANIONS}
        companionStates={worldState.companions}
        districts={worldState.districts}
      />

      {/* ── Expeditions ── */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/60">
        <button
          onClick={() => setShowExpeditions(!showExpeditions)}
          className="w-full p-4 flex items-center gap-2 text-left"
        >
          <Compass className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-mono font-semibold text-zinc-400 uppercase flex-1">
            Expeditions
          </span>
          <span className="text-[10px] font-mono text-zinc-600">
            {worldState.expeditions.filter(e => e.isCompleted).length}/{EXPEDITIONS.length} completed
          </span>
          {showExpeditions
            ? <ChevronDown className="h-4 w-4 text-zinc-600" />
            : <ChevronRight className="h-4 w-4 text-zinc-600" />
          }
        </button>

        {showExpeditions && (
          <div className="px-4 pb-4 space-y-2 border-t border-zinc-800/50 pt-3">
            {EXPEDITIONS.map(expDef => {
              const expState = worldState.expeditions.find(e => e.id === expDef.id);
              if (!expState) return null;

              const statValue = (player.stats as Record<string, number>)[expDef.requiredStat] ?? 0;
              const meetsReqs = player.level >= expDef.requiredLevel && statValue >= expDef.requiredStatValue;
              const canAfford = player.credits >= expDef.cost;

              return (
                <div
                  key={expDef.id}
                  className={`p-3 rounded border transition-all ${
                    expState.isCompleted
                      ? 'border-emerald-800/30 bg-emerald-950/10'
                      : expState.isUnlocked
                        ? 'border-amber-800/30 bg-amber-950/10'
                        : 'border-zinc-800/30 bg-black/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {expState.isCompleted ? (
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                      ) : expState.isUnlocked ? (
                        <Compass className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Lock className="h-4 w-4 text-zinc-600" />
                      )}
                      <span className={`text-xs font-mono font-semibold ${
                        expState.isCompleted ? 'text-emerald-400' :
                        expState.isUnlocked ? 'text-amber-300' : 'text-zinc-500'
                      }`}>
                        {expState.isUnlocked || expState.isCompleted ? expDef.name : '???'}
                      </span>
                    </div>

                    {expState.isUnlocked && !expState.isCompleted && (
                      <button
                        onClick={() => onLaunchExpedition(expDef.id)}
                        disabled={!meetsReqs || !canAfford}
                        className={`text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                          meetsReqs && canAfford
                            ? 'bg-amber-900/50 text-amber-400 hover:bg-amber-900/80'
                            : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        <Compass className="h-3 w-3" />
                        Launch · {expDef.cost}c
                      </button>
                    )}

                    {expState.isCompleted && (
                      <span className="text-[10px] font-mono text-emerald-600">COMPLETED</span>
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-500 mt-1.5 italic">
                    {expState.isCompleted
                      ? expDef.rewardDescription
                      : expState.isUnlocked
                        ? expDef.silhouetteHint
                        : 'Something stirs in the fog...'
                    }
                  </p>

                  {expState.isUnlocked && !expState.isCompleted && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[9px] font-mono text-zinc-600">
                        Requires: LVL {expDef.requiredLevel} · {expDef.requiredStat} {expDef.requiredStatValue}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Events Log ── */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/60">
        <button
          onClick={() => setShowEvents(!showEvents)}
          className="w-full p-4 flex items-center gap-2 text-left"
        >
          <Clock className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-mono font-semibold text-zinc-400 uppercase flex-1">
            World Events
          </span>
          {unreadEvents.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-400">
              {unreadEvents.length} new
            </span>
          )}
          {showEvents
            ? <ChevronDown className="h-4 w-4 text-zinc-600" />
            : <ChevronRight className="h-4 w-4 text-zinc-600" />
          }
        </button>

        {showEvents && (
          <div className="px-4 pb-4 space-y-2 border-t border-zinc-800/50 pt-3 max-h-64 overflow-y-auto">
            {worldState.events.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No events yet. Complete quests to shape your world.</p>
            ) : (
              worldState.events.map(event => (
                <EventRow key={event.id} event={event} onRead={onEventRead} />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Artifacts (Social) ── */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/60">
        <button
          onClick={() => setShowArtifacts(!showArtifacts)}
          className="w-full p-4 flex items-center gap-2 text-left"
        >
          <Award className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-mono font-semibold text-zinc-400 uppercase flex-1">
            Artifacts & Milestones
          </span>
          <span className="text-[10px] font-mono text-zinc-600">
            {artifacts.length} earned
          </span>
          {showArtifacts
            ? <ChevronDown className="h-4 w-4 text-zinc-600" />
            : <ChevronRight className="h-4 w-4 text-zinc-600" />
          }
        </button>

        {showArtifacts && (
          <div className="px-4 pb-4 space-y-2 border-t border-zinc-800/50 pt-3">
            {artifacts.map((artifact, i) => (
              <ArtifactCard key={`${artifact.type}-${i}`} artifact={artifact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ──

const StatBadge: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span className="text-[9px] font-mono text-zinc-600 uppercase block">{label}</span>
    <span className="text-sm font-mono text-zinc-300 font-semibold">{value}</span>
  </div>
);

const EVENT_TYPE_COLORS: Record<string, string> = {
  UNLOCK: 'text-cyan-400',
  DECAY: 'text-red-400',
  RECOVERY: 'text-emerald-400',
  DISCOVERY: 'text-amber-400',
  COMPANION: 'text-violet-400',
  MILESTONE: 'text-yellow-400',
  BUILD: 'text-green-400',
};

const EventRow: React.FC<{ event: WorldEvent; onRead: (id: string) => void }> = ({ event, onRead }) => {
  const typeColor = EVENT_TYPE_COLORS[event.type] ?? 'text-zinc-400';
  const timeStr = new Date(event.timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className={`flex items-start gap-2 p-2 rounded transition-colors ${
        event.isRead ? 'bg-black/10' : 'bg-zinc-800/30 cursor-pointer hover:bg-zinc-800/50'
      }`}
      onClick={() => !event.isRead && onRead(event.id)}
    >
      <div className={`mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
        event.isRead ? 'bg-zinc-800' : 'bg-amber-400'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-mono font-semibold ${typeColor}`}>
            {event.type}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">{event.title}</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5">{event.description}</p>
      </div>
      <span className="text-[9px] font-mono text-zinc-700 whitespace-nowrap">{timeStr}</span>
    </div>
  );
};
