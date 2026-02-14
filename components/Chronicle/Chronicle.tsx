/**
 * Chronicle — Main container for the Progress Tab.
 *
 * The Chronicle is a personal archive of the user's journey.
 * Three modes: Day Log, Calendar Overview, Timeline.
 *
 * Emotional design: calm, reflective, supportive.
 * No red. No shame. No report cards.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollText, BookOpen, Calendar, Clock, GitCompare } from 'lucide-react';
import type { Player, Quest } from '../../types';
import type { WorldState } from '../../world/types';
import type { DailyLog, ChronicleMode } from '../../chronicle/types';
import { ChronicleService } from '../../chronicle/service';
import { buildDailyLogData } from '../../chronicle/utils';
import { generateDayNarrative } from '../../services/geminiService';
import { getLocalDate } from '../../lib/dateUtils';
import { DayLog } from './DayLog';
import { CalendarOverview } from './CalendarOverview';
import { TimelineView } from './TimelineView';
import { MilestoneGallery } from './MilestoneGallery';
import { SignalAnalysis } from './SignalAnalysis';
import { SnapshotComparison } from './SnapshotComparison';

interface ChronicleProps {
  player: Player;
  quests: Quest[];
  worldState: WorldState | null;
  session: any;
}

const MODE_TABS: { key: ChronicleMode; label: string; icon: any }[] = [
  { key: 'daylog', label: 'Day Log', icon: BookOpen },
  { key: 'overview', label: 'Overview', icon: Calendar },
  { key: 'timeline', label: 'Timeline', icon: Clock },
];

export const Chronicle: React.FC<ChronicleProps> = ({
  player,
  quests,
  worldState,
  session,
}) => {
  const today = getLocalDate();

  // Mode & navigation state
  const [mode, setMode] = useState<ChronicleMode>('daylog');
  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(() => parseInt(today.split('-')[0]));
  const [calMonth, setCalMonth] = useState(() => parseInt(today.split('-')[1]) - 1);
  const [showComparison, setShowComparison] = useState(false);

  // Data state
  const [currentDayLog, setCurrentDayLog] = useState<DailyLog | null>(null);
  const [monthLogs, setMonthLogs] = useState<DailyLog[]>([]);
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [isNarrativeLoading, setIsNarrativeLoading] = useState(false);

  const userId = session?.user?.id;
  const foundedAt = worldState?.foundedAt?.split('T')[0];
  const isToday = selectedDate === today;

  // ── Load logs for the selected date ──
  useEffect(() => {
    loadDayLog(selectedDate);
  }, [selectedDate, userId]);

  // ── Load month logs when calendar month changes ──
  useEffect(() => {
    loadMonthLogs();
  }, [calYear, calMonth, userId]);

  // ── Load all logs for timeline on first mount ──
  useEffect(() => {
    loadAllLogs();
  }, [userId]);

  const loadDayLog = async (date: string) => {
    if (!userId) {
      // Demo mode: generate a log from current quests for today
      if (date === today) {
        const logData = buildDailyLogData(date, quests, player, worldState, [], undefined);
        setCurrentDayLog({
          id: 'demo-today',
          userId: 'demo',
          ...logData,
          narrativeSummary: null,
          worldEvents: logData.worldEvents ?? [],
          worldSnapshot: logData.worldSnapshot ?? null,
        } as DailyLog);
      } else {
        const log = await ChronicleService.getDailyLog('demo', date);
        setCurrentDayLog(log);
      }
      return;
    }

    const log = await ChronicleService.getDailyLog(userId, date);
    setCurrentDayLog(log);

    // Generate narrative if missing for a past day with data
    if (log && !log.narrativeSummary && date !== today) {
      generateNarrative(log);
    }
  };

  const loadMonthLogs = async () => {
    const startDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const endDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    if (!userId) {
      const logs = await ChronicleService.getLogsForRange('demo', startDate, endDate);
      setMonthLogs(logs);
      return;
    }

    const logs = await ChronicleService.getLogsForRange(userId, startDate, endDate);
    setMonthLogs(logs);
  };

  const loadAllLogs = async () => {
    if (!userId) {
      const logs = await ChronicleService.getRecentLogs('demo', 90);
      setAllLogs(logs);
      return;
    }

    const logs = await ChronicleService.getRecentLogs(userId, 90);
    setAllLogs(logs);
  };

  const generateNarrative = async (log: DailyLog) => {
    setIsNarrativeLoading(true);
    try {
      const narrative = await generateDayNarrative(log, worldState);
      if (narrative && userId) {
        await ChronicleService.updateNarrative(userId, log.logDate, narrative);
        setCurrentDayLog(prev => prev ? { ...prev, narrativeSummary: narrative } : null);
      } else if (narrative) {
        setCurrentDayLog(prev => prev ? { ...prev, narrativeSummary: narrative } : null);
      }
    } catch (err) {
      console.error('[Chronicle] Narrative generation failed:', err);
    } finally {
      setIsNarrativeLoading(false);
    }
  };

  // ── Date navigation ──
  const navigateDay = useCallback((delta: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const newDate = `${year}-${month}-${day}`;
    if (newDate <= today) setSelectedDate(newDate);
  }, [selectedDate, today]);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setMode('daylog');
  }, []);

  const handlePrevMonth = useCallback(() => {
    if (calMonth === 0) {
      setCalYear(y => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth(m => m - 1);
    }
  }, [calMonth]);

  const handleNextMonth = useCallback(() => {
    const todayYear = parseInt(today.split('-')[0]);
    const todayMonth = parseInt(today.split('-')[1]) - 1;
    const nextMonth = calMonth === 11 ? 0 : calMonth + 1;
    const nextYear = calMonth === 11 ? calYear + 1 : calYear;
    if (nextYear < todayYear || (nextYear === todayYear && nextMonth <= todayMonth)) {
      setCalYear(nextYear);
      setCalMonth(nextMonth);
    }
  }, [calMonth, calYear, today]);

  const canGoNextMonth = useMemo(() => {
    const todayYear = parseInt(today.split('-')[0]);
    const todayMonth = parseInt(today.split('-')[1]) - 1;
    return calYear < todayYear || (calYear === todayYear && calMonth < todayMonth);
  }, [calYear, calMonth, today]);

  // ── First-time experience ──
  const hasMinData = allLogs.length >= 1 || monthLogs.length >= 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/60 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-violet-400 shrink-0" />
            <h2 className="text-lg font-mono font-bold text-white">The Chronicle</h2>
          </div>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              showComparison
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-zinc-700/30 hover:border-zinc-600/50'
            }`}
          >
            <GitCompare className="h-3 w-3" />
            Then & Now
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-zinc-800/30 rounded-lg p-0.5">
          {MODE_TABS.map(tab => {
            const IconComponent = tab.icon;
            const isActive = mode === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-zinc-800/80 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <IconComponent className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison panel */}
      {showComparison && (
        <SnapshotComparison
          logs={allLogs}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* First-time empty state */}
      {!hasMinData && mode !== 'daylog' && (
        <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/20 p-8 text-center">
          <ScrollText className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 italic mb-1">
            Your Chronicle is just beginning.
          </p>
          <p className="text-xs text-zinc-600">
            Every day you show up, a new page is written. Check back after a few days to see your story take shape.
          </p>
        </div>
      )}

      {/* Day Log Mode */}
      {mode === 'daylog' && (
        <DayLog
          log={currentDayLog}
          date={selectedDate}
          isToday={isToday}
          isNarrativeLoading={isNarrativeLoading}
          onPrevDay={() => navigateDay(-1)}
          onNextDay={() => navigateDay(1)}
          onGoToday={() => setSelectedDate(today)}
          canGoNext={selectedDate < today}
          foundedAt={foundedAt}
        />
      )}

      {/* Calendar Overview Mode */}
      {mode === 'overview' && (
        <>
          <CalendarOverview
            logs={monthLogs}
            year={calYear}
            month={calMonth}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            canGoNext={canGoNextMonth}
          />
          <SignalAnalysis logs={monthLogs} />
        </>
      )}

      {/* Timeline Mode */}
      {mode === 'timeline' && (
        <TimelineView
          logs={allLogs}
          foundedAt={foundedAt}
        />
      )}

      {/* Milestone Gallery (always shown at bottom) */}
      {worldState && (
        <MilestoneGallery worldState={worldState} />
      )}
    </div>
  );
};
