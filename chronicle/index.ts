/**
 * Chronicle System — Public API
 *
 * The Chronicle: A personal archive of the user's journey
 * through the Nexus. Progress, patterns, and identity.
 *
 * Architecture:
 *   types.ts    → Type definitions
 *   utils.ts    → Pure utility functions (rating, snapshots, insights)
 *   service.ts  → Supabase persistence
 *   schema.sql  → Database migration
 */

// ── Types ──
export type {
  DayRating,
  CompactDistrictSnapshot,
  CompactWorldSnapshot,
  CompactWorldEvent,
  DailyLog,
  TimelineCategory,
  TimelineItem,
  PatternInsight,
  ChronicleMode,
} from './types';

// ── Utils ──
export {
  classifyDay,
  createCompactWorldSnapshot,
  compactWorldEvents,
  buildDailyLogData,
  buildTimelineFromLogs,
  computeInsights,
  computeStreakClusters,
  getMonthDates,
  getFirstDayOfMonth,
  formatDateRelative,
  formatDateFull,
  formatDateShort,
  getMonthName,
} from './utils';

// ── Service ──
export { ChronicleService } from './service';
