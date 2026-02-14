/**
 * Chronicle Types — The Progress Archive
 *
 * Types for the daily log, world snapshots, timeline events,
 * and pattern insights that power the Chronicle tab.
 */

import type { DistrictCondition, CompanionMood, WorldEventType } from '../world/types';

// ────────────────────────────────────────
// Day Rating — how a day is classified
// ────────────────────────────────────────

export type DayRating =
  | 'strong'     // 3+ quests, no penalties, positive world events
  | 'steady'     // 1-2 quests completed, stable world
  | 'neutral'    // Some activity, no quests completed
  | 'light'      // Logged in but minimal activity
  | 'recovery'   // Completed quests after previous absent/light days
  | 'absent';    // No login or no activity

// ────────────────────────────────────────
// Compact World Snapshot — stored in daily_logs
// ────────────────────────────────────────

export interface CompactDistrictSnapshot {
  id: string;
  vitality: number;
  condition: DistrictCondition;
  structuresBuilt: number;
}

export interface CompactWorldSnapshot {
  era: number;
  totalStructuresBuilt: number;
  worldTitle: string;
  districts: CompactDistrictSnapshot[];
  companionMoods: Record<string, CompanionMood>;
}

// ────────────────────────────────────────
// Compact World Event — stored in daily_logs.world_events
// ────────────────────────────────────────

export interface CompactWorldEvent {
  type: WorldEventType;
  title: string;
  districtId?: string;
}

// ────────────────────────────────────────
// Daily Log — one per user per day
// ────────────────────────────────────────

export interface DailyLog {
  id: string;
  userId: string;
  logDate: string;            // YYYY-MM-DD

  // Quest activity
  questsCompleted: number;
  questsPending: number;
  questTitles: string[];
  questTypes: string[];
  statsTouched: string[];

  // Economy
  xpEarned: number;
  xpLost: number;
  creditsEarned: number;
  creditsSpent: number;

  // Player snapshot
  playerLevel: number;
  totalXp: number;
  streakCount: number;

  // World snapshot
  worldSnapshot: CompactWorldSnapshot | null;

  // World events
  worldEvents: CompactWorldEvent[];

  // AI narrative
  narrativeSummary: string | null;

  // Day classification
  dayRating: DayRating;
}

// ────────────────────────────────────────
// Timeline Event — for the Timeline view
// ────────────────────────────────────────

export type TimelineCategory =
  | 'era'
  | 'district'
  | 'structure'
  | 'companion'
  | 'recovery'
  | 'milestone'
  | 'expedition'
  | 'decay'
  | 'levelup'
  | 'streak';

export interface TimelineItem {
  id: string;
  date: string;               // YYYY-MM-DD
  category: TimelineCategory;
  title: string;
  description: string;
  districtId?: string;
  icon: string;               // Lucide icon name
  color: string;              // Tailwind color class
}

// ────────────────────────────────────────
// Pattern Insights
// ────────────────────────────────────────

export interface PatternInsight {
  id: string;
  icon: string;
  label: string;
  detail: string;
  tone: 'positive' | 'neutral' | 'gentle';
}

// ────────────────────────────────────────
// Chronicle View Mode
// ────────────────────────────────────────

export type ChronicleMode = 'daylog' | 'overview' | 'timeline';
