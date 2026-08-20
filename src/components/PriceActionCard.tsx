import React, { useState } from 'react';
import { PriceActionSignal } from '../types';
import { 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Target, 
  Crosshair, 
  Layers, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Activity, 
  Maximize2,
  GitCommit,
  AlertCircle
} from 'lucide-react';

interface PriceActionCardProps {
  signal: PriceActionSignal | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClose: () => void;
  showOverlayLines: boolean;
  onToggleOverlayLines: () => void;
  symbol: string;
}

export const PriceActionCard: React.FC<PriceActionCardProps> = ({
  signal,
  isLoading,
  error,
  onRefresh,
  onClose,
  showOverlayLines,
  onToggleOverlayLines,
  symbol,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'trade' | 'pivots' | 'structure'>('trade');

  const handleCopy = () => {
    if (!signal) return;
    const text = `🎯 PRICE ACTION MASTER PLAN: ${symbol}
Setup: ${signal.setupName}
Direction: ${signal.bias} (${signal.confidence}% Conviction | R:R ${signal.riskRewardRatio})
Structure: ${signal.marketStructure} | Return to Pivot: ${signal.returnToPivotStatus}
Central Pivot (P): $${signal.pivotLevels.centralPivot.toLocaleString()}
Entry Zone: ${signal.entryZone} (Trigger: $${signal.entryPrice.toLocaleString()})
Invalidation (SL): $${signal.stopLoss.toLocaleString()}
TP1 (Pivot Target): $${signal.takeProfit1.toLocaleString()}
TP2 (Outer Pivot): $${signal.takeProfit2.toLocaleString()}
TP3 (Runner): $${signal.takeProfit3.toLocaleString()}
Trigger Pattern: ${signal.candlestickPattern}
Action Plan: ${signal.actionPlan}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLong = signal?.bias === 'LONG';
  const isShort = signal?.bias === 'SHORT';
  const isWait = signal?.bias === 'WAIT_FOR_PIVOT_RETEST';

  const formatLevel = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '---';
    return `$${val.toLocaleString()}`;
  };

  const distToPivot = signal?.pivotDistancePercent ?? 0;

  return (
    <div
      id="price-action-floating-card"
      className="absolute top-24 sm:top-28 left-3 z-30 w-88 sm:w-104 max-h-[calc(100%-7.5rem)] rounded-2xl bg-[#090e1c]/95 border border-cyan-500/30 shadow-2xl backdrop-blur-xl transition-all font-sans overflow-y-auto custom-scrollbar flex flex-col text-slate-200"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0f172e] border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 text-white shadow-md">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
              <span>Price Action</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-medium border border-cyan-500/30">
                Pivot Master 🎯
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Return to Pivot (RTP) & Structure Engine</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleOverlayLines}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showOverlayLines 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                : 'bg-[#151e3b] text-slate-400 border-[#232f57] hover:text-white'
            }`}
            title={showOverlayLines ? 'Hide Pivot Chart Overlay Lines' : 'Show Pivot Chart Overlay Lines'}
          >
            {showOverlayLines ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#151e3b] border border-[#232f57] text-slate-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
            title="Recalculate Price Action & Pivots"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg bg-[#151e3b] border border-[#232f57] text-slate-400 hover:text-white transition-colors"
            title={isMinimized ? 'Expand Card' : 'Minimize Card'}
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151e3b] border border-[#232f57] text-slate-400 hover:text-rose-400 transition-colors"
            title="Close Price Action Bot"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3.5 space-y-3 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* Loading State */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Compass className="w-4 h-4 text-cyan-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Scanning Price Action & Pivots...</p>
                <p className="text-[11px] text-slate-400">Computing Floor Trader P/R/S matrices & detecting RTP mean-reversion triggers</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Scan Notice</p>
                <p className="text-[11px] text-rose-300/80">{error}</p>
                <button
                  onClick={onRefresh}
                  className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 text-[10px] font-semibold hover:bg-rose-500/30"
                >
                  Retry Price Action Scan
                </button>
              </div>
            </div>
          )}

          {/* Signal Display */}
          {signal && !isLoading && (
            <>
              {/* Top Banner: Setup & Bias */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#0d1730] to-[#11223e] border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl text-white ${
                    isShort ? 'bg-rose-500/30 text-rose-400 border border-rose-500/40' :
                    isLong ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40' :
                    'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isShort ? <TrendingDown className="w-5 h-5" /> :
                     isLong ? <TrendingUp className="w-5 h-5" /> :
                     <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black tracking-wide font-mono ${
                        isShort ? 'text-rose-400' : isLong ? 'text-emerald-400' : 'text-amber-300'
                      }`}>
                        {signal.bias}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200 font-mono font-bold">
                        {signal.confidence}% Conviction
                      </span>
                    </div>
                    <div className="text-[11px] text-white font-semibold line-clamp-1">
                      {signal.setupName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">Pivot Dist</div>
                  <div className={`text-xs font-bold font-mono ${distToPivot > 0 ? 'text-amber-300' : 'text-cyan-300'}`}>
                    {distToPivot > 0 ? `+${distToPivot}%` : `${distToPivot}%`}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">to Central P</div>
                </div>
              </div>

              {/* Navigation Sub-tabs */}
              <div className="flex items-center bg-[#0a1124] p-0.5 rounded-lg border border-[#1a274c] text-[11px]">
                <button
                  onClick={() => setActiveTab('trade')}
                  className={`flex-1 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'trade'
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Position Setup
                </button>
                <button
                  onClick={() => setActiveTab('pivots')}
                  className={`flex-1 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'pivots'
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pivots Matrix
                </button>
                <button
                  onClick={() => setActiveTab('structure')}
                  className={`flex-1 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'structure'
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PA Breakdown
                </button>
              </div>

              {/* Tab 1: Suggested Trade Position */}
              {activeTab === 'trade' && (
                <div className="space-y-2.5">
                  {/* Key Execution Levels Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-[#0f1833] border border-cyan-500/30">
                      <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                        <Crosshair className="w-3 h-3" /> Entry Trigger
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {formatLevel(signal.entryPrice)}
                      </div>
                      <div className="text-[9px] text-slate-400">{signal.entryZone}</div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#0f1833] border border-rose-500/30">
                      <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Invalidation (SL)
                      </div>
                      <div className="text-sm font-bold text-rose-300 mt-0.5">
                        {formatLevel(signal.stopLoss)}
                      </div>
                      <div className="text-[9px] text-rose-400/80">Tight PA Structure SL</div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#0f1833] border border-emerald-500/30">
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Target className="w-3 h-3" /> TP1 (Pivot Target)
                      </div>
                      <div className="text-sm font-bold text-emerald-300 mt-0.5">
                        {formatLevel(signal.takeProfit1)}
                      </div>
                      <div className="text-[9px] text-emerald-400/80">Primary Pivot Mean Target</div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#0f1833] border border-indigo-500/30">
                      <div className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                        <Layers className="w-3 h-3" /> TP2 (Outer Pivot)
                      </div>
                      <div className="text-sm font-bold text-indigo-300 mt-0.5">
                        {formatLevel(signal.takeProfit2)}
                      </div>
                      <div className="text-[9px] text-indigo-400/80">R:R {signal.riskRewardRatio}</div>
                    </div>
                  </div>

                  {/* Candlestick Pattern Trigger */}
                  <div className="p-2.5 rounded-xl bg-[#0e172e] border border-cyan-500/30 text-xs">
                    <div className="text-[10px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      CANDLESTICK CONFIRMATION PATTERN:
                    </div>
                    <p className="text-slate-200 mt-1 font-medium leading-relaxed">
                      {signal.candlestickPattern}
                    </p>
                  </div>

                  {/* Step-by-Step Action Plan */}
                  <div className="p-2.5 rounded-xl bg-[#0b1329] border border-[#1c2c54] text-xs">
                    <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <span>🎯 TACTICAL ACTION DIRECTIVE:</span>
                    </div>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      {signal.actionPlan}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Pivot Points Matrix */}
              {activeTab === 'pivots' && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#0e172e] border border-[#1d2b52] space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-rose-400">
                      <span className="font-bold">Resistance 3 (R3):</span>
                      <span className="font-extrabold">{formatLevel(signal.pivotLevels.r3)}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-300">
                      <span className="font-semibold">Resistance 2 (R2):</span>
                      <span>{formatLevel(signal.pivotLevels.r2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-200">
                      <span className="font-semibold">Resistance 1 (R1):</span>
                      <span>{formatLevel(signal.pivotLevels.r1)}</span>
                    </div>

                    <div className="my-1.5 py-1 px-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-between text-white font-bold">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Compass className="w-3 h-3" /> Central Pivot (P):
                      </span>
                      <span className="text-cyan-200 text-sm">{formatLevel(signal.pivotLevels.centralPivot)}</span>
                    </div>

                    <div className="flex items-center justify-between text-emerald-200">
                      <span className="font-semibold">Support 1 (S1):</span>
                      <span>{formatLevel(signal.pivotLevels.s1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="font-semibold">Support 2 (S2):</span>
                      <span>{formatLevel(signal.pivotLevels.s2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span className="font-bold">Support 3 (S3):</span>
                      <span className="font-extrabold">{formatLevel(signal.pivotLevels.s3)}</span>
                    </div>
                  </div>

                  {/* Equilibrium & Range Reference */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-[#0b1329] border border-[#19274e]">
                      <div className="text-slate-400 text-[10px]">50% Equilibrium (EQ):</div>
                      <div className="text-white font-bold mt-0.5">{formatLevel(signal.pivotLevels.equilibrium50)}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#0b1329] border border-[#19274e]">
                      <div className="text-slate-400 text-[10px]">Daily High / Low:</div>
                      <div className="text-slate-200 font-medium text-[10px] mt-0.5">
                        H: {formatLevel(signal.pivotLevels.dailyHigh)} | L: {formatLevel(signal.pivotLevels.dailyLow)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Price Action Breakdown */}
              {activeTab === 'structure' && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#0e172e] border border-cyan-500/30">
                    <div className="text-[10px] font-bold text-cyan-300 flex items-center justify-between">
                      <span>MARKET STRUCTURE (MSS/BOS):</span>
                      <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200 font-mono">
                        {signal.marketStructure}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Return to Pivot Status: <span className="text-slate-200 font-bold">{signal.returnToPivotStatus}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0b1329] border border-[#1c2c54]">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">
                      PRO INSTITUTIONAL PRICE ACTION BREAKDOWN:
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {signal.proAnalysis}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-[#162142] text-[11px]">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111933] border border-[#202e5a] text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied PA Plan' : 'Copy PA Setup'}</span>
                </button>

                <span className="text-[10px] text-slate-500 font-mono">
                  {signal.modelUsed || 'Gemini 3.7 Flash'}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
