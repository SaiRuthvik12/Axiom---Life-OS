/**
 * Chronicle Utilities — Day rating, snapshot creation, pattern analysis
 *
 * Pure functions for classifying days, creating compact world snapshots,
 * building timeline events, and computing pattern insights.
 */

import type { Quest, QuestStatus, Player, PlayerStats, StatKey } from '../types';
import type { WorldState, WorldEvent } from '../world/types';
import type {
  DayRating,
  DailyLog,
  CompactWorldSnapshot,
  CompactWorldEvent,
  TimelineItem,
  PatternInsight,
  TimelineCategory,
} from './types';
import { getDistrictCondition } from '../world/engine';
import { DISTRICTS, COMPANIONS, getWorldTitle } from '../world/constants';

// ════════════════════════════════════════
// DAY RATING CLASSIFICATION
// ════════════════════════════════════════

export function classifyDay(
  questsCompleted: number,
  xpLost: number,
  worldEvents: CompactWorldEvent[],
  previousDayRating?: DayRating,
): DayRating {
  // Recovery: came back after absent/light days
  if (
    questsCompleted > 0 &&
    (previousDayRating === 'absent' || previousDayRating === 'light')
  ) {
    return 'recovery';
  }

  // Strong: 3+ quests, no penalties
  if (questsCompleted >= 3 && xpLost === 0) {
    return 'strong';
  }

  // Steady: 1-2 quests completed
  if (questsCompleted >= 1) {
    return 'steady';
  }

  // Light: had some world events but no quests
  if (worldEvents.length > 0) {
    return 'light';
  }

  return 'neutral';
}

// ════════════════════════════════════════
// COMPACT WORLD SNAPSHOT
// ════════════════════════════════════════

export function createCompactWorldSnapshot(worldState: WorldState): CompactWorldSnapshot {
  const companionMoods: Record<string, string> = {};
  for (const c of worldState.companions) {
    companionMoods[c.id] = c.mood;
  }

  return {
    era: worldState.era,
    totalStructuresBuilt: worldState.totalStructuresBuilt,
    worldTitle: getWorldTitle(worldState),
    districts: worldState.districts
      .filter(d => d.isUnlocked)
      .map(d => ({
        id: d.id,
        vitality: d.vitality,
        condition: getDistrictCondition(d.vitality),
        structuresBuilt: d.structures.filter(s => s.isBuilt).length,
      })),
    companionMoods: companionMoods as any,
  };
}

// ════════════════════════════════════════
// COMPACT WORLD EVENTS
// ════════════════════════════════════════

export function compactWorldEvents(events: WorldEvent[]): CompactWorldEvent[] {
  return events.map(e => ({
    type: e.type,
    title: e.title,
    districtId: e.districtId,
  }));
}

// ════════════════════════════════════════
// BUILD DAILY LOG DATA from current state
// ════════════════════════════════════════

export function buildDailyLogData(
  date: string,
  quests: Quest[],
  player: Player,
  worldState: WorldState | null,
  todayEvents: WorldEvent[],
  previousDayRating?: DayRating,
): Partial<DailyLog> & { logDate: string } {
  const completed = quests.filter(q => q.status === ('COMPLETED' as QuestStatus));
  const pending = quests.filter(q => q.status === ('PENDING' as QuestStatus));

  const statsTouched = [...new Set(
    completed.flatMap(q => Object.keys(q.statRewards || {}))
  )];

  const xpEarned = completed.reduce((sum, q) => sum + q.xpReward, 0);
  const creditsEarned = completed.reduce((sum, q) => sum + q.creditReward, 0);

  const compactEvents = compactWorldEvents(todayEvents);
  const dayRating = classifyDay(completed.length, 0, compactEvents, previousDayRating);

  return {
    logDate: date,
    questsCompleted: completed.length,
    questsPending: pending.length,
    questTitles: completed.map(q => q.title),
    questTypes: completed.map(q => q.type),
    statsTouched,
    xpEarned,
    xpLost: 0,
    creditsEarned,
    creditsSpent: 0,
    playerLevel: player.level,
    totalXp: player.currentXP,
    streakCount: player.streak,
    worldSnapshot: worldState ? createCompactWorldSnapshot(worldState) : null,
    worldEvents: compactEvents,
    dayRating,
  };
}

// ════════════════════════════════════════
// TIMELINE EVENTS from daily logs
// ════════════════════════════════════════

const EVENT_CATEGORY_MAP: Record<string, TimelineCategory> = {
  UNLOCK: 'district',
  BUILD: 'structure',
  COMPANION: 'companion',
  RECOVERY: 'recovery',
  MILESTONE: 'milestone',
  DISCOVERY: 'expedition',
  DECAY: 'decay',
};

const EVENT_ICON_MAP: Record<string, string> = {
  UNLOCK: 'MapPin',
  BUILD: 'Hammer',
  COMPANION: 'Heart',
  RECOVERY: 'Sunrise',
  MILESTONE: 'Award',
  DISCOVERY: 'Compass',
  DECAY: 'Wind',
};

const EVENT_COLOR_MAP: Record<string, string> = {
  UNLOCK: 'text-cyan-400',
  BUILD: 'text-violet-400',
  COMPANION: 'text-rose-400',
  RECOVERY: 'text-amber-400',
  MILESTONE: 'text-yellow-400',
  DISCOVERY: 'text-cyan-400',
  DECAY: 'text-zinc-500',
};

export function buildTimelineFromLogs(logs: DailyLog[]): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const log of logs) {
    for (const event of log.worldEvents) {
      items.push({
        id: `${log.logDate}-${event.type}-${event.title}`,
        date: log.logDate,
        category: EVENT_CATEGORY_MAP[event.type] ?? 'milestone',
        title: event.title,
        description: '',
        districtId: event.districtId,
        icon: EVENT_ICON_MAP[event.type] ?? 'Star',
        color: EVENT_COLOR_MAP[event.type] ?? 'text-zinc-400',
      });
    }
  }

  // Sort most recent first
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

// ════════════════════════════════════════
// PATTERN INSIGHTS
// ════════════════════════════════════════

export function computeInsights(logs: DailyLog[]): PatternInsight[] {
  if (logs.length < 3) return [];

  const insights: PatternInsight[] = [];

  // 1. Strongest district (most touched stat)
  const statCounts: Record<string, number> = {};
  for (const log of logs) {
    for (const stat of log.statsTouched) {
      statCounts[stat] = (statCounts[stat] || 0) + 1;
    }
  }
  const sortedStats = Object.entries(statCounts).sort((a, b) => b[1] - a[1]);
  if (sortedStats.length > 0) {
    const [topStat, count] = sortedStats[0];
    const district = DISTRICTS.find(d => d.linkedStat === topStat);
    if (district) {
      insights.push({
        id: 'strongest-district',
        icon: 'TrendingUp',
        label: `Strongest District: ${district.name}`,
        detail: `Most consistent engagement (${count} active days)`,
        tone: 'positive',
      });
    }
  }

  // 2. Growth area (least touched stat, if they have any activity)
  if (sortedStats.length > 1) {
    const [weakStat] = sortedStats[sortedStats.length - 1];
    const district = DISTRICTS.find(d => d.linkedStat === weakStat);
    if (district) {
      insights.push({
        id: 'growth-area',
        icon: 'Sprout',
        label: `Growth Area: ${district.name}`,
        detail: 'Least consistent engagement — not a judgment, just a signal',
        tone: 'gentle',
      });
    }
  }

  // 3. Average XP/day
  const totalXP = logs.reduce((sum, l) => sum + l.xpEarned, 0);
  const activeDays = logs.filter(l => l.dayRating !== 'absent' && l.questsCompleted > 0).length;
  if (activeDays > 0) {
    const avgXP = Math.round(totalXP / activeDays);
    insights.push({
      id: 'avg-xp',
      icon: 'Zap',
      label: `Average Pace: +${avgXP} XP/day`,
      detail: `Across ${activeDays} active days this period`,
      tone: 'neutral',
    });
  }

  // 4. Recovery strength
  const recoveries = logs.filter(l => l.dayRating === 'recovery');
  if (recoveries.length > 0) {
    insights.push({
      id: 'recovery-strength',
      icon: 'Sunrise',
      label: `Recovery Strength: ${recoveries.length} comeback${recoveries.length > 1 ? 's' : ''}`,
      detail: 'You always come back. That matters.',
      tone: 'positive',
    });
  }

  // 5. Active days
  const totalActive = logs.filter(l => l.dayRating !== 'absent').length;
  insights.push({
    id: 'active-days',
    icon: 'Calendar',
    label: `${totalActive} active days`,
    detail: `Out of ${logs.length} days this period`,
    tone: 'neutral',
  });

  // 6. Strong days count
  const strongDays = logs.filter(l => l.dayRating === 'strong').length;
  if (strongDays > 0) {
    insights.push({
      id: 'strong-days',
      icon: 'Flame',
      label: `${strongDays} strong day${strongDays > 1 ? 's' : ''}`,
      detail: '3+ quests completed with no penalties',
      tone: 'positive',
    });
  }

  return insights;
}

// ════════════════════════════════════════
// STREAK CLUSTER COMPUTATION
// ════════════════════════════════════════

export interface StreakCluster {
  startDate: string;
  endDate: string;
  length: number;
  hasRecovery: boolean;  // starts with a recovery day
}

export function computeStreakClusters(logs: DailyLog[]): StreakCluster[] {
  if (logs.length === 0) return [];

  // Sort chronologically
  const sorted = [...logs].sort((a, b) => a.logDate.localeCompare(b.logDate));
  const clusters: StreakCluster[] = [];

  let currentCluster: StreakCluster | null = null;

  for (const log of sorted) {
    const isActive = log.dayRating !== 'absent' && log.questsCompleted > 0;

    if (isActive) {
      if (!currentCluster) {
        currentCluster = {
          startDate: log.logDate,
          endDate: log.logDate,
          length: 1,
          hasRecovery: log.dayRating === 'recovery',
        };
      } else {
        currentCluster.endDate = log.logDate;
        currentCluster.length++;
      }
    } else {
      if (currentCluster) {
        clusters.push(currentCluster);
        currentCluster = null;
      }
    }
  }

  if (currentCluster) {
    clusters.push(currentCluster);
  }

  return clusters;
}

// ════════════════════════════════════════
// DATE HELPERS for Calendar
// ════════════════════════════════════════

export function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    dates.push(`${year}-${m}-${d}`);
  }
  return dates;
}

export function getFirstDayOfMonth(year: number, month: number): number {
  // 0 = Sunday, 1 = Monday ... 6 = Saturday
  // Convert to Mon=0, Tue=1 ... Sun=6
  const jsDay = new Date(year, month, 1).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function formatDateRelative(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function getMonthName(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}
