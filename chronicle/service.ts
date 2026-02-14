/**
 * Chronicle Service — Supabase persistence for daily logs.
 *
 * Handles CRUD for the daily_logs table.
 * Falls back gracefully when Supabase is not configured (demo mode).
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DailyLog, DayRating, CompactWorldSnapshot, CompactWorldEvent } from './types';

// ── DB Row <-> DailyLog mapping ──

interface DailyLogRow {
  id: string;
  user_id: string;
  log_date: string;
  quests_completed: number;
  quests_pending: number;
  quest_titles: string[];
  quest_types: string[];
  stats_touched: string[];
  xp_earned: number;
  xp_lost: number;
  credits_earned: number;
  credits_spent: number;
  player_level: number;
  total_xp: number;
  streak_count: number;
  world_snapshot: any;
  world_events: any;
  narrative_summary: string | null;
  day_rating: string;
  created_at: string;
}

function rowToLog(row: DailyLogRow): DailyLog {
  return {
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    questsCompleted: row.quests_completed ?? 0,
    questsPending: row.quests_pending ?? 0,
    questTitles: row.quest_titles ?? [],
    questTypes: row.quest_types ?? [],
    statsTouched: row.stats_touched ?? [],
    xpEarned: row.xp_earned ?? 0,
    xpLost: row.xp_lost ?? 0,
    creditsEarned: row.credits_earned ?? 0,
    creditsSpent: row.credits_spent ?? 0,
    playerLevel: row.player_level ?? 1,
    totalXp: row.total_xp ?? 0,
    streakCount: row.streak_count ?? 0,
    worldSnapshot: row.world_snapshot ?? null,
    worldEvents: row.world_events ?? [],
    narrativeSummary: row.narrative_summary,
    dayRating: (row.day_rating as DayRating) ?? 'neutral',
  };
}

// ── In-memory fallback for demo mode ──

let demoLogs: DailyLog[] = [];

export const ChronicleService = {

  /**
   * Get a single day's log.
   */
  async getDailyLog(userId: string, date: string): Promise<DailyLog | null> {
    if (!isSupabaseConfigured()) {
      return demoLogs.find(l => l.logDate === date) ?? null;
    }

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('[Chronicle] Error fetching daily log:', error);
        return null;
      }

      return data ? rowToLog(data as DailyLogRow) : null;
    } catch (err) {
      console.error('[Chronicle] Service unavailable:', err);
      return null;
    }
  },

  /**
   * Get logs for a date range (inclusive). Used by Calendar and insights.
   */
  async getLogsForRange(userId: string, startDate: string, endDate: string): Promise<DailyLog[]> {
    if (!isSupabaseConfigured()) {
      return demoLogs.filter(l => l.logDate >= startDate && l.logDate <= endDate);
    }

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: true });

      if (error) {
        console.error('[Chronicle] Error fetching range:', error);
        return [];
      }

      return (data || []).map((row: any) => rowToLog(row as DailyLogRow));
    } catch (err) {
      console.error('[Chronicle] Service unavailable:', err);
      return [];
    }
  },

  /**
   * Get the N most recent logs. Used by Timeline and GM context.
   */
  async getRecentLogs(userId: string, limit: number = 30): Promise<DailyLog[]> {
    if (!isSupabaseConfigured()) {
      return [...demoLogs].sort((a, b) => b.logDate.localeCompare(a.logDate)).slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Chronicle] Error fetching recent logs:', error);
        return [];
      }

      return (data || []).map((row: any) => rowToLog(row as DailyLogRow));
    } catch (err) {
      console.error('[Chronicle] Service unavailable:', err);
      return [];
    }
  },

  /**
   * Upsert a daily log (insert or update). Used when quests are completed.
   */
  async upsertDailyLog(userId: string, log: Partial<DailyLog> & { logDate: string }): Promise<void> {
    if (!isSupabaseConfigured()) {
      const idx = demoLogs.findIndex(l => l.logDate === log.logDate);
      const existing = idx >= 0 ? demoLogs[idx] : null;
      const merged: DailyLog = {
        id: existing?.id ?? `demo-${Date.now()}`,
        userId,
        logDate: log.logDate,
        questsCompleted: log.questsCompleted ?? existing?.questsCompleted ?? 0,
        questsPending: log.questsPending ?? existing?.questsPending ?? 0,
        questTitles: log.questTitles ?? existing?.questTitles ?? [],
        questTypes: log.questTypes ?? existing?.questTypes ?? [],
        statsTouched: log.statsTouched ?? existing?.statsTouched ?? [],
        xpEarned: log.xpEarned ?? existing?.xpEarned ?? 0,
        xpLost: log.xpLost ?? existing?.xpLost ?? 0,
        creditsEarned: log.creditsEarned ?? existing?.creditsEarned ?? 0,
        creditsSpent: log.creditsSpent ?? existing?.creditsSpent ?? 0,
        playerLevel: log.playerLevel ?? existing?.playerLevel ?? 1,
        totalXp: log.totalXp ?? existing?.totalXp ?? 0,
        streakCount: log.streakCount ?? existing?.streakCount ?? 0,
        worldSnapshot: log.worldSnapshot ?? existing?.worldSnapshot ?? null,
        worldEvents: log.worldEvents ?? existing?.worldEvents ?? [],
        narrativeSummary: log.narrativeSummary ?? existing?.narrativeSummary ?? null,
        dayRating: log.dayRating ?? existing?.dayRating ?? 'neutral',
      };
      if (idx >= 0) demoLogs[idx] = merged;
      else demoLogs.push(merged);
      return;
    }

    try {
      const dbRow: any = {
        user_id: userId,
        log_date: log.logDate,
      };
      if (log.questsCompleted !== undefined) dbRow.quests_completed = log.questsCompleted;
      if (log.questsPending !== undefined) dbRow.quests_pending = log.questsPending;
      if (log.questTitles !== undefined) dbRow.quest_titles = log.questTitles;
      if (log.questTypes !== undefined) dbRow.quest_types = log.questTypes;
      if (log.statsTouched !== undefined) dbRow.stats_touched = log.statsTouched;
      if (log.xpEarned !== undefined) dbRow.xp_earned = log.xpEarned;
      if (log.xpLost !== undefined) dbRow.xp_lost = log.xpLost;
      if (log.creditsEarned !== undefined) dbRow.credits_earned = log.creditsEarned;
      if (log.creditsSpent !== undefined) dbRow.credits_spent = log.creditsSpent;
      if (log.playerLevel !== undefined) dbRow.player_level = log.playerLevel;
      if (log.totalXp !== undefined) dbRow.total_xp = log.totalXp;
      if (log.streakCount !== undefined) dbRow.streak_count = log.streakCount;
      if (log.worldSnapshot !== undefined) dbRow.world_snapshot = log.worldSnapshot;
      if (log.worldEvents !== undefined) dbRow.world_events = log.worldEvents;
      if (log.narrativeSummary !== undefined) dbRow.narrative_summary = log.narrativeSummary;
      if (log.dayRating !== undefined) dbRow.day_rating = log.dayRating;

      const { error } = await supabase
        .from('daily_logs')
        .upsert(dbRow, { onConflict: 'user_id,log_date' });

      if (error) console.error('[Chronicle] Error upserting daily log:', error);
    } catch (err) {
      console.error('[Chronicle] Service unavailable:', err);
    }
  },

  /**
   * Update narrative for a specific day (lazy generation).
   */
  async updateNarrative(userId: string, date: string, narrative: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const log = demoLogs.find(l => l.logDate === date);
      if (log) log.narrativeSummary = narrative;
      return;
    }

    try {
      const { error } = await supabase
        .from('daily_logs')
        .update({ narrative_summary: narrative })
        .eq('user_id', userId)
        .eq('log_date', date);

      if (error) console.error('[Chronicle] Error updating narrative:', error);
    } catch (err) {
      console.error('[Chronicle] Service unavailable:', err);
    }
  },

  /**
   * Reset demo logs (for testing).
   */
  resetDemoLogs() {
    demoLogs = [];
  },

  /**
   * Get demo logs reference (for demo mode).
   */
  getDemoLogs(): DailyLog[] {
    return demoLogs;
  },
};
