/**
 * DayLog — Single-day view showing quests, economy, world impact.
 *
 * The "Mission Debrief" — a calm, reflective snapshot of a single day.
 * Narrative at top, quests, economy, district impact, world events.
 */

import React from 'react';
import {
  ChevronLeft, ChevronRight, Zap, Coins, TrendingUp,
  TrendingDown, Minus, Award, Check, Circle, ArrowUp,
} from 'lucide-react';
import type { DailyLog } from '../../chronicle/types';
import { DISTRICTS } from '../../world/constants';
import { formatDateFull } from '../../chronicle/utils';
import { NarrativeCard } from './NarrativeCard';

interface DayLogProps {
  log: DailyLog | null;
  date: string;
  isToday: boolean;
  isNarrativeLoading: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onGoToday: () => void;
  canGoNext: boolean;
  foundedAt?: string;
}

const DAY_RATING_LABELS: Record<string, { label: string; color: string }> = {
  strong: { label: 'STRONG', color: 'bg-violet-500/30 text-violet-300 border-violet-500/30' },
  steady: { label: 'STEADY', color: 'bg-violet-500/15 text-violet-400/80 border-violet-500/20' },
  neutral: { label: 'NEUTRAL', color: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30' },
  light: { label: 'LIGHT', color: 'bg-zinc-800/30 text-zinc-500 border-zinc-700/30' },
  recovery: { label: 'RECOVERY', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  absent: { label: 'ABSENT', color: 'bg-zinc-900/30 text-zinc-600 border-zinc-800/30' },
};

export const DayLog: React.FC<DayLogProps> = ({
  log,
  date,
  isToday,
  isNarrativeLoading,
  onPrevDay,
  onNextDay,
  onGoToday,
  canGoNext,
  foundedAt,
}) => {
  const rating = log?.dayRating ?? 'absent';
  const ratingInfo = DAY_RATING_LABELS[rating] ?? DAY_RATING_LABELS.neutral;

  // Empty state for days before founding
  if (foundedAt && date < foundedAt) {
    return (
      <div className="space-y-4">
        <DateNavigator
          date={date} isToday={isToday} onPrev={onPrevDay}
          onNext={onNextDay} onGoToday={onGoToday} canGoNext={canGoNext}
          ratingInfo={ratingInfo}
        />
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-8 text-center">
          <p className="text-sm text-zinc-600 italic">
            No records for this date. Your Chronicle begins on {formatDateFull(foundedAt)}.
          </p>
        </div>
      </div>
    );
  }

  // Empty state for days with no log
  if (!log) {
    return (
      <div className="space-y-4">
        <DateNavigator
          date={date} isToday={isToday} onPrev={onPrevDay}
          onNext={onNextDay} onGoToday={onGoToday} canGoNext={canGoNext}
          ratingInfo={ratingInfo}
        />
        <NarrativeCard narrative={null} dayRating="absent" isToday={isToday} />
        <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/20 p-6 text-center">
          <p className="text-xs text-zinc-600 italic">
            {isToday ? 'No activity yet today. Complete a directive to begin your chronicle entry.' : 'No activity recorded for this day.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <DateNavigator
        date={date} isToday={isToday} onPrev={onPrevDay}
        onNext={onNextDay} onGoToday={onGoToday} canGoNext={canGoNext}
        ratingInfo={ratingInfo}
      />

      {/* Narrative */}
      <NarrativeCard
        narrative={log.narrativeSummary}
        dayRating={log.dayRating}
        isLoading={isNarrativeLoading}
        isToday={isToday}
      />

      {/* Directives Summary */}
      {(log.questTitles.length > 0 || log.questsPending > 0) && (
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
            Directives
          </h3>
          <div className="space-y-1.5">
            {log.questTitles.map((title, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs text-zinc-300 flex-1">{title}</span>
                {log.questTypes[i] && (
                  <span className="text-[9px] font-mono text-zinc-600 uppercase">
                    {log.questTypes[i]}
                  </span>
                )}
              </div>
            ))}
            {log.questsPending > 0 && (
              <div className="flex items-center gap-2 opacity-50">
                <Circle className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <span className="text-xs text-zinc-500">
                  {log.questsPending} directive{log.questsPending > 1 ? 's' : ''} remaining
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Economy Bar */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
          Economy
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <EconomyStat icon={Zap} label="XP Earned" value={`+${log.xpEarned}`} color="text-violet-400" />
          <EconomyStat icon={Coins} label="Credits" value={`+${log.creditsEarned}`} color="text-amber-400" />
          <EconomyStat icon={ArrowUp} label="Level" value={`${log.playerLevel}`} color="text-zinc-300" />
          <EconomyStat icon={Award} label="Streak" value={`${log.streakCount}d`} color="text-emerald-400" />
        </div>
        {log.xpLost > 0 && (
          <p className="text-[10px] font-mono text-zinc-600 mt-2">
            Net: +{log.xpEarned - log.xpLost} XP ({'-'}{log.xpLost} penalty)
          </p>
        )}
      </div>

      {/* Nexus Impact */}
      {log.worldSnapshot && log.worldSnapshot.districts.length > 0 && (
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
            Nexus Impact
          </h3>
          <div className="space-y-2">
            {log.worldSnapshot.districts.map(d => {
              const districtDef = DISTRICTS.find(dd => dd.id === d.id);
              if (!districtDef) return null;

              return (
                <div key={d.id} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-400 w-24 truncate">
                    {districtDef.name}
                  </span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.vitality}%`,
                        backgroundColor: d.vitality >= 80 ? '#8b5cf6'
                          : d.vitality >= 60 ? '#7c3aed'
                          : d.vitality >= 40 ? '#6d28d9'
                          : d.vitality >= 25 ? '#f59e0b'
                          : '#71717a',
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
                    {d.vitality}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* World Events */}
      {log.worldEvents.length > 0 && (
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
            World Events
          </h3>
          <div className="space-y-1.5">
            {log.worldEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-semibold ${EVENT_TYPE_COLORS[event.type] ?? 'text-zinc-400'}`}>
                  {EVENT_TYPE_ICONS[event.type] ?? '◇'}
                </span>
                <span className="text-xs text-zinc-400">{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ──

const EVENT_TYPE_COLORS: Record<string, string> = {
  UNLOCK: 'text-cyan-400',
  BUILD: 'text-green-400',
  COMPANION: 'text-violet-400',
  RECOVERY: 'text-amber-400',
  MILESTONE: 'text-yellow-400',
  DISCOVERY: 'text-cyan-400',
  DECAY: 'text-zinc-500',
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  UNLOCK: '◈',
  BUILD: '⬡',
  COMPANION: '♦',
  RECOVERY: '☀',
  MILESTONE: '★',
  DISCOVERY: '◇',
  DECAY: '○',
};

interface DateNavigatorProps {
  date: string;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToday: () => void;
  canGoNext: boolean;
  ratingInfo: { label: string; color: string };
}

const DateNavigator: React.FC<DateNavigatorProps> = ({
  date, isToday, onPrev, onNext, onGoToday, canGoNext, ratingInfo,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="text-center">
        <span className="text-sm font-mono text-zinc-200 font-semibold">
          {formatDateFull(date)}
        </span>
      </div>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="p-1.5 rounded hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${ratingInfo.color}`}>
        {ratingInfo.label}
      </span>
      {!isToday && (
        <button
          onClick={onGoToday}
          className="text-[10px] font-mono px-2 py-1 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  </div>
);

const EconomyStat: React.FC<{ icon: any; label: string; value: string; color: string }> = ({
  icon: Icon, label, value, color,
}) => (
  <div>
    <span className="text-[9px] font-mono text-zinc-600 uppercase block mb-1.5">{label}</span>
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
      <span className={`text-sm font-mono font-semibold ${color} leading-none`}>{value}</span>
    </div>
  </div>
);
