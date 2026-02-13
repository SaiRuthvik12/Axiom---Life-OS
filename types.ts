export interface PlayerStats {
  physical: number;
  cognitive: number;
  career: number;
  financial: number;
  mental: number;
  creative: number;
}

export type StatKey = keyof PlayerStats;

export enum QuestType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export enum QuestStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
  xpReward: number;
  creditReward: number; 
  statRewards: Partial<PlayerStats>;
  penaltyDescription: string;
  status: QuestStatus;
  dataSource: 'HEALTH_API' | 'CALENDAR_API' | 'SCREEN_TIME' | 'MANUAL_OVERRIDE';
  linkedStat: StatKey;
  deadline: string;
  lastCompletedAt?: string;
  lastPenaltyAt?: string; // Tracks when this quest was last penalized (prevents repeat penalties)
  createdAt: string; 
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  minLevel: number;
  category: 'ACCESS' | 'CONSUMABLE' | 'EXPERIENCE';
  purchased: boolean;
  icon: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
}

export interface Player {
  name: string;
  avatar?: string; 
  level: number;
  currentXP: number;
  nextLevelXP: number;
  credits: number; 
  stats: PlayerStats;
  streak: number; 
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  lastActiveDate: string; // Tracks the last date the user completed a quest
}