/**
 * TimelineView — Scrollable timeline of major life events.
 *
 * The "Ship's Log" — shows district unlocks, structure builds,
 * companion events, milestones, recoveries. Feels like reading
 * a personal history, not a task log.
 */

import React, { useState, useMemo } from 'react';
import {
  MapPin, Hammer, Heart, Sunrise, Award, Compass, Wind, Crown,
  Filter, ArrowUpCircle, Zap, Star, HeartOff, Shield,
} from 'lucide-react';
import type { DailyLog, TimelineCategory, CompactWorldEvent } from '../../chronicle/types';
import { formatDateRelative, formatDateShort } from '../../chronicle/utils';

interface TimelineViewProps {
  logs: DailyLog[];
  foundedAt?: string;
}

// ── Icon map for timeline categories ──

const CATEGORY_ICONS: Record<string, any> = {
  district: MapPin,
  structure: Hammer,
  companion: Heart,
  recovery: Sunrise,
  milestone: Award,
  expedition: Compass,
  decay: Wind,
  era: Crown,
  levelup: ArrowUpCircle,
  streak: Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
  district: 'text-cyan-400 border-cyan-400/30 bg-cyan-950/20',
  structure: 'text-violet-400 border-violet-400/30 bg-violet-950/20',
  companion: 'text-rose-400 border-rose-400/30 bg-rose-950/20',
  recovery: 'text-amber-400 border-amber-400/30 bg-amber-950/20',
  milestone: 'text-yellow-400 border-yellow-400/30 bg-yellow-950/20',
  expedition: 'text-cyan-400 border-cyan-400/30 bg-cyan-950/20',
  decay: 'text-zinc-500 border-zinc-600/30 bg-zinc-900/20',
  era: 'text-amber-300 border-amber-400/40 bg-amber-950/20',
};

const EVENT_TYPE_TO_CATEGORY: Record<string, TimelineCategory> = {
  UNLOCK: 'district',
  BUILD: 'structure',
  COMPANION: 'companion',
  RECOVERY: 'recovery',
  MILESTONE: 'milestone',
  DISCOVERY: 'expedition',
  DECAY: 'decay',
};

type FilterKey = 'all' | 'milestones' | 'world' | 'companions' | 'recoveries';

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'world', label: 'World' },
  { key: 'companions', label: 'Companions' },
  { key: 'recoveries', label: 'Recoveries' },
];

const FILTER_CATEGORIES: Record<FilterKey, TimelineCategory[]> = {
  all: [],
  milestones: ['milestone'],
  world: ['district', 'structure', 'expedition', 'era'],
  companions: ['companion'],
  recoveries: ['recovery'],
};

interface TimelineEvent {
  id: string;
  date: string;
  category: TimelineCategory;
  title: string;
  icon: any;
  colorClass: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ logs, foundedAt }) => {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [visibleCount, setVisibleCount] = useState(30);

  // Build timeline events from logs
  const allEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    for (const log of logs) {
      for (const event of log.worldEvents) {
        const category = EVENT_TYPE_TO_CATEGORY[event.type];
        if (!category) continue;

        events.push({
          id: `${log.logDate}-${event.type}-${event.title}`,
          date: log.logDate,
          category,
          title: event.title,
          icon: CATEGORY_ICONS[category] ?? Star,
          colorClass: CATEGORY_COLORS[category] ?? 'text-zinc-400 border-zinc-600/30 bg-zinc-900/20',
        });
      }
    }

    // Sort most recent first
    events.sort((a, b) => b.date.localeCompare(a.date));
    return events;
  }, [logs]);

  // Apply filter
  const filteredEvents = useMemo(() => {
    if (filter === 'all') return allEvents;
    const categories = FILTER_CATEGORIES[filter];
    return allEvents.filter(e => categories.includes(e.category));
  }, [allEvents, filter]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = filteredEvents.length > visibleCount;

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: TimelineEvent[] }[] = [];
    let currentDate = '';
    let currentGroup: TimelineEvent[] = [];

    for (const event of visibleEvents) {
      if (event.date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, events: currentGroup });
        }
        currentDate = event.date;
        currentGroup = [event];
      } else {
        currentGroup.push(event);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, events: currentGroup });
    }

    return groups;
  }, [visibleEvents]);

  // Empty state
  if (allEvents.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800/30 bg-zinc-900/20 p-8 text-center">
        <p className="text-sm text-zinc-600 italic mb-2">
          Your timeline is just beginning.
        </p>
        <p className="text-xs text-zinc-700">
          Complete quests, build structures, and unlock districts to fill your Chronicle.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with founded info */}
      {foundedAt && (
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4 text-center">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Your Chronicle</span>
          <div className="text-xs text-zinc-400 mt-1">
            Founded {formatDateShort(foundedAt)} — {formatDateRelative(foundedAt)}
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-1">
            {allEvents.length} recorded event{allEvents.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <Filter className="h-3 w-3 text-zinc-600 shrink-0 mr-1" />
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              filter === opt.key
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-zinc-700/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline spine */}
      <div className="relative pl-6">
        {/* Vertical spine */}
        <div className="absolute left-2.5 top-0 bottom-0 w-px bg-zinc-800" />

        {groupedEvents.map((group, gi) => (
          <div key={group.date} className="relative mb-6 last:mb-0">
            {/* Date marker */}
            <div className="flex items-center gap-2 mb-2 -ml-6">
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {formatDateShort(group.date)}
                <span className="text-zinc-700 ml-1.5">{formatDateRelative(group.date)}</span>
              </span>
            </div>

            {/* Events for this date */}
            <div className="space-y-2 ml-2">
              {group.events.map((event, ei) => {
                const IconComponent = event.icon;
                const isDecay = event.category === 'decay';

                return (
                  <div
                    key={event.id}
                    className={`rounded-md border p-3 transition-all ${event.colorClass} ${
                      isDecay ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-3.5 w-3.5 shrink-0 ${event.colorClass.split(' ')[0]}`} />
                      <span className="text-xs font-mono text-zinc-200">{event.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 30)}
          className="w-full py-2 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-800/30 rounded-md hover:bg-zinc-800/20 transition-colors"
        >
          Load more events ({filteredEvents.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
};
