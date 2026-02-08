/**
 * World Constants — The Nexus
 *
 * All static game data for the world system.
 * Districts, structures, companions, expeditions, milestones, and initial state.
 *
 * The Nexus is a personal frontier settlement — part space station,
 * part growing city. Chosen because:
 *   - It's buildable (structures = tangible ownership)
 *   - It's explorable (fog = curiosity)
 *   - It's personal (your name, your choices, your history)
 *   - It decays visibly (neglect has weight without cruelty)
 *   - It fits the existing sci-fi aesthetic of Axiom
 */

import type {
  DistrictDefinition,
  StructureDefinition,
  CompanionDefinition,
  ExpeditionDefinition,
  WorldState,
  DistrictState,
  CompanionState,
  ExpeditionState,
  MilestoneState,
  StructureState,
} from './types';

// ════════════════════════════════════════
// ERA DEFINITIONS
// ════════════════════════════════════════

export const ERA_NAMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Expansion',
  3: 'Prosperity',
  4: 'Dominion',
  5: 'Transcendence',
};

export const ERA_DESCRIPTIONS: Record<number, string> = {
  1: 'A fragile beginning. Every choice matters.',
  2: 'The settlement grows. New possibilities emerge.',
  3: 'Stability breeds ambition. The Nexus thrives.',
  4: 'Your influence reshapes the frontier.',
  5: 'Beyond mastery. The Nexus transcends its origins.',
};

// ════════════════════════════════════════
// DISTRICT DEFINITIONS
// 6 districts, each linked to a player stat
// ════════════════════════════════════════

export const DISTRICTS: DistrictDefinition[] = [
  {
    id: 'forge',
    name: 'The Forge',
    tagline: 'Where discipline becomes power',
    description: 'The physical training grounds of your Nexus. Raw potential is hammered into strength through sweat and perseverance.',
    linkedStat: 'physical',
    icon: 'Flame',
    unlockLevel: 1,
    color: 'red',
  },
  {
    id: 'archive',
    name: 'The Archive',
    tagline: 'Knowledge is the only true currency',
    description: 'A vast repository of knowledge and research. Every insight gathered strengthens the neural pathways of your settlement.',
    linkedStat: 'cognitive',
    icon: 'BookOpen',
    unlockLevel: 1,
    color: 'cyan',
  },
  {
    id: 'sanctum',
    name: 'The Sanctum',
    tagline: 'Still water runs deepest',
    description: 'A place of inner peace and clarity. The Sanctum strengthens the mind against the storms of daily life.',
    linkedStat: 'mental',
    icon: 'Brain',
    unlockLevel: 2,
    color: 'violet',
  },
  {
    id: 'command',
    name: 'Command Center',
    tagline: 'Vision without execution is hallucination',
    description: 'The strategic heart of your Nexus. Operations are coordinated and ambitions are translated into action.',
    linkedStat: 'career',
    icon: 'Target',
    unlockLevel: 3,
    color: 'amber',
  },
  {
    id: 'vault',
    name: 'The Vault',
    tagline: 'Fortune favors the prepared',
    description: 'Your financial stronghold. Resources flow in and out, but prosperity is built through consistent stewardship.',
    linkedStat: 'financial',
    icon: 'Landmark',
    unlockLevel: 3,
    color: 'emerald',
  },
  {
    id: 'atelier',
    name: 'The Atelier',
    tagline: 'Create what has never existed',
    description: 'The creative workshop of your Nexus. Ideas are born here, refined, and unleashed upon the world.',
    linkedStat: 'creative',
    icon: 'Palette',
    unlockLevel: 5,
    color: 'rose',
  },
];

// ════════════════════════════════════════
// STRUCTURE DEFINITIONS
// 5 tiers per district = 30 total structures
// XP (level) unlocks the right to build.
// Credits pay for construction.
// ════════════════════════════════════════

export const STRUCTURES: StructureDefinition[] = [
  // ── The Forge ──
  { id: 'forge-t1', name: 'Training Grounds',      description: 'Basic training area for physical conditioning.',                      districtId: 'forge',   tier: 1, unlockLevel: 1,  buildCost: 100,  icon: 'Dumbbell' },
  { id: 'forge-t2', name: 'Sparring Arena',         description: 'A competitive arena for pushing physical limits.',                    districtId: 'forge',   tier: 2, unlockLevel: 5,  buildCost: 300,  icon: 'Swords' },
  { id: 'forge-t3', name: 'Bio-Enhancement Lab',    description: 'Advanced recovery and performance optimization.',                    districtId: 'forge',   tier: 3, unlockLevel: 12, buildCost: 750,  icon: 'HeartPulse' },
  { id: 'forge-t4', name: 'Graviton Gym',           description: 'Variable-gravity training for peak conditioning.',                   districtId: 'forge',   tier: 4, unlockLevel: 22, buildCost: 1500, icon: 'Orbit' },
  { id: 'forge-t5', name: 'Nexus Colosseum',        description: 'The ultimate proving ground. A monument to physical mastery.',        districtId: 'forge',   tier: 5, unlockLevel: 38, buildCost: 3000, icon: 'Crown' },

  // ── The Archive ──
  { id: 'archive-t1', name: 'Data Terminal',        description: 'Access point for basic knowledge queries.',                          districtId: 'archive', tier: 1, unlockLevel: 1,  buildCost: 100,  icon: 'Monitor' },
  { id: 'archive-t2', name: 'Research Wing',        description: 'Dedicated space for deep study and analysis.',                       districtId: 'archive', tier: 2, unlockLevel: 5,  buildCost: 300,  icon: 'Microscope' },
  { id: 'archive-t3', name: 'Neural Library',       description: 'Direct-interface knowledge repository.',                             districtId: 'archive', tier: 3, unlockLevel: 12, buildCost: 750,  icon: 'Library' },
  { id: 'archive-t4', name: 'Quantum Lab',          description: 'Experimental research at the edge of understanding.',                districtId: 'archive', tier: 4, unlockLevel: 22, buildCost: 1500, icon: 'Atom' },
  { id: 'archive-t5', name: 'Omniscience Core',     description: 'The pinnacle of intellectual achievement. Knowledge bends here.',     districtId: 'archive', tier: 5, unlockLevel: 38, buildCost: 3000, icon: 'Sparkles' },

  // ── The Sanctum ──
  { id: 'sanctum-t1', name: 'Meditation Pod',       description: 'A quiet space for daily reflection.',                                districtId: 'sanctum', tier: 1, unlockLevel: 2,  buildCost: 100,  icon: 'Flower2' },
  { id: 'sanctum-t2', name: 'Reflection Pool',      description: 'Still waters for deep introspection.',                               districtId: 'sanctum', tier: 2, unlockLevel: 6,  buildCost: 300,  icon: 'Waves' },
  { id: 'sanctum-t3', name: 'Mindscape Garden',     description: 'A living garden that mirrors inner tranquility.',                    districtId: 'sanctum', tier: 3, unlockLevel: 13, buildCost: 750,  icon: 'TreePine' },
  { id: 'sanctum-t4', name: 'Serenity Spire',       description: 'A tower of calm rising above all turbulence.',                       districtId: 'sanctum', tier: 4, unlockLevel: 24, buildCost: 1500, icon: 'Mountain' },
  { id: 'sanctum-t5', name: 'Transcendence Chamber',description: 'The boundary between mind and universe dissolves here.',             districtId: 'sanctum', tier: 5, unlockLevel: 40, buildCost: 3000, icon: 'Sun' },

  // ── Command Center ──
  { id: 'command-t1', name: 'Comms Array',           description: 'Basic communications and coordination hub.',                        districtId: 'command', tier: 1, unlockLevel: 3,  buildCost: 100,  icon: 'Radio' },
  { id: 'command-t2', name: 'Operations Deck',       description: 'Centralized operations management.',                                districtId: 'command', tier: 2, unlockLevel: 8,  buildCost: 300,  icon: 'LayoutDashboard' },
  { id: 'command-t3', name: 'Strategy Room',         description: 'Advanced planning and tactical analysis.',                           districtId: 'command', tier: 3, unlockLevel: 15, buildCost: 750,  icon: 'Map' },
  { id: 'command-t4', name: 'Fleet Bridge',          description: 'Command and control for all Nexus operations.',                      districtId: 'command', tier: 4, unlockLevel: 25, buildCost: 1500, icon: 'Ship' },
  { id: 'command-t5', name: 'Sovereign Throne',      description: 'The seat of absolute authority. Your will shapes reality.',           districtId: 'command', tier: 5, unlockLevel: 42, buildCost: 3000, icon: 'Castle' },

  // ── The Vault ──
  { id: 'vault-t1', name: 'Lockbox',                description: 'Secure storage for basic resources.',                                districtId: 'vault',   tier: 1, unlockLevel: 3,  buildCost: 100,  icon: 'Lock' },
  { id: 'vault-t2', name: 'Trade Post',             description: 'Facilitates resource exchange and growth.',                          districtId: 'vault',   tier: 2, unlockLevel: 8,  buildCost: 300,  icon: 'ArrowLeftRight' },
  { id: 'vault-t3', name: 'Crypto Forge',           description: 'Advanced financial instruments and wealth generation.',              districtId: 'vault',   tier: 3, unlockLevel: 15, buildCost: 750,  icon: 'Gem' },
  { id: 'vault-t4', name: 'Reserve Bank',           description: 'Institutional-grade financial infrastructure.',                      districtId: 'vault',   tier: 4, unlockLevel: 25, buildCost: 1500, icon: 'Building2' },
  { id: 'vault-t5', name: 'Economic Engine',        description: 'The beating heart of prosperity. Wealth flows like water.',           districtId: 'vault',   tier: 5, unlockLevel: 42, buildCost: 3000, icon: 'TrendingUp' },

  // ── The Atelier ──
  { id: 'atelier-t1', name: 'Sketch Bench',         description: 'Where raw ideas first take shape.',                                  districtId: 'atelier', tier: 1, unlockLevel: 5,  buildCost: 100,  icon: 'PenTool' },
  { id: 'atelier-t2', name: "Maker's Workshop",     description: 'Tools and materials for bringing visions to life.',                  districtId: 'atelier', tier: 2, unlockLevel: 10, buildCost: 300,  icon: 'Wrench' },
  { id: 'atelier-t3', name: 'Holographic Studio',   description: 'Create in three dimensions. Ideas float in light.',                  districtId: 'atelier', tier: 3, unlockLevel: 16, buildCost: 750,  icon: 'Box' },
  { id: 'atelier-t4', name: 'Innovation Lab',       description: 'Where impossible ideas become prototypes.',                          districtId: 'atelier', tier: 4, unlockLevel: 28, buildCost: 1500, icon: 'Lightbulb' },
  { id: 'atelier-t5', name: 'Creation Engine',      description: 'Reality bends to imagination. The ultimate creative tool.',           districtId: 'atelier', tier: 5, unlockLevel: 45, buildCost: 3000, icon: 'Infinity' },
];

// ════════════════════════════════════════
// COMPANION DEFINITIONS
// One per district. They increase emotional stakes
// through presence, not guilt.
// ════════════════════════════════════════

export const COMPANIONS: CompanionDefinition[] = [
  { id: 'kael', name: 'Kael',  role: 'Combat Trainer',   personality: 'Disciplined and direct. Respects effort over results.',       districtId: 'forge' },
  { id: 'lyra', name: 'Lyra',  role: 'Chief Archivist',  personality: 'Endlessly curious. Finds beauty in knowledge.',              districtId: 'archive' },
  { id: 'sage', name: 'Sage',  role: 'Mindkeeper',       personality: 'Calm and perceptive. Speaks in truths, not judgments.',      districtId: 'sanctum' },
  { id: 'vex',  name: 'Vex',   role: 'Operations Officer',personality: 'Strategic and pragmatic. Values execution above all.',     districtId: 'command' },
  { id: 'nyx',  name: 'Nyx',   role: 'Treasurer',        personality: 'Shrewd but fair. Sees value in patience.',                  districtId: 'vault' },
  { id: 'echo', name: 'Echo',  role: 'Chief Artisan',    personality: 'Eccentric and passionate. Celebrates every act of creation.',districtId: 'atelier' },
];

// ════════════════════════════════════════
// EXPEDITION DEFINITIONS
// Fog of Possibility — users see silhouettes
// before they can launch these.
// ════════════════════════════════════════

export const EXPEDITIONS: ExpeditionDefinition[] = [
  {
    id: 'exp-signal',
    name: 'Signal in the Deep',
    silhouetteHint: 'A faint pulse echoes from beneath the surface...',
    description: 'You follow a mysterious signal deep underground, discovering an ancient training sanctum carved into living rock.',
    requiredLevel: 5,
    requiredStat: 'physical',
    requiredStatValue: 25,
    cost: 200,
    rewardDescription: 'Discovered the Sunken Arena — a hidden chamber that accelerates Forge recovery.',
  },
  {
    id: 'exp-codex',
    name: 'The Lost Codex',
    silhouetteHint: 'Fragments of an unknown language appear in your data streams...',
    description: 'A corrupted data fragment leads you to an ancient repository of forgotten knowledge, preserved in crystalline memory.',
    requiredLevel: 10,
    requiredStat: 'cognitive',
    requiredStatValue: 30,
    cost: 400,
    rewardDescription: 'Recovered the Codex of Synthesis — knowledge that accelerates Archive growth.',
  },
  {
    id: 'exp-ghost',
    name: 'Ghost Fleet',
    silhouetteHint: 'Derelict ships drift at the edge of scanner range...',
    description: 'You investigate abandoned vessels adrift in the void, salvaging command protocols from a civilization that vanished overnight.',
    requiredLevel: 8,
    requiredStat: 'career',
    requiredStatValue: 25,
    cost: 300,
    rewardDescription: "Salvaged the Admiral's Protocols — command artifacts that bolster operational authority.",
  },
  {
    id: 'exp-treasury',
    name: 'The Sunken Treasury',
    silhouetteHint: 'Your sensors detect refined metals in an inaccessible region...',
    description: 'A hidden cache of resources from a bygone era. The wealth within is staggering, preserved behind ancient cryptographic seals.',
    requiredLevel: 6,
    requiredStat: 'financial',
    requiredStatValue: 20,
    cost: 250,
    rewardDescription: 'Found the Midas Catalyst — reduces all structure build costs by 10%.',
  },
  {
    id: 'exp-dream',
    name: "Dreamwalker's Path",
    silhouetteHint: 'Your dreams have been unusually vivid lately...',
    description: 'Through deep meditation, you access a plane of pure consciousness. You return with clarity that radiates outward.',
    requiredLevel: 15,
    requiredStat: 'mental',
    requiredStatValue: 35,
    cost: 500,
    rewardDescription: 'Achieved Dreamwalker Status — the Sanctum radiates calm that slows decay across all districts.',
  },
  {
    id: 'exp-resonance',
    name: 'The Resonance',
    silhouetteHint: 'Colors appear where none should exist. Something is calling...',
    description: 'You tune into a frequency of pure creative energy that permeates the frontier. Channeling it transforms the Atelier.',
    requiredLevel: 12,
    requiredStat: 'creative',
    requiredStatValue: 30,
    cost: 400,
    rewardDescription: 'Harnessed The Resonance — structures in the Atelier slowly self-repair over time.',
  },
];

// ════════════════════════════════════════
// MILESTONE DEFINITIONS
// Conditions are evaluated at runtime, never serialized.
// ════════════════════════════════════════

export interface MilestoneDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  condition: (state: WorldState) => boolean;
}

export const MILESTONES: MilestoneDefinition[] = [
  {
    id: 'ms-first-build',
    name: 'First Foundation',
    description: 'Build your first structure.',
    icon: 'Hammer',
    rarity: 'COMMON',
    condition: (s) => s.totalStructuresBuilt >= 1,
  },
  {
    id: 'ms-all-districts',
    name: 'Pioneer',
    description: 'Unlock all six districts.',
    icon: 'MapPin',
    rarity: 'UNCOMMON',
    condition: (s) => s.districts.every(d => d.isUnlocked),
  },
  {
    id: 'ms-10-structures',
    name: 'Architect',
    description: 'Build 10 structures across your Nexus.',
    icon: 'Building',
    rarity: 'UNCOMMON',
    condition: (s) => s.totalStructuresBuilt >= 10,
  },
  {
    id: 'ms-20-structures',
    name: 'Master Builder',
    description: 'Build 20 structures. Your Nexus is becoming a wonder.',
    icon: 'Building2',
    rarity: 'RARE',
    condition: (s) => s.totalStructuresBuilt >= 20,
  },
  {
    id: 'ms-all-structures',
    name: 'World Shaper',
    description: 'Build all 30 structures. The Nexus is complete.',
    icon: 'Globe',
    rarity: 'LEGENDARY',
    condition: (s) => s.totalStructuresBuilt >= 30,
  },
  {
    id: 'ms-phoenix',
    name: 'Phoenix Rising',
    description: 'Recover a district from critical condition. Resilience matters more than perfection.',
    icon: 'Flame',
    rarity: 'UNCOMMON',
    condition: (s) => s.totalRecoveries >= 1,
  },
  {
    id: 'ms-ironclad',
    name: 'Ironclad',
    description: 'All unlocked districts in PRISTINE condition simultaneously.',
    icon: 'Shield',
    rarity: 'RARE',
    condition: (s) => {
      const unlocked = s.districts.filter(d => d.isUnlocked);
      return unlocked.length >= 2 && unlocked.every(d => d.vitality >= 80);
    },
  },
  {
    id: 'ms-explorer',
    name: 'Explorer',
    description: 'Complete your first expedition into the unknown.',
    icon: 'Compass',
    rarity: 'UNCOMMON',
    condition: (s) => s.expeditions.some(e => e.isCompleted),
  },
  {
    id: 'ms-cartographer',
    name: 'Cartographer',
    description: 'Complete all expeditions. The frontier holds no more secrets.',
    icon: 'Map',
    rarity: 'LEGENDARY',
    condition: (s) => s.expeditions.every(e => e.isCompleted),
  },
  {
    id: 'ms-beloved',
    name: 'Beloved',
    description: 'All present companions at ELATED mood.',
    icon: 'Heart',
    rarity: 'RARE',
    condition: (s) => {
      const present = s.companions.filter(c => c.isPresent);
      return present.length >= 3 && present.every(c => c.mood === 'ELATED');
    },
  },
  {
    id: 'ms-streak-7',
    name: 'Steadfast',
    description: 'Maintain all districts above STABLE for 7 consecutive days.',
    icon: 'Zap',
    rarity: 'UNCOMMON',
    condition: (s) => s.currentPristineStreak >= 7,
  },
  {
    id: 'ms-streak-30',
    name: 'Unyielding',
    description: 'Maintain all districts above STABLE for 30 consecutive days.',
    icon: 'Award',
    rarity: 'LEGENDARY',
    condition: (s) => s.currentPristineStreak >= 30,
  },
];

// ════════════════════════════════════════
// WORLD TITLES
// Based on total structures and average vitality
// ════════════════════════════════════════

export function getWorldTitle(state: WorldState): string {
  const avgVitality = state.districts.length > 0
    ? state.districts.reduce((sum, d) => sum + d.vitality, 0) / state.districts.length
    : 0;
  const s = state.totalStructuresBuilt;

  if (s >= 30 && avgVitality >= 80) return 'Transcendent Nexus';
  if (s >= 25 && avgVitality >= 70) return 'Legendary Bastion';
  if (s >= 20 && avgVitality >= 60) return 'Grand Citadel';
  if (s >= 15 && avgVitality >= 50) return 'Prosperous Haven';
  if (s >= 10 && avgVitality >= 40) return 'Thriving Nexus';
  if (s >= 5)  return 'Growing Colony';
  if (s >= 1)  return 'Fledgling Settlement';
  if (avgVitality < 15 && state.districts.some(d => d.isUnlocked)) return 'Abandoned Outpost';
  return 'Uncharted Territory';
}

// ════════════════════════════════════════
// INITIAL STATE FACTORY
// ════════════════════════════════════════

export function createInitialWorldState(nexusName: string): WorldState {
  const now = new Date().toISOString();

  // Initialize district states with structure slots
  const districts: DistrictState[] = DISTRICTS.map(d => ({
    id: d.id,
    isUnlocked: d.unlockLevel <= 1, // Forge and Archive start unlocked
    vitality: d.unlockLevel <= 1 ? 50 : 0,
    structures: STRUCTURES
      .filter(s => s.districtId === d.id)
      .map((s): StructureState => ({
        id: s.id,
        isBuilt: false,
        condition: 100,
      })),
    unlockedAt: d.unlockLevel <= 1 ? now : undefined,
    consecutiveNeglectDays: 0,
  }));

  // Initialize companion states
  const companions: CompanionState[] = COMPANIONS.map(c => {
    const district = DISTRICTS.find(d => d.id === c.districtId);
    const isUnlocked = district ? district.unlockLevel <= 1 : false;
    return {
      id: c.id,
      isPresent: isUnlocked,
      loyalty: 0,
      mood: isUnlocked ? 'NEUTRAL' as const : 'ABSENT' as const,
      questsSinceReturn: 0,
      joinedAt: isUnlocked ? now : undefined,
    };
  });

  // Initialize expedition states
  const expeditions: ExpeditionState[] = EXPEDITIONS.map(e => ({
    id: e.id,
    isUnlocked: false,
    isCompleted: false,
  }));

  // Initialize milestone states
  const milestones: MilestoneState[] = MILESTONES.map(m => ({
    id: m.id,
    isEarned: false,
  }));

  return {
    nexusName,
    foundedAt: now,
    era: 1,
    districts,
    companions,
    expeditions,
    milestones,
    events: [{
      id: `evt-${Date.now()}`,
      type: 'UNLOCK',
      title: 'The Nexus Awakens',
      description: `${nexusName} has been founded on the frontier. The Forge and Archive stand ready. Your journey begins.`,
      timestamp: now,
      isRead: false,
    }],
    lastProcessedAt: now,
    totalStructuresBuilt: 0,
    totalRecoveries: 0,
    longestPristineStreak: 0,
    currentPristineStreak: 0,
  };
}
