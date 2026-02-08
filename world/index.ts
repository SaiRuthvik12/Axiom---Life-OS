/**
 * World System — Public API
 *
 * The Nexus: A persistent, evolving personal settlement
 * that reflects real-world effort and consistency.
 *
 * Import everything you need from 'world/' through this barrel export.
 *
 * Architecture:
 *   types.ts      → Type definitions
 *   constants.ts  → Static game data (districts, structures, companions, etc.)
 *   engine.ts     → Pure game logic (no side effects)
 *   narrative.ts  → Procedural text generation
 *   service.ts    → Supabase persistence
 *   components/   → React UI components
 */

// ── Types ──
export type {
  DistrictCondition,
  CompanionMood,
  WorldEra,
  ArtifactRarity,
  WorldEventType,
  DistrictDefinition,
  StructureDefinition,
  CompanionDefinition,
  ExpeditionDefinition,
  StructureState,
  DistrictState,
  CompanionState,
  ExpeditionState,
  MilestoneState,
  WorldEvent,
  WorldState,
  WorldArtifact,
  EngineResult,
  BuildResult,
  EngineError,
} from './types';

// ── Constants ──
export {
  ERA_NAMES,
  ERA_DESCRIPTIONS,
  DISTRICTS,
  STRUCTURES,
  COMPANIONS,
  EXPEDITIONS,
  MILESTONES,
  getWorldTitle,
  createInitialWorldState,
} from './constants';

// ── Engine ──
export {
  getDistrictCondition,
  getCompanionMood,
  calculateEra,
  processQuestCompletion,
  processQuestUncompletion,
  processDecay,
  buildStructure,
  repairStructure,
  launchExpedition,
  markEventRead,
  getWorldArtifacts,
  getWorldContextForGM,
} from './engine';

// ── Narrative ──
export {
  getCompanionDialogue,
  getWorldStatusNarrative,
  getDistrictNarrative,
  getRecoveryNarrative,
  getEraTransitionNarrative,
  getLockedDistrictHint,
} from './narrative';

// ── Service ──
export { WorldService } from './service';

// ── Components ──
export { WorldView } from './components/WorldView';
export { DistrictCard } from './components/DistrictCard';
export { CompanionPanel } from './components/CompanionPanel';
export { ArtifactCard } from './components/ArtifactCard';
