/**
 * NarrativeCard — AI-generated day summary with typewriter effect.
 *
 * The emotional anchor of the Day Log.
 * Shows a 2-3 sentence Game Master narrative about the day.
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Loader } from 'lucide-react';
import type { DayRating } from '../../chronicle/types';

interface NarrativeCardProps {
  narrative: string | null;
  dayRating: DayRating;
  isLoading?: boolean;
  isToday?: boolean;
}

const RATING_ACCENTS: Record<DayRating, string> = {
  strong: 'border-violet-500/30 bg-violet-950/10',
  steady: 'border-violet-500/20 bg-violet-950/5',
  neutral: 'border-zinc-700/50 bg-zinc-900/30',
  light: 'border-zinc-700/30 bg-zinc-900/20',
  recovery: 'border-amber-500/30 bg-amber-950/10',
  absent: 'border-zinc-800/30 bg-zinc-900/10',
};

const FALLBACK_NARRATIVES: Record<DayRating, string> = {
  strong: 'A formidable day. Multiple protocols executed with precision. The Nexus felt the impact.',
  steady: 'Steady progress. The kind of day that compounds over time.',
  neutral: 'A quiet day in the Nexus. The structures hold steady.',
  light: 'Minimal activity, but presence was noted. Sometimes that\'s enough.',
  recovery: 'You returned. That matters more than you think. The Nexus remembers.',
  absent: 'The Nexus waited. Dust settled on quiet corridors. But the foundations held.',
};

export const NarrativeCard: React.FC<NarrativeCardProps> = ({
  narrative,
  dayRating,
  isLoading = false,
  isToday = false,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const text = narrative || FALLBACK_NARRATIVES[dayRating];
  const accentClass = RATING_ACCENTS[dayRating];

  // Typewriter effect for new narratives
  useEffect(() => {
    if (!text) return;

    // Only animate on first load, not when switching between days
    if (isToday && narrative) {
      setIsAnimating(true);
      setDisplayText('');
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setDisplayText(text.slice(0, idx));
        if (idx >= text.length) {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }, 12);
      return () => clearInterval(interval);
    } else {
      setDisplayText(text);
      setIsAnimating(false);
    }
  }, [text, isToday, narrative]);

  return (
    <div className={`rounded-lg border p-4 ${accentClass} transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          Mission Debrief
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader className="h-3.5 w-3.5 text-zinc-500 animate-spin" />
          <span className="text-xs text-zinc-500 italic">Generating chronicle entry...</span>
        </div>
      ) : (
        <p className="text-sm text-zinc-300 leading-relaxed italic">
          "{displayText}"
          {isAnimating && <span className="animate-pulse text-violet-400">|</span>}
        </p>
      )}
    </div>
  );
};
