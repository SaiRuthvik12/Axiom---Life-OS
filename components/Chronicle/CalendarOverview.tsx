/**
 * CalendarOverview — Month-level heatmap calendar with streak clusters.
 *
 * The "Star Chart" — scannable in <5 seconds.
 * Color intensity communicates day quality. No numbers on cells.
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame, Sunrise, Calendar, Zap } from 'lucide-react';
import type { DailyLog, DayRating } from '../../chronicle/types';
import {
  getMonthDates,
  getFirstDayOfMonth,
  getMonthName,
  computeStreakClusters,
  formatDateShort,
} from '../../chronicle/utils';
import type { StreakCluster } from '../../chronicle/utils';

interface CalendarOverviewProps {
  logs: DailyLog[];
  year: number;
  month: number;         // 0-based
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
}

// ── Day cell color mapping ──

const RATING_CELL_CLASSES: Record<DayRating, string> = {
  strong: 'bg-violet-500/70 shadow-[0_0_6px_rgba(139,92,246,0.3)]',
  steady: 'bg-violet-500/35',
  neutral: 'bg-violet-500/12',
  light: 'bg-zinc-700/25',
  recovery: 'bg-amber-500/45 shadow-[0_0_6px_rgba(245,158,11,0.2)]',
  absent: 'bg-transparent',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarOverview: React.FC<CalendarOverviewProps> = ({
  logs,
  year,
  month,
  today,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  canGoNext,
}) => {
  const dates = useMemo(() => getMonthDates(year, month), [year, month]);
  const firstDayOffset = useMemo(() => getFirstDayOfMonth(year, month), [year, month]);
  const monthName = useMemo(() => getMonthName(year, month), [year, month]);

  // Index logs by date for fast lookup
  const logsByDate = useMemo(() => {
    const map: Record<string, DailyLog> = {};
    for (const log of logs) map[log.logDate] = log;
    return map;
  }, [logs]);

  // Streak clusters
  const clusters = useMemo(() => computeStreakClusters(logs), [logs]);

  // Month pulse stats
  const monthPulse = useMemo(() => {
    const active = logs.filter(l => l.dayRating !== 'absent' && l.questsCompleted > 0).length;
    const strong = logs.filter(l => l.dayRating === 'strong').length;
    const recoveries = logs.filter(l => l.dayRating === 'recovery').length;
    const totalXP = logs.reduce((sum, l) => sum + l.xpEarned, 0);
    const avgXP = active > 0 ? Math.round(totalXP / active) : 0;
    return { active, strong, recoveries, avgXP };
  }, [logs]);

  // Micro-icons for special events on each day
  const dayIcons = useMemo(() => {
    const icons: Record<string, string[]> = {};
    for (const log of logs) {
      const dayIc: string[] = [];
      for (const evt of log.worldEvents) {
        if (evt.type === 'BUILD') dayIc.push('⬡');
        else if (evt.type === 'COMPANION') dayIc.push('♦');
        else if (evt.type === 'MILESTONE') dayIc.push('★');
        else if (evt.type === 'UNLOCK') dayIc.push('↑');
      }
      if (dayIc.length > 0) icons[log.logDate] = dayIc.slice(0, 2);
    }
    return icons;
  }, [logs]);

  return (
    <div className="space-y-5">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-mono text-zinc-200 font-semibold">{monthName}</span>
        <button
          onClick={onNextMonth}
          disabled={!canGoNext}
          className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-[9px] font-mono text-zinc-600 uppercase py-1">
            {day}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {dates.map(date => {
          const log = logsByDate[date];
          const rating: DayRating = log?.dayRating ?? 'absent';
          const isFuture = date > today;
          const isSelected = date === selectedDate;
          const isCurrentDay = date === today;
          const icons = dayIcons[date];

          if (isFuture) {
            return (
              <div key={date} className="aspect-square rounded-md bg-zinc-900/10" />
            );
          }

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`
                aspect-square rounded-md relative transition-all duration-150
                hover:scale-105 hover:z-10
                ${RATING_CELL_CLASSES[rating]}
                ${isSelected ? 'ring-1 ring-white/80' : ''}
                ${isCurrentDay ? 'ring-2 ring-violet-500/60' : ''}
                ${rating === 'recovery' ? 'ring-1 ring-amber-500/30' : ''}
              `}
            >
              {/* Day number */}
              <span className={`absolute bottom-0.5 right-1 text-[8px] font-mono ${
                rating === 'absent' ? 'text-zinc-700' : 'text-zinc-400/60'
              }`}>
                {parseInt(date.split('-')[2])}
              </span>

              {/* Micro-icons for events */}
              {icons && (
                <div className="absolute top-0.5 left-0.5 flex gap-px">
                  {icons.map((ic, i) => (
                    <span key={i} className="text-[6px] text-zinc-400/50">{ic}</span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Month Pulse */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
          Month Pulse
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PulseStat icon={Calendar} label="Active Days" value={`${monthPulse.active}`} color="text-zinc-300" />
          <PulseStat icon={Flame} label="Strong Days" value={`${monthPulse.strong}`} color="text-violet-400" />
          <PulseStat icon={Sunrise} label="Recoveries" value={`${monthPulse.recoveries}`} color="text-amber-400" />
          <PulseStat icon={Zap} label="Avg XP/Day" value={`+${monthPulse.avgXP}`} color="text-emerald-400" />
        </div>
      </div>

      {/* Streak Clusters */}
      {clusters.length > 0 && (
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
            Streak Clusters
          </h3>
          <StreakBar clusters={clusters} dates={dates} logsByDate={logsByDate} today={today} />
          <div className="flex flex-wrap gap-2 mt-3">
            {clusters.map((cluster, i) => (
              <span key={i} className="text-[9px] font-mono text-zinc-500">
                {cluster.hasRecovery && <span className="text-amber-400 mr-0.5">↻</span>}
                {formatDateShort(cluster.startDate)}–{formatDateShort(cluster.endDate)}
                <span className="text-zinc-600 ml-1">({cluster.length}d)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ──

const PulseStat: React.FC<{ icon: any; label: string; value: string; color: string }> = ({
  icon: Icon, label, value, color,
}) => (
  <div className="flex items-center gap-2">
    <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
    <div>
      <span className="text-[9px] font-mono text-zinc-600 uppercase block">{label}</span>
      <span className={`text-sm font-mono font-semibold ${color}`}>{value}</span>
    </div>
  </div>
);

const StreakBar: React.FC<{
  clusters: StreakCluster[];
  dates: string[];
  logsByDate: Record<string, DailyLog>;
  today: string;
}> = ({ clusters, dates, logsByDate, today }) => {
  const validDates = dates.filter(d => d <= today);
  if (validDates.length === 0) return null;

  // Build cluster lookup
  const clusterByDate: Record<string, StreakCluster | null> = {};
  for (const date of validDates) clusterByDate[date] = null;
  for (const cluster of clusters) {
    for (const date of validDates) {
      if (date >= cluster.startDate && date <= cluster.endDate) {
        clusterByDate[date] = cluster;
      }
    }
  }

  return (
    <div className="flex gap-px h-3 rounded overflow-hidden">
      {validDates.map(date => {
        const cluster = clusterByDate[date];
        const isStart = cluster?.startDate === date;
        const isRecoveryStart = isStart && cluster?.hasRecovery;

        return (
          <div
            key={date}
            className={`flex-1 transition-all ${
              cluster
                ? isRecoveryStart
                  ? 'bg-amber-500/60'
                  : 'bg-violet-500/50'
                : 'bg-zinc-800/30'
            }`}
          />
        );
      })}
    </div>
  );
};
