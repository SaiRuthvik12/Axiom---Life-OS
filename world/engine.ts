/**
 * World Engine — Pure game logic for the Nexus
 *
 * All functions are pure: they take state in and return new state out.
 * No side effects, no database calls, no randomness in core logic.
 * The caller is responsible for persisting results.
 *
 * Core loop:
 *   Quest completed  → processQuestCompletion()  → vitality ↑, unlocks, mood ↑
 *   Day passes (idle) → processDecay()            → vitality ↓, condition ↓, mood ↓
 *   Player builds     → buildStructure()          → credits spent, structure active
 *   Player repairs    → repairStructure()         → credits spent, condition restored
 *   Player explores   → launchExpedition()        → credits spent, discovery made
 */

import type {
  WorldState,
  WorldEvent,
  EngineResult,
  BuildResult,
  EngineError,
  DistrictCondition,
  CompanionMood,
  WorldEra,
  WorldArtifact,
} from './types';
import type { Quest, Player, StatKey, PlayerStats } from '../types';
import { DISTRICTS, STRUCTURES, COMPANIONS, EXPEDITIONS, MILESTONES, getWorldTitle, ERA_NAMES } from './constants';

// ════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════

function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getDistrictCondition(vitality: number): DistrictCondition {
  if (vitality >= 80) return 'PRISTINE';
  if (vitality >= 60) return 'THRIVING';
  if (vitality >= 40) return 'STABLE';
  if (vitality >= 25) return 'WORN';
  if (vitality >= 10) return 'DECAYING';
  return 'RUINED';
}

export function getCompanionMood(vitality: number, loyalty: number): CompanionMood {
  if (vitality < 10) return 'ABSENT';
  if (vitality >= 80 && loyalty >= 50) return 'ELATED';
  if (vitality >= 60) return 'CONTENT';
  if (vitality >= 40) return 'NEUTRAL';
  if (vitality >= 25) return 'CONCERNED';
  return 'DISTRESSED';
}

export function calculateEra(level: number): WorldEra {
  if (level >= 50) return 5;
  if (level >= 30) return 4;
  if (level >= 15) return 3;
  if (level >= 5) return 2;
  return 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ════════════════════════════════════════
// QUEST COMPLETION
// Called when a user completes a quest.
// Boosts vitality in districts linked to quest stats.
// ════════════════════════════════════════

export function processQuestCompletion(
  state: WorldState,
  quest: Quest,
  player: Player,
): EngineResult {
  const newState = deepClone(state);
  const events: WorldEvent[] = [];
  const now = new Date().toISOString();

  // Determine affected stats from quest rewards
  const affectedStats = Object.keys(quest.statRewards || {}) as StatKey[];
  if (affectedStats.length === 0 && quest.linkedStat) {
    affectedStats.push(quest.linkedStat);
  }

  for (const stat of affectedStats) {
    const districtDef = DISTRICTS.find(d => d.linkedStat === stat);
    if (!districtDef) continue;

    const districtState = newState.districts.find(d => d.id === districtDef.id);
    if (!districtState || !districtState.isUnlocked) continue;

    const oldVitality = districtState.vitality;
    const oldCondition = getDistrictCondition(oldVitality);

    // Vitality boost scales with difficulty and quest type
    const difficultyMult: Record<string, number> = { EASY: 0.6, MEDIUM: 1, HARD: 1.5, EXTREME: 2 };
    const typeMult: Record<string, number> = { DAILY: 1, WEEKLY: 1.5, EPIC: 2, LEGENDARY: 3 };
    const boost = Math.round(
      5 * (difficultyMult[quest.difficulty] ?? 1) * (typeMult[quest.type] ?? 1)
    );

    districtState.vitality = clamp(districtState.vitality + boost, 0, 100);
    districtState.consecutiveNeglectDays = 0;

    const newCondition = getDistrictCondition(districtState.vitality);

    // Recovery event: climbing out of DECAYING/RUINED
    if (
      (oldCondition === 'RUINED' || oldCondition === 'DECAYING') &&
      (newCondition !== 'RUINED' && newCondition !== 'DECAYING')
    ) {
      newState.totalRecoveries++;
      events.push({
        id: generateEventId(),
        type: 'RECOVERY',
        title: `${districtDef.name} Recovering`,
        description: `Through sustained effort, ${districtDef.name} shows signs of renewal. The damage is healing.`,
        timestamp: now,
        districtId: districtDef.id,
        isRead: false,
      });
    }

    // Update companion
    const companionDef = COMPANIONS.find(c => c.districtId === districtDef.id);
    if (companionDef) {
      const companionState = newState.companions.find(c => c.id === companionDef.id);
      if (companionState) {
        companionState.loyalty = clamp(companionState.loyalty + 1, 0, 100);

        // Companion returns after 3 quests in their district while absent
        if (!companionState.isPresent) {
          companionState.questsSinceReturn++;
          if (companionState.questsSinceReturn >= 3 && districtState.vitality >= 15) {
            companionState.isPresent = true;
            companionState.mood = 'NEUTRAL';
            companionState.leftAt = undefined;
            companionState.questsSinceReturn = 0;
            events.push({
              id: generateEventId(),
              type: 'COMPANION',
              title: `${companionDef.name} Returns`,
              description: `${companionDef.name} has returned to ${districtDef.name}. "I knew you'd come back," they say quietly.`,
              timestamp: now,
              districtId: districtDef.id,
              isRead: false,
            });
          }
        } else {
          companionState.mood = getCompanionMood(districtState.vitality, companionState.loyalty);
        }
      }
    }
  }

  // Update era based on player level
  newState.era = calculateEra(player.level);

  // Check for district unlocks
  for (const districtDef of DISTRICTS) {
    const districtState = newState.districts.find(d => d.id === districtDef.id);
    if (districtState && !districtState.isUnlocked && player.level >= districtDef.unlockLevel) {
      districtState.isUnlocked = true;
      districtState.unlockedAt = now;
      districtState.vitality = 50; // Start at STABLE

      // Activate companion
      const companionDef = COMPANIONS.find(c => c.districtId === districtDef.id);
      if (companionDef) {
        const companionState = newState.companions.find(c => c.id === companionDef.id);
        if (companionState) {
          companionState.isPresent = true;
          companionState.mood = 'NEUTRAL';
          companionState.joinedAt = now;
        }
      }

      events.push({
        id: generateEventId(),
        type: 'UNLOCK',
        title: `${districtDef.name} Discovered`,
        description: `A new region emerges from the fog. ${districtDef.tagline}.`,
        timestamp: now,
        districtId: districtDef.id,
        isRead: false,
      });
    }
  }

  // Check expedition unlocks (based on player stats and level)
  for (const expDef of EXPEDITIONS) {
    const expState = newState.expeditions.find(e => e.id === expDef.id);
    if (expState && !expState.isUnlocked) {
      const statValue = player.stats[expDef.requiredStat] ?? 0;
      if (player.level >= expDef.requiredLevel && statValue >= expDef.requiredStatValue) {
        expState.isUnlocked = true;
        events.push({
          id: generateEventId(),
          type: 'DISCOVERY',
          title: 'New Expedition Available',
          description: `"${expDef.name}" — ${expDef.silhouetteHint}`,
          timestamp: now,
          isRead: false,
        });
      }
    }
  }

  // Check milestones
  checkMilestones(newState, events, now);

  // Append events, keep last 50
  newState.events = [...events, ...newState.events].slice(0, 50);
  newState.lastProcessedAt = now;

  return { state: newState, events };
}

// ════════════════════════════════════════
// QUEST UN-COMPLETION
// Called when a user revokes a quest completion.
// Reverses the vitality boost — no events generated.
// ════════════════════════════════════════

export function processQuestUncompletion(
  state: WorldState,
  quest: Quest,
): WorldState {
  const newState = deepClone(state);

  const affectedStats = Object.keys(quest.statRewards || {}) as StatKey[];
  if (affectedStats.length === 0 && quest.linkedStat) {
    affectedStats.push(quest.linkedStat);
  }

  for (const stat of affectedStats) {
    const districtDef = DISTRICTS.find(d => d.linkedStat === stat);
    if (!districtDef) continue;

    const districtState = newState.districts.find(d => d.id === districtDef.id);
    if (!districtState || !districtState.isUnlocked) continue;

    // Reverse the same boost formula
    const difficultyMult: Record<string, number> = { EASY: 0.6, MEDIUM: 1, HARD: 1.5, EXTREME: 2 };
    const typeMult: Record<string, number> = { DAILY: 1, WEEKLY: 1.5, EPIC: 2, LEGENDARY: 3 };
    const boost = Math.round(
      5 * (difficultyMult[quest.difficulty] ?? 1) * (typeMult[quest.type] ?? 1)
    );

    districtState.vitality = clamp(districtState.vitality - boost, 0, 100);

    // Update companion mood to reflect new vitality
    const companionDef = COMPANIONS.find(c => c.districtId === districtDef.id);
    if (companionDef) {
      const companionState = newState.companions.find(c => c.id === companionDef.id);
      if (companionState && companionState.isPresent) {
        companionState.mood = getCompanionMood(districtState.vitality, companionState.loyalty);
      }
    }
  }

  newState.lastProcessedAt = new Date().toISOString();
  return newState;
}

// ════════════════════════════════════════
// DECAY PROCESSING
// Called during daily reset. Reduces vitality
// for districts whose linked stats had no completed quests.
// ════════════════════════════════════════

export function processDecay(
  state: WorldState,
  completedStats: StatKey[],
): EngineResult {
  const newState = deepClone(state);
  const events: WorldEvent[] = [];
  const now = new Date().toISOString();

  for (const districtDef of DISTRICTS) {
    const districtState = newState.districts.find(d => d.id === districtDef.id);
    if (!districtState || !districtState.isUnlocked) continue;

    const wasActive = completedStats.includes(districtDef.linkedStat);
    const oldCondition = getDistrictCondition(districtState.vitality);

    if (wasActive) {
      // Active district: small passive vitality boost, reset neglect
      districtState.vitality = clamp(districtState.vitality + 2, 0, 100);
      districtState.consecutiveNeglectDays = 0;
    } else {
      // Neglected district: accelerating decay
      districtState.consecutiveNeglectDays++;
      const decayAmount = Math.min(15, 3 + districtState.consecutiveNeglectDays * 2);
      districtState.vitality = clamp(districtState.vitality - decayAmount, 0, 100);
    }

    const newCondition = getDistrictCondition(districtState.vitality);

    // Generate decay event on condition change
    if (!wasActive && newCondition !== oldCondition && (
      newCondition === 'WORN' || newCondition === 'DECAYING' || newCondition === 'RUINED'
    )) {
      events.push({
        id: generateEventId(),
        type: 'DECAY',
        title: `${districtDef.name}: ${newCondition}`,
        description: getDecayDescription(districtDef.id, newCondition),
        timestamp: now,
        districtId: districtDef.id,
        isRead: false,
      });
    }

    // Degrade structures when vitality is low
    if (districtState.vitality < 50) {
      for (const structure of districtState.structures) {
        if (structure.isBuilt && structure.condition > 0) {
          const degradeRate = districtState.vitality < 25 ? 8 : 4;
          structure.condition = clamp(structure.condition - degradeRate, 0, 100);
        }
      }
    }

    // Update companion
    const companionDef = COMPANIONS.find(c => c.districtId === districtDef.id);
    if (companionDef) {
      const companionState = newState.companions.find(c => c.id === companionDef.id);
      if (companionState) {
        const newMood = getCompanionMood(districtState.vitality, companionState.loyalty);

        // Companion leaves when district is RUINED
        if (companionState.isPresent && districtState.vitality < 10) {
          companionState.isPresent = false;
          companionState.mood = 'ABSENT';
          companionState.leftAt = now;
          companionState.questsSinceReturn = 0;
          events.push({
            id: generateEventId(),
            type: 'COMPANION',
            title: `${companionDef.name} Has Left`,
            description: `${districtDef.name} has fallen too far. ${companionDef.name} has departed, but may return if conditions improve.`,
            timestamp: now,
            districtId: districtDef.id,
            isRead: false,
          });
        } else if (companionState.isPresent) {
          companionState.mood = newMood;
          // Loyalty erodes slightly during neglect
          if (!wasActive) {
            companionState.loyalty = clamp(companionState.loyalty - 1, 0, 100);
          }
        }
      }
    }
  }

  // Update pristine streak (once per day, in decay processing)
  const unlockedDistricts = newState.districts.filter(d => d.isUnlocked);
  if (unlockedDistricts.length > 0 && unlockedDistricts.every(d => d.vitality >= 40)) {
    newState.currentPristineStreak++;
    newState.longestPristineStreak = Math.max(
      newState.longestPristineStreak,
      newState.currentPristineStreak,
    );
  } else {
    newState.currentPristineStreak = 0;
  }

  // Check milestones
  checkMilestones(newState, events, now);

  newState.events = [...events, ...newState.events].slice(0, 50);
  newState.lastProcessedAt = now;

  return { state: newState, events };
}

// ════════════════════════════════════════
// BUILD STRUCTURE
// XP (level) gates what CAN be built.
// Credits pay the construction cost.
// ════════════════════════════════════════

export function buildStructure(
  state: WorldState,
  districtId: string,
  structureId: string,
  playerLevel: number,
  playerCredits: number,
): BuildResult | EngineError {
  const structureDef = STRUCTURES.find(s => s.id === structureId);
  if (!structureDef) return { error: 'Structure not found.' };
  if (structureDef.districtId !== districtId) return { error: 'Structure does not belong to this district.' };

  const districtState = state.districts.find(d => d.id === districtId);
  if (!districtState?.isUnlocked) return { error: 'District is not yet unlocked.' };

  const structureState = districtState.structures.find(s => s.id === structureId);
  if (!structureState) return { error: 'Structure slot not found.' };
  if (structureState.isBuilt) return { error: 'Structure is already built.' };

  if (playerLevel < structureDef.unlockLevel) {
    return { error: `Requires level ${structureDef.unlockLevel}. Current: ${playerLevel}.` };
  }

  // Check that previous tier is built
  const prevTierStructure = STRUCTURES.find(
    s => s.districtId === districtId && s.tier === structureDef.tier - 1
  );
  if (prevTierStructure) {
    const prevState = districtState.structures.find(s => s.id === prevTierStructure.id);
    if (prevState && !prevState.isBuilt) {
      return { error: `Build ${prevTierStructure.name} first (Tier ${prevTierStructure.tier}).` };
    }
  }

  if (playerCredits < structureDef.buildCost) {
    return { error: `Not enough credits. Need ${structureDef.buildCost}, have ${playerCredits}.` };
  }

  // Execute build
  const newState = deepClone(state);
  const now = new Date().toISOString();
  const events: WorldEvent[] = [];

  const district = newState.districts.find(d => d.id === districtId)!;
  const structure = district.structures.find(s => s.id === structureId)!;
  structure.isBuilt = true;
  structure.condition = 100;
  structure.builtAt = now;

  newState.totalStructuresBuilt++;

  // Building boosts district vitality
  district.vitality = clamp(district.vitality + 5, 0, 100);

  events.push({
    id: generateEventId(),
    type: 'BUILD',
    title: `${structureDef.name} Constructed`,
    description: `${structureDef.description} The ${DISTRICTS.find(d => d.id === districtId)?.name} grows stronger.`,
    timestamp: now,
    districtId,
    isRead: false,
  });

  // Check milestones
  checkMilestones(newState, events, now);

  newState.events = [...events, ...newState.events].slice(0, 50);
  newState.lastProcessedAt = now;

  return { state: newState, events, creditsCost: structureDef.buildCost };
}

// ════════════════════════════════════════
// REPAIR STRUCTURE
// Cost scales with damage: more decay = more expensive.
// Recovery is always possible but costly.
// ════════════════════════════════════════

export function repairStructure(
  state: WorldState,
  districtId: string,
  structureId: string,
  playerCredits: number,
): BuildResult | EngineError {
  const structureDef = STRUCTURES.find(s => s.id === structureId);
  if (!structureDef) return { error: 'Structure not found.' };

  const districtState = state.districts.find(d => d.id === districtId);
  if (!districtState) return { error: 'District not found.' };

  const structureState = districtState.structures.find(s => s.id === structureId);
  if (!structureState) return { error: 'Structure slot not found.' };
  if (!structureState.isBuilt) return { error: 'Structure has not been built yet.' };
  if (structureState.condition >= 95) return { error: 'Structure is in good condition.' };

  // Repair cost: proportional to damage, never exceeds original build cost
  const damagePercent = (100 - structureState.condition) / 100;
  const repairCost = Math.max(10, Math.round(structureDef.buildCost * damagePercent * 0.5));

  if (playerCredits < repairCost) {
    return { error: `Not enough credits. Need ${repairCost}, have ${playerCredits}.` };
  }

  const newState = deepClone(state);
  const now = new Date().toISOString();
  const events: WorldEvent[] = [];

  const district = newState.districts.find(d => d.id === districtId)!;
  const structure = district.structures.find(s => s.id === structureId)!;
  structure.condition = 100;

  events.push({
    id: generateEventId(),
    type: 'RECOVERY',
    title: `${structureDef.name} Repaired`,
    description: `${structureDef.name} has been restored to full operational capacity.`,
    timestamp: now,
    districtId,
    isRead: false,
  });

  checkMilestones(newState, events, now);

  newState.events = [...events, ...newState.events].slice(0, 50);
  newState.lastProcessedAt = now;

  return { state: newState, events, creditsCost: repairCost };
}

// ════════════════════════════════════════
// LAUNCH EXPEDITION
// Consumes credits, reveals hidden content.
// ════════════════════════════════════════

export function launchExpedition(
  state: WorldState,
  expeditionId: string,
  playerCredits: number,
  playerLevel: number,
  playerStats: PlayerStats,
): BuildResult | EngineError {
  const expDef = EXPEDITIONS.find(e => e.id === expeditionId);
  if (!expDef) return { error: 'Expedition not found.' };

  const expState = state.expeditions.find(e => e.id === expeditionId);
  if (!expState) return { error: 'Expedition state not found.' };
  if (expState.isCompleted) return { error: 'Expedition already completed.' };
  if (!expState.isUnlocked) return { error: 'Expedition not yet unlocked.' };

  if (playerLevel < expDef.requiredLevel) {
    return { error: `Requires level ${expDef.requiredLevel}.` };
  }

  const statValue = playerStats[expDef.requiredStat] ?? 0;
  if (statValue < expDef.requiredStatValue) {
    return { error: `Requires ${expDef.requiredStat} stat at ${expDef.requiredStatValue}. Current: ${statValue}.` };
  }

  if (playerCredits < expDef.cost) {
    return { error: `Not enough credits. Need ${expDef.cost}, have ${playerCredits}.` };
  }

  const newState = deepClone(state);
  const now = new Date().toISOString();
  const events: WorldEvent[] = [];

  const expedition = newState.expeditions.find(e => e.id === expeditionId)!;
  expedition.isCompleted = true;
  expedition.completedAt = now;

  events.push({
    id: generateEventId(),
    type: 'DISCOVERY',
    title: `Expedition Complete: ${expDef.name}`,
    description: `${expDef.description}\n\n${expDef.rewardDescription}`,
    timestamp: now,
    isRead: false,
  });

  checkMilestones(newState, events, now);

  newState.events = [...events, ...newState.events].slice(0, 50);
  newState.lastProcessedAt = now;

  return { state: newState, events, creditsCost: expDef.cost };
}

// ════════════════════════════════════════
// MARK EVENT READ
// ════════════════════════════════════════

export function markEventRead(state: WorldState, eventId: string): WorldState {
  const newState = deepClone(state);
  const event = newState.events.find(e => e.id === eventId);
  if (event) event.isRead = true;
  return newState;
}

// ════════════════════════════════════════
// WORLD ARTIFACTS (Social Comparison)
// Generate public-facing artifacts from world state.
// Others compare WHAT WAS BUILT, not raw XP.
// ════════════════════════════════════════

export function getWorldArtifacts(state: WorldState, player: Player): WorldArtifact[] {
  const artifacts: WorldArtifact[] = [];

  // World title artifact
  const title = getWorldTitle(state);
  artifacts.push({
    type: 'TITLE',
    label: title,
    description: `${state.nexusName} — ${title}`,
    icon: 'Globe',
    rarity: state.totalStructuresBuilt >= 25 ? 'LEGENDARY'
      : state.totalStructuresBuilt >= 15 ? 'RARE'
      : state.totalStructuresBuilt >= 5 ? 'UNCOMMON' : 'COMMON',
  });

  // Milestone artifacts
  for (const ms of state.milestones) {
    if (ms.isEarned) {
      const def = MILESTONES.find(m => m.id === ms.id);
      if (def) {
        artifacts.push({
          type: 'MILESTONE',
          label: def.name,
          description: def.description,
          icon: def.icon,
          rarity: def.rarity,
          earnedAt: ms.earnedAt,
        });
      }
    }
  }

  // Recovery artifact (if they've bounced back)
  if (state.totalRecoveries > 0) {
    const rarity = state.totalRecoveries >= 5 ? 'LEGENDARY'
      : state.totalRecoveries >= 3 ? 'RARE' : 'UNCOMMON';
    artifacts.push({
      type: 'RECOVERY',
      label: `${state.totalRecoveries}x Recovery`,
      description: `Recovered from critical conditions ${state.totalRecoveries} time${state.totalRecoveries > 1 ? 's' : ''}. Resilience, not perfection.`,
      icon: 'RotateCcw',
      rarity,
    });
  }

  // Snapshot artifact (world overview)
  const unlockedCount = state.districts.filter(d => d.isUnlocked).length;
  artifacts.push({
    type: 'SNAPSHOT',
    label: `${state.totalStructuresBuilt} Structures · ${unlockedCount} Districts`,
    description: `Era of ${ERA_NAMES[state.era] ?? 'Foundation'} · Founded ${new Date(state.foundedAt).toLocaleDateString()}`,
    icon: 'Camera',
    rarity: 'COMMON',
    earnedAt: state.foundedAt,
  });

  return artifacts;
}

// ════════════════════════════════════════
// AI GAME MASTER CONTEXT
// Returns world state summary for the AI to reference.
// ════════════════════════════════════════

export function getWorldContextForGM(state: WorldState): string {
  const lines: string[] = [];
  const title = getWorldTitle(state);

  lines.push(`[NEXUS STATE: "${state.nexusName}" — ${title}]`);
  lines.push(`Era: ${ERA_NAMES[state.era] ?? 'Foundation'} | Structures: ${state.totalStructuresBuilt}/30 | Recoveries: ${state.totalRecoveries}`);

  for (const districtDef of DISTRICTS) {
    const ds = state.districts.find(d => d.id === districtDef.id);
    if (!ds) continue;

    if (!ds.isUnlocked) {
      lines.push(`  ${districtDef.name}: [LOCKED — requires level ${districtDef.unlockLevel}]`);
      continue;
    }

    const condition = getDistrictCondition(ds.vitality);
    const builtCount = ds.structures.filter(s => s.isBuilt).length;
    const companionDef = COMPANIONS.find(c => c.districtId === districtDef.id);
    const companionState = state.companions.find(c => c.id === companionDef?.id);

    lines.push(
      `  ${districtDef.name}: ${condition} (${ds.vitality}%) | ${builtCount}/5 structures` +
      (companionState ? ` | ${companionDef?.name}: ${companionState.mood}` : '')
    );

    if (ds.consecutiveNeglectDays > 0) {
      lines.push(`    ⚠ ${ds.consecutiveNeglectDays} days neglected`);
    }
  }

  const recentEvents = state.events.filter(e => !e.isRead).slice(0, 3);
  if (recentEvents.length > 0) {
    lines.push(`\nRecent world events:`);
    for (const e of recentEvents) {
      lines.push(`  - ${e.title}: ${e.description.slice(0, 80)}...`);
    }
  }

  return lines.join('\n');
}

// ════════════════════════════════════════
// INTERNAL HELPERS
// ════════════════════════════════════════

function checkMilestones(state: WorldState, events: WorldEvent[], now: string): void {
  for (const milestone of MILESTONES) {
    const ms = state.milestones.find(m => m.id === milestone.id);
    if (ms && !ms.isEarned && milestone.condition(state)) {
      ms.isEarned = true;
      ms.earnedAt = now;
      events.push({
        id: generateEventId(),
        type: 'MILESTONE',
        title: `Milestone: ${milestone.name}`,
        description: milestone.description,
        timestamp: now,
        isRead: false,
      });
    }
  }
}

function getDecayDescription(districtId: string, condition: DistrictCondition): string {
  const descriptions: Record<string, Record<string, string>> = {
    forge: {
      WORN: 'The training grounds grow quiet. Dust settles on unused equipment.',
      DECAYING: 'Cracks spread across the Forge floor. The fires burn low.',
      RUINED: 'The Forge lies silent. Its fires have gone cold.',
    },
    archive: {
      WORN: 'Pages gather dust. The Archive\'s light dims slightly.',
      DECAYING: 'Data corruption spreads through the stacks. Knowledge fades.',
      RUINED: 'The Archive has gone dark. Centuries of knowledge at risk.',
    },
    sanctum: {
      WORN: 'The meditation spaces feel restless. The calm is fraying.',
      DECAYING: 'Weeds choke the reflection pools. Serenity slips away.',
      RUINED: 'The Sanctum is desolate. Only echoes of peace remain.',
    },
    command: {
      WORN: 'Comm channels crackle with static. Operations slow.',
      DECAYING: 'Warning lights flash across the Operations Deck. Systems falter.',
      RUINED: 'Command Center is offline. Authority has collapsed.',
    },
    vault: {
      WORN: 'Resource flows slow to a trickle. The ledgers need attention.',
      DECAYING: 'The Vault\'s seals weaken. Wealth bleeds into the void.',
      RUINED: 'The Vault stands empty. Financial infrastructure has failed.',
    },
    atelier: {
      WORN: 'The workshop feels uninspired. Tools sit idle.',
      DECAYING: 'Creative energy drains from the Atelier. Colors fade.',
      RUINED: 'The Atelier is a hollow shell. Imagination has abandoned it.',
    },
  };

  return descriptions[districtId]?.[condition] ?? `${districtId} condition has deteriorated to ${condition}.`;
}
