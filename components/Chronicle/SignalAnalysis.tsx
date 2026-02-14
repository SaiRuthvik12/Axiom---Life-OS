/**
 * SignalAnalysis — Pattern insights presented supportively.
 *
 * Shows behavioral patterns, strongest areas, recovery frequency.
 * Never accusatory. Feels like insight, not judgment.
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronDown, ChevronRight, TrendingUp, Sprout, Zap, Sunrise,
  Calendar, Flame, BarChart3, Activity,
} from 'lucide-react';
import type { DailyLog, PatternInsight } from '../../chronicle/types';
import { computeInsights } from '../../chronicle/utils';

interface SignalAnalysisProps {
  logs: DailyLog[];
}

const ICON_MAP: Record<string, any> = {
  TrendingUp, Sprout, Zap, Sunrise, Calendar, Flame, BarChart3, Activity,
};

const TONE_CLASSES: Record<string, string> = {
  positive: 'border-emerald-500/20 bg-emerald-950/5',
  neutral: 'border-zinc-700/30 bg-zinc-900/20',
  gentle: 'border-amber-500/15 bg-amber-950/5',
};

const TONE_ICON_COLORS: Record<string, string> = {
  positive: 'text-emerald-400',
  neutral: 'text-zinc-400',
  gentle: 'text-amber-400',
};

export const SignalAnalysis: React.FC<SignalAnalysisProps> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const insights = useMemo(() => computeInsights(logs), [logs]);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-2 text-left"
      >
        <BarChart3 className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex-1">
          Signal Analysis
        </span>
        {isExpanded
          ? <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
          : <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
        }
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-zinc-800/50 pt-3">
          {insights.map(insight => {
            const IconComponent = ICON_MAP[insight.icon] ?? Activity;
            const toneClass = TONE_CLASSES[insight.tone] ?? TONE_CLASSES.neutral;
            const iconColor = TONE_ICON_COLORS[insight.tone] ?? 'text-zinc-400';

            return (
              <div
                key={insight.id}
                className={`rounded-md border p-3 ${toneClass} transition-all`}
              >
                <div className="flex items-start gap-2.5">
                  <IconComponent className={`h-3.5 w-3.5 ${iconColor} shrink-0 mt-0.5`} />
                  <div>
                    <span className="text-xs text-zinc-300 font-medium">{insight.label}</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{insight.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
