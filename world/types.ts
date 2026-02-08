/**
 * World System Types — The Nexus
 *
 * A persistent, evolving personal settlement that reflects
 * the user's real-world effort and consistency.
 *
 * Design Principles:
 *   Ownership  — Users build something they don't want to lose
 *   Curiosity  — Locked content creates pull toward the future
 *   Comparison — Artifacts show what was built, not raw numbers
 */

import type { StatKey } from '../types';

// ────────────────────────────────────────
// Enums & Unions
// ────────────────────────────────────────

export type DistrictCondition =
  | 'PRISTINE'   // 80-100 vitality
  | 'THRIVING'   // 60-79
  | 'STABLE'     // 40-59
  | 'WORN'       // 25-39
  | 'DECAYING'   // 10-24
  | 'RUINED';    // 0-9

export type CompanionMood =
  | 'ELATED'     // District pristine + high loyalty
  | 'CONTENT'    // District thriving
  | 'NEUTRAL'    // District stable
  | 'CONCERNED'  // District worn
  | 'DISTRESSED' // District decaying
  | 'ABSENT';    // District ruined — companion has left

export type WorldEra = 1 | 2 | 3 | 4 | 5;

export type ArtifactRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

export type WorldEventType =
  | 'UNLOCK'
  | 'DECAY'
  | 'RECOVERY'
  | 'DISCOVERY'
  | 'COMPANION'
  | 'MILESTONE'
  | 'BUILD';

// ────────────────────────────────────────
// Static Definitions (live in constants, never persisted)
// ────────────────────────────────────────

export interface DistrictDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  linkedStat: StatKey;
  icon: string;          // Lucide icon name
  unlockLevel: number;
  color: string;         // Tailwind color stem (e.g. 'red', 'cyan')
}

export interface StructureDefinition {
  id: string;
  name: string;
  description: string;
  districtId: string;
  tier: number;          // 1-5
  unlockLevel: number;
  buildCost: number;     // Credits
  icon: string;
}

export interface CompanionDefinition {
  id: string;
  name: string;
  role: string;
  personality: string;
  districtId: string;
}

export interface ExpeditionDefinition {
  id: string;
  name: string;
  silhouetteHint: string;   // Shown before unlock (fog of possibility)
  description: string;       // Revealed after completion
  requiredLevel: number;
  requiredStat: StatKey;
  requiredStatValue: number;
  cost: number;
  rewardDescription: string;
}

// ────────────────────────────────────────
// Mutable State (serialized to JSONB in DB)
// ────────────────────────────────────────

export interface StructureState {
  id: string;
  isBuilt: boolean;
  condition: number;     // 0-100
  builtAt?: string;
}

export interface DistrictState {
  id: string;
  isUnlocked: boolean;
  vitality: number;      // 0-100
  structures: StructureState[];
  unlockedAt?: string;
  consecutiveNeglectDays: number;
}

export interface CompanionState {
  id: string;
  isPresent: boolean;
  loyalty: number;       // 0-100
  mood: CompanionMood;
  questsSinceReturn: number;
  joinedAt?: string;
  leftAt?: string;
}

export interface ExpeditionState {
  id: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  completedAt?: string;
}

export interface MilestoneState {
  id: string;
  isEarned: boolean;
  earnedAt?: string;
}

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  title: string;
  description: string;
  timestamp: string;
  districtId?: string;
  isRead: boolean;
}

// ────────────────────────────────────────
// Top-Level World State
// ────────────────────────────────────────

export interface WorldState {
  nexusName: string;
  foundedAt: string;
  era: WorldEra;

  districts: DistrictState[];
  companions: CompanionState[];
  expeditions: ExpeditionState[];
  milestones: MilestoneState[];
  events: WorldEvent[];          // Capped at 50 most recent

  lastProcessedAt: string;

  // Aggregate tracking
  totalStructuresBuilt: number;
  totalRecoveries: number;
  longestPristineStreak: number;  // Days with all districts >= STABLE
  currentPristineStreak: number;
}

// ────────────────────────────────────────
// Output & Result Types
// ────────────────────────────────────────

export interface WorldArtifact {
  type: 'TITLE' | 'MILESTONE' | 'SNAPSHOT' | 'RECOVERY';
  label: string;
  description: string;
  icon: string;
  rarity: ArtifactRarity;
  earnedAt?: string;
}

export interface EngineResult {
  state: WorldState;
  events: WorldEvent[];
}

export interface BuildResult extends EngineResult {
  creditsCost: number;
}

export interface EngineError {
  error: string;
}
