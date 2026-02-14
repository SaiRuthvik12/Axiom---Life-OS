/**
 * SnapshotComparison — "Then vs Now" world comparison.
 *
 * Side-by-side comparison of the Nexus at two points in time.
 * Deltas shown in green. Growth is undeniable.
 */

import React, { useState, useMemo } from 'react';
import { ArrowRight, TrendingUp, Globe, X } from 'lucide-react';
import type { DailyLog, CompactWorldSnapshot, CompactDistrictSnapshot } from '../../chronicle/types';
import { DISTRICTS, COMPANIONS, ERA_NAMES } from '../../world/constants';
import { formatDateShort } from '../../chronicle/utils';

interface SnapshotComparisonProps {
  logs: DailyLog[];
  onClose: () => void;
}

export const SnapshotComparison: React.FC<SnapshotComparisonProps> = ({ logs, onClose }) => {
  // Find the earliest and latest logs with snapshots
  const logsWithSnapshots = useMemo(() =>
    logs.filter(l => l.worldSnapshot !== null).sort((a, b) => a.logDate.localeCompare(b.logDate)),
    [logs]
  );

  const [leftDate, setLeftDate] = useState<string>(
    logsWithSnapshots.length > 0 ? logsWithSnapshots[0].logDate : ''
  );
  const [rightDate, setRightDate] = useState<string>(
    logsWithSnapshots.length > 0 ? logsWithSnapshots[logsWithSnapshots.length - 1].logDate : ''
  );

  const leftLog = logsWithSnapshots.find(l => l.logDate === leftDate);
  const rightLog = logsWithSnapshots.find(l => l.logDate === rightDate);
  const leftSnap = leftLog?.worldSnapshot;
  const rightSnap = rightLog?.worldSnapshot;

  if (logsWithSnapshots.length < 2) {
    return (
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Then & Now
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-600 italic text-center py-4">
          Comparison requires at least two days of world snapshots. Keep building.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          Then & Now
        </h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Date selectors */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={leftDate}
          onChange={e => setLeftDate(e.target.value)}
          className="flex-1 text-xs font-mono bg-black border border-zinc-700 rounded px-2 py-1.5 text-zinc-300 focus:border-violet-500 outline-none"
        >
          {logsWithSnapshots.map(l => (
            <option key={l.logDate} value={l.logDate}>
              {formatDateShort(l.logDate)}
            </option>
          ))}
        </select>
        <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0" />
        <select
          value={rightDate}
          onChange={e => setRightDate(e.target.value)}
          className="flex-1 text-xs font-mono bg-black border border-zinc-700 rounded px-2 py-1.5 text-zinc-300 focus:border-violet-500 outline-none"
        >
          {logsWithSnapshots.map(l => (
            <option key={l.logDate} value={l.logDate}>
              {formatDateShort(l.logDate)}
            </option>
          ))}
        </select>
      </div>

      {/* Comparison grid */}
      {leftSnap && rightSnap && (
        <div className="grid grid-cols-2 gap-3">
          {/* Left snapshot */}
          <SnapshotPanel snapshot={leftSnap} date={leftDate} side="left" />
          {/* Right snapshot */}
          <SnapshotPanel snapshot={rightSnap} date={rightDate} side="right" otherSnapshot={leftSnap} />
        </div>
      )}
    </div>
  );
};

// ── Sub-components ──

interface SnapshotPanelProps {
  snapshot: CompactWorldSnapshot;
  date: string;
  side: 'left' | 'right';
  otherSnapshot?: CompactWorldSnapshot;
}

const SnapshotPanel: React.FC<SnapshotPanelProps> = ({ snapshot, date, side, otherSnapshot }) => {
  const isRight = side === 'right';

  return (
    <div className={`rounded-md border p-3 ${
      isRight ? 'border-violet-500/20 bg-violet-950/5' : 'border-zinc-700/30 bg-zinc-900/30'
    }`}>
      {/* Header */}
      <div className="mb-2">
        <span className="text-[9px] font-mono text-zinc-600 uppercase block">{formatDateShort(date)}</span>
        <span className="text-xs font-mono text-zinc-200 font-semibold">"{snapshot.worldTitle}"</span>
      </div>

      {/* Key stats */}
      <div className="space-y-1.5 text-[10px] font-mono">
        <ComparisonRow
          label="Era"
          value={ERA_NAMES[snapshot.era] ?? 'Foundation'}
          delta={isRight && otherSnapshot ? snapshot.era - otherSnapshot.era : undefined}
          isNumeric={false}
        />
        <ComparisonRow
          label="Structures"
          value={`${snapshot.totalStructuresBuilt}`}
          delta={isRight && otherSnapshot ? snapshot.totalStructuresBuilt - otherSnapshot.totalStructuresBuilt : undefined}
        />
        <ComparisonRow
          label="Districts"
          value={`${snapshot.districts.length}`}
          delta={isRight && otherSnapshot ? snapshot.districts.length - otherSnapshot.districts.length : undefined}
        />
      </div>

      {/* District vitalities */}
      <div className="mt-2 pt-2 border-t border-zinc-800/30 space-y-1">
        {snapshot.districts.map(d => {
          const districtDef = DISTRICTS.find(dd => dd.id === d.id);
          const otherDistrict = otherSnapshot?.districts.find(od => od.id === d.id);
          const delta = isRight && otherDistrict ? d.vitality - otherDistrict.vitality : undefined;

          return (
            <div key={d.id} className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-500 truncate flex-1">
                {districtDef?.name ?? d.id}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-400">{d.vitality}%</span>
                {delta !== undefined && delta !== 0 && (
                  <span className={`text-[8px] font-semibold ${delta > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ComparisonRow: React.FC<{
  label: string;
  value: string;
  delta?: number;
  isNumeric?: boolean;
}> = ({ label, value, delta, isNumeric = true }) => (
  <div className="flex items-center justify-between">
    <span className="text-zinc-500">{label}</span>
    <div className="flex items-center gap-1">
      <span className="text-zinc-300">{value}</span>
      {delta !== undefined && delta > 0 && isNumeric && (
        <span className="text-emerald-400 text-[9px] font-semibold">+{delta}</span>
      )}
    </div>
  </div>
);
