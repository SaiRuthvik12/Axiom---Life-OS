import { Player, Quest, QuestStatus, QuestType, Reward } from './types';
import { getLocalDate } from './lib/dateUtils';

export const LEVEL_TITLES: Record<number, string> = {
  1: "Initiate",
  3: "Cadet",
  5: "Operative",
  10: "Specialist",
  15: "Vanguard",
  20: "Elite",
  30: "Architect",
  40: "Overseer",
  50: "Ascendant",
  100: "Deity"
};

export const getLevelTitle = (level: number): string => {
  const levels = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  const matchedLevel = levels.find(l => level >= l) || 1;
  return LEVEL_TITLES[matchedLevel];
};

export const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Axiom1&backgroundColor=18181b",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Ghost&backgroundColor=18181b",
  "https://api.dicebear.com/7.x/bottts/svg?seed=System&backgroundColor=18181b",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Neon&backgroundColor=18181b",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber&backgroundColor=18181b",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Glitch&backgroundColor=18181b",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Operative&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Hacker&backgroundColor=c0aede",
];

export const INITIAL_PLAYER: Player = {
  name: "Operative",
  avatar: AVATAR_PRESETS[0],
  level: 1,
  currentXP: 0,
  nextLevelXP: 1000,
  credits: 0,
  streak: 0,
  riskTolerance: 'MEDIUM',
  stats: {
    physical: 10,
    cognitive: 10,
    career: 10,
    financial: 10,
    mental: 10,
    creative: 10,
  },
  lastActiveDate: getLocalDate() // Default to today so streaks start fresh
};

export const MOCK_QUESTS: Quest[] = [
  {
    id: 'q-1',
    title: 'Metabolic Activation',
    description: 'Maintain Zone 2 heart rate for 45 minutes.',
    type: QuestType.DAILY,
    difficulty: 'MEDIUM',
    xpReward: 150,
    creditReward: 50,
    statRewards: { physical: 3, mental: 1 },
    penaltyDescription: 'Donate $10 to opposing political party.',
    status: QuestStatus.VERIFYING,
    dataSource: 'HEALTH_API',
    linkedStat: 'physical',
    deadline: '23:59',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-2',
    title: 'Deep Work Block Alpha',
    description: '120 minutes of uninterrupted coding/writing. No social media.',
    type: QuestType.DAILY,
    difficulty: 'HARD',
    xpReward: 300,
    creditReward: 100,
    statRewards: { cognitive: 5, career: 2 },
    penaltyDescription: 'Lock access to entertainment apps for 24h.',
    status: QuestStatus.PENDING,
    dataSource: 'SCREEN_TIME',
    linkedStat: 'cognitive',
    deadline: '18:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-3',
    title: 'Financial Audit',
    description: 'Review weekly spending and categorize all transactions.',
    type: QuestType.WEEKLY,
    difficulty: 'EASY',
    xpReward: 100,
    creditReward: 25,
    statRewards: { financial: 4 },
    penaltyDescription: '-50 XP and increased difficulty next week.',
    status: QuestStatus.COMPLETED,
    dataSource: 'MANUAL_OVERRIDE', 
    linkedStat: 'financial',
    deadline: 'Sunday 20:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-4',
    title: 'Project Axiom MVP',
    description: 'Ship the initial prototype of the life OS.',
    type: QuestType.EPIC,
    difficulty: 'EXTREME',
    xpReward: 5000,
    creditReward: 2000,
    statRewards: { career: 10, creative: 5, cognitive: 5 },
    penaltyDescription: 'Public shaming via social media integration.',
    status: QuestStatus.PENDING,
    dataSource: 'MANUAL_OVERRIDE',
    linkedStat: 'career',
    deadline: 'Month End',
    createdAt: new Date().toISOString(),
  }
];

export const MOCK_REWARDS: Reward[] = [
  {
    id: 'r-1',
    title: 'Dopamine Protocol',
    description: 'Unlock 60 minutes of video streaming services.',
    cost: 150,
    minLevel: 1,
    category: 'ACCESS',
    purchased: false,
    icon: 'Tv'
  },
  {
    id: 'r-2',
    title: 'Cheat Meal Authorization',
    description: 'One meal exemption from nutritional constraints.',
    cost: 500,
    minLevel: 5,
    category: 'CONSUMABLE',
    purchased: false,
    icon: 'Pizza'
  },
  {
    id: 'r-3',
    title: 'Hardware Upgrade',
    description: 'Permission to purchase new peripheral device (<$200).',
    cost: 3000,
    minLevel: 10,
    category: 'EXPERIENCE',
    purchased: false,
    icon: 'Cpu'
  },
  {
    id: 'r-4',
    title: 'Social Event: Night Out',
    description: 'Unlock budget and time for social gathering.',
    cost: 800,
    minLevel: 3,
    category: 'EXPERIENCE',
    purchased: false,
    icon: 'GlassWater'
  },
  {
    id: 'r-5',
    title: 'Sabbatical Day',
    description: '24h freeze on all non-critical Daily Quests. No penalties.',
    cost: 2000,
    minLevel: 8,
    category: 'ACCESS',
    purchased: false,
    icon: 'PauseCircle'
  }
];

export const SYSTEM_LOGS = [
  { id: 'l1', timestamp: '08:00:01', message: 'System initialized. Connecting to bio-sensors...', type: 'INFO' },
  { id: 'l2', timestamp: '08:00:05', message: 'Sleep data analyzed. Recovery score: 88%.', type: 'SUCCESS' },
  { id: 'l3', timestamp: '10:15:00', message: 'Productivity drop detected. Nudge protocol initiated.', type: 'WARNING' },
];