import React from 'react';
import { Timeframe } from '../types';
import { Clock, RefreshCw, Camera, Wifi } from 'lucide-react';

interface TimeframeBarProps {
  interval: Timeframe;
  onIntervalChange: (tf: Timeframe) => void;
  isLoading: boolean;
  onRefresh: () => void;
  latencyMs: number;
}

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1m' },
  { label: '3m', value: '3m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1H', value: '1h' },
  { label: '2H', value: '2h' },
  { label: '4H', value: '4h' },
  { label: '8H', value: '8h' },
  { label: '12H', value: '12h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

export const TimeframeBar: React.FC<TimeframeBarProps> = ({
  interval,
  onIntervalChange,
  isLoading,
  onRefresh,
  latencyMs,
}) => {
  const currentUtc = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  return (
    <div id="timeframe-bar" className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#090b14] border-t border-[#181c2f] text-xs select-none">
      {/* Left: Timeframe intervals list */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          Interval:
        </span>
        <div className="flex items-center gap-0.5 bg-[#121626] p-0.5 rounded-lg border border-[#1e2540]">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onIntervalChange(tf.value)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                interval === tf.value
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2038]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Real-time latency, Refresh, UTC clock */}
      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#14182b] hover:bg-[#1c223d] border border-[#222947] text-slate-300 hover:text-white transition-colors"
          title="Reload Latest Data"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Sync</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{currentUtc}</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#121626] border border-[#1e2540]">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400 font-bold">{latencyMs || 42} ms</span>
        </div>
      </div>
    </div>
  );
};
