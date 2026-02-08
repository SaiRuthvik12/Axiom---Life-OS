/**
 * World Narrative — Procedural text generation for the Nexus
 *
 * Template-based narrative that reacts to player behavior.
 * No AI dependency — runs instantly, works offline.
 *
 * Design principles:
 *   - Reinforce causality: "you did X, so Y happened"
 *   - Never overwhelm: short, atmospheric, personal
 *   - Feel earned: rare text for rare situations
 *   - No guilt-tripping: concern, not accusation
 */

import type { CompanionMood, DistrictCondition, WorldState } from './types';
import { DISTRICTS, COMPANIONS, getWorldTitle } from './constants';

// ════════════════════════════════════════
// COMPANION DIALOGUE
// Each companion has mood-based lines.
// Randomized per call for variety.
// ════════════════════════════════════════

const COMPANION_DIALOGUE: Record<string, Record<CompanionMood, string[]>> = {
  kael: {
    ELATED: [
      'The Forge has never been stronger. Your discipline humbles me.',
      'Every session, you push further. This is what mastery looks like.',
      'I have nothing left to teach you. Only to witness.',
    ],
    CONTENT: [
      'Good work today. Keep this rhythm.',
      'The training grounds are alive with energy.',
      'Consistency. That\'s the real strength.',
    ],
    NEUTRAL: [
      'Ready when you are.',
      'The equipment awaits.',
      'Another day. Let\'s see what we can do.',
    ],
    CONCERNED: [
      'It\'s been a while. The Forge needs you.',
      'Rust doesn\'t wait for motivation.',
      'I\'m still here. The question is — are you?',
    ],
    DISTRESSED: [
      'The grounds are falling apart. I can barely maintain what\'s left.',
      'This place was built on effort. It won\'t sustain itself.',
      'I don\'t know how much longer I can stay.',
    ],
    ABSENT: [],
  },
  lyra: {
    ELATED: [
      'The Archive hums with knowledge. Every query returns deeper answers.',
      'I\'ve catalogued things I didn\'t know existed. Thank you for this.',
      'Knowledge grows exponentially here. It\'s beautiful.',
    ],
    CONTENT: [
      'New data streams are flowing well. The collection grows.',
      'There\'s always more to learn. I appreciate the company.',
      'The Archive is healthy. Curiosity is well-fed.',
    ],
    NEUTRAL: [
      'The terminals are ready whenever you are.',
      'Steady state. Not growing, not shrinking.',
      'What shall we research today?',
    ],
    CONCERNED: [
      'The data streams are thinning. Knowledge needs tending.',
      'I\'m reading the same pages twice. We need new input.',
      'Have you considered that the mind, like any garden, needs water?',
    ],
    DISTRESSED: [
      'Files are corrupting. I\'m losing records faster than I can save them.',
      'The Archive is going dark, section by section.',
      'Please. There\'s so much we haven\'t preserved yet.',
    ],
    ABSENT: [],
  },
  sage: {
    ELATED: [
      'The Sanctum radiates peace. I can feel it extending beyond these walls.',
      'You\'ve found something most people search for their entire lives.',
      'Inner calm isn\'t the absence of storms. It\'s the eye within them.',
    ],
    CONTENT: [
      'The mind is clear today. That\'s worth more than any treasure.',
      'Balance. Not perfection — balance.',
      'I sense you\'re finding your center. Good.',
    ],
    NEUTRAL: [
      'The pools are still. Ready for reflection.',
      'Some days, showing up is the practice.',
      'Breathe. Begin.',
    ],
    CONCERNED: [
      'The waters are growing turbid. The mind needs attention.',
      'I notice more noise than signal lately. Let\'s sit together.',
      'Neglecting the inner world eventually costs the outer one.',
    ],
    DISTRESSED: [
      'The Sanctum trembles. Without care, peace becomes just a memory.',
      'I can barely hold the calm. The foundations are cracking.',
      'When you\'re ready, I\'ll be here. But this place may not be.',
    ],
    ABSENT: [],
  },
  vex: {
    ELATED: [
      'All systems optimal. Operations running at peak efficiency.',
      'Your strategic execution has been flawless. Command thrives.',
      'This is what leadership looks like. Every mission, delivered.',
    ],
    CONTENT: [
      'Operations are on track. Good execution this cycle.',
      'The chain of command holds strong. Well done.',
      'Results speak louder than plans. These results are speaking.',
    ],
    NEUTRAL: [
      'Awaiting directives. The Operations Deck is standing by.',
      'Status: nominal. Ready for tasking.',
      'Another cycle. What\'s the priority?',
    ],
    CONCERNED: [
      'We\'re falling behind schedule. The operations backlog is growing.',
      'Command authority weakens with inaction. Just a reminder.',
      'I\'ve seen plans fail before. It always starts with "just one more day."',
    ],
    DISTRESSED: [
      'Critical systems failing. I\'m routing around failures but it won\'t last.',
      'The Command Center needs a commander. Are you still there?',
      'Without direction, everything drifts. That\'s physics, not judgment.',
    ],
    ABSENT: [],
  },
  nyx: {
    ELATED: [
      'The Vault overflows. Your financial discipline is extraordinary.',
      'Every investment you\'ve made has compounded. This is the reward of patience.',
      'Wealth isn\'t just numbers. It\'s the freedom you\'ve built.',
    ],
    CONTENT: [
      'The ledgers are balanced. Resources are flowing.',
      'Steady growth. Not glamorous, but sustainable.',
      'You\'re building something lasting here. I appreciate that.',
    ],
    NEUTRAL: [
      'The accounts are stable. No major changes.',
      'Resources in, resources out. The cycle continues.',
      'What would you like to invest in today?',
    ],
    CONCERNED: [
      'The ledgers are showing red. We need to address this.',
      'Financial health, like physical health, requires regular checkups.',
      'Small neglect becomes large debt. You know this.',
    ],
    DISTRESSED: [
      'The Vault is hemorrhaging resources. I can\'t stop the bleed alone.',
      'Everything we built is at risk. The seals are failing.',
      'I don\'t blame you. But the numbers don\'t lie.',
    ],
    ABSENT: [],
  },
  echo: {
    ELATED: [
      'The Atelier SINGS! Every surface hums with creative energy!',
      'You\'ve made something beautiful here. I\'m in awe. Truly.',
      'Creation for its own sake — that\'s the purest form of power.',
    ],
    CONTENT: [
      'Ideas are flowing! The workshop is warm and alive.',
      'Every day you create is a day the universe didn\'t exist before. Think about that.',
      'The colors in here... they\'re yours. Nobody else could make them.',
    ],
    NEUTRAL: [
      'The tools are ready. What will we make today?',
      'Blank canvas, infinite possibility. No pressure.',
      'Even small creations matter. Just start.',
    ],
    CONCERNED: [
      'The workshop is getting dusty. Creativity needs practice.',
      'I miss the sound of making things. Do you?',
      'The muse visits those who show up. She hasn\'t visited in a while.',
    ],
    DISTRESSED: [
      'The colors are draining from everything. I can feel it.',
      'Without creation, what are we preserving? Just... empty rooms.',
      'I\'m trying to keep the spark alive, but I need help.',
    ],
    ABSENT: [],
  },
};

// ════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════

/**
 * Get a random dialogue line for a companion based on their current mood.
 */
export function getCompanionDialogue(companionId: string, mood: CompanionMood): string {
  const lines = COMPANION_DIALOGUE[companionId]?.[mood];
  if (!lines || lines.length === 0) {
    if (mood === 'ABSENT') return '...';
    return 'Silence.';
  }
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * Generate a world status summary — shown at the top of the world view.
 */
export function getWorldStatusNarrative(state: WorldState): string {
  const title = getWorldTitle(state);
  const unlockedCount = state.districts.filter(d => d.isUnlocked).length;
  const avgVitality = state.districts.length > 0
    ? Math.round(state.districts.filter(d => d.isUnlocked).reduce((s, d) => s + d.vitality, 0) / Math.max(unlockedCount, 1))
    : 0;

  if (avgVitality >= 80) {
    return `${state.nexusName} thrives under your stewardship. The ${title} stands as a testament to sustained effort.`;
  }
  if (avgVitality >= 60) {
    return `${state.nexusName} is growing well. Most districts operate smoothly, though some could use attention.`;
  }
  if (avgVitality >= 40) {
    return `${state.nexusName} holds steady. The foundation is there, but neglect is starting to show in places.`;
  }
  if (avgVitality >= 20) {
    return `${state.nexusName} is struggling. Several districts need urgent attention. The settlement can recover — but not without effort.`;
  }
  return `${state.nexusName} teeters on the edge. The work you've done isn't lost, but it's fading. Action now determines what survives.`;
}

/**
 * Get a narrative description of a district's current state.
 */
export function getDistrictNarrative(districtId: string, vitality: number): string {
  const condition = getConditionLabel(vitality);
  const districtDef = DISTRICTS.find(d => d.id === districtId);
  const name = districtDef?.name ?? districtId;

  if (vitality >= 80) return `${name} is radiant. Every structure hums with purpose, and the air itself feels charged with potential.`;
  if (vitality >= 60) return `${name} operates well. There's energy here — the kind that comes from consistent attention.`;
  if (vitality >= 40) return `${name} is stable but unremarkable. It functions, but the spark of growth has dimmed.`;
  if (vitality >= 25) return `${name} shows visible wear. Cracks form where maintenance once kept things whole.`;
  if (vitality >= 10) return `${name} is in serious decline. Systems fail, surfaces crack, and the atmosphere grows heavy.`;
  return `${name} is barely recognizable. What was built here still exists, but it's buried under neglect.`;
}

/**
 * Generate a recovery narrative when a district improves from a bad state.
 */
export function getRecoveryNarrative(districtId: string, oldVitality: number, newVitality: number): string {
  const districtDef = DISTRICTS.find(d => d.id === districtId);
  const name = districtDef?.name ?? districtId;

  if (oldVitality < 10) {
    return `Against the odds, ${name} stirs back to life. What seemed lost is being reclaimed — not through perfection, but through persistence.`;
  }
  if (oldVitality < 25) {
    return `${name} pulls back from the brink. The damage isn't erased, but the trajectory has changed. That matters more than you might think.`;
  }
  return `${name} is recovering. The effort you're putting in is visible in every restored surface.`;
}

/**
 * Get the narrative for an era transition.
 */
export function getEraTransitionNarrative(newEra: number): string {
  const narratives: Record<number, string> = {
    2: 'The frontier yields to your will. Your settlement enters an age of Expansion — new possibilities await in every direction.',
    3: 'What was once survival is now ambition. The era of Prosperity brings abundance, and the choices grow richer.',
    4: 'Your Nexus commands respect across the frontier. In this age of Dominion, your influence reshapes the world itself.',
    5: 'You have transcended the boundaries of what anyone thought possible. The Nexus is more than a settlement — it is a legacy.',
  };
  return narratives[newEra] ?? 'A new era dawns.';
}

/**
 * Get a hint about what lies beyond the fog for a locked district.
 */
export function getLockedDistrictHint(districtId: string): string {
  const districtDef = DISTRICTS.find(d => d.id === districtId);
  if (!districtDef) return 'Something stirs in the fog...';

  const hints: Record<string, string> = {
    forge: 'Heat radiates from beyond the fog. Something powerful awaits those who prove their discipline.',
    archive: 'Whispers of ancient knowledge drift from the darkness. The answers are there — for those who seek them.',
    sanctum: 'A profound stillness emanates from this region. You sense peace waiting to be claimed.',
    command: 'Through the fog, you glimpse towering structures. A seat of power, unclaimed.',
    vault: 'The sound of flowing resources echoes faintly. Prosperity lies dormant, waiting for a worthy steward.',
    atelier: 'Flashes of impossible color break through the fog. Something creative — something alive — is in there.',
  };

  return hints[districtId] ?? `${districtDef.name} lies shrouded in fog. Reach level ${districtDef.unlockLevel} to discover it.`;
}

// ════════════════════════════════════════
// INTERNAL HELPERS
// ════════════════════════════════════════

function getConditionLabel(vitality: number): DistrictCondition {
  if (vitality >= 80) return 'PRISTINE';
  if (vitality >= 60) return 'THRIVING';
  if (vitality >= 40) return 'STABLE';
  if (vitality >= 25) return 'WORN';
  if (vitality >= 10) return 'DECAYING';
  return 'RUINED';
}
