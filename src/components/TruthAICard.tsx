import React, { useState } from 'react';
import { TruthAISignal } from '../types';
import { 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  ShieldAlert, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Copy, 
  Check, 
  Target, 
  Flame, 
  Compass, 
  Crosshair, 
  Layers 
} from 'lucide-react';

interface TruthAICardProps {
  signal: TruthAISignal | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClose: () => void;
  symbol: string;
}

export const TruthAICard: React.FC<TruthAICardProps> = ({
  signal,
  isLoading,
  error,
  onRefresh,
  onClose,
  symbol,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'verdict' | 'orderbook' | 'macro'>('verdict');

  const handleCopy = () => {
    if (!signal) return;
    const text = `⚖️ TRUTH AI REALIST DIRECTIVE: ${symbol}
Market Regime: ${signal.marketRegime}
Direction: ${signal.bias} (${signal.confidence}% Conviction | Realist Score: ${signal.realistScore}/100)
Entry Level: $${signal.entryPrice.toLocaleString()}
Stop Loss (Invalidation): $${signal.stopLoss.toLocaleString()}
Take Profit 1: $${signal.takeProfit1.toLocaleString()}
Take Profit 2: $${signal.takeProfit2.toLocaleString()}
Overhead Supply Wall: $${signal.orderbookTruth.overheadSupplyWall.toLocaleString()}
Real Spot Support: $${signal.orderbookTruth.realSpotSupport.toLocaleString()}
Verdict: ${signal.rationalVerdict}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isShort = signal?.bias === 'SHORT';
  const isLong = signal?.bias === 'LONG';
  const isCash = signal?.bias === 'CASH_WAIT' || signal?.bias === 'NEUTRAL';

  const regimeLabel = signal?.marketRegime.replace(/_/g, ' ');

  return (
    <div
      id="truth-ai-floating-card"
      className="absolute top-24 sm:top-28 right-3 z-30 w-88 sm:w-104 max-h-[calc(100%-7.5rem)] rounded-2xl bg-[#090c1a]/95 border border-purple-500/30 shadow-2xl backdrop-blur-xl transition-all font-sans overflow-y-auto custom-scrollbar flex flex-col text-slate-200"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#101428] border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 text-white shadow-md">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
              <span>Truth AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-medium border border-purple-500/30">
                Macro Realist ⚖️
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Zero-Hopium Bear/Bull Context Engine</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#151b36] border border-[#20274a] text-slate-400 hover:text-amber-300 transition-colors disabled:opacity-50"
            title="Recalculate Macro Reality"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg bg-[#151b36] border border-[#20274a] text-slate-400 hover:text-white transition-colors"
            title={isMinimized ? 'Expand Card' : 'Minimize Card'}
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151b36] border border-[#20274a] text-slate-400 hover:text-rose-400 transition-colors"
            title="Close Truth AI"
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
                <div className="w-10 h-10 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
                <Scale className="w-4 h-4 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Truth AI Deliberating...</p>
                <p className="text-[11px] text-slate-400">Stripping away retail bias & verifying spot liquidity walls</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Analysis Notice</p>
                <p className="text-[11px] text-rose-300/80">{error}</p>
                <button
                  onClick={onRefresh}
                  className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 text-[10px] font-semibold hover:bg-rose-500/30"
                >
                  Retry Truth AI Analysis
                </button>
              </div>
            </div>
          )}

          {/* Signal Payload Display */}
          {signal && !isLoading && (
            <>
              {/* Top Direction & Regime Banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#121630] to-[#1a1738] border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl text-white ${
                    isShort ? 'bg-rose-500/30 text-rose-400 border border-rose-500/40' :
                    isLong ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40' :
                    'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isShort ? <TrendingDown className="w-5 h-5" /> :
                     isLong ? <TrendingUp className="w-5 h-5" /> :
                     <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black tracking-wide font-mono ${
                        isShort ? 'text-rose-400' : isLong ? 'text-emerald-400' : 'text-amber-300'
                      }`}>
                        {signal.bias}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono font-bold">
                        {signal.confidence}% Conviction
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">
                      {regimeLabel}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">Realist Score</div>
                  <div className="text-sm font-extrabold font-mono text-purple-300">
                    {signal.realistScore}<span className="text-[10px] text-slate-500">/100</span>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Verdict vs Orderbook Reality vs Macro Context */}
              <div className="flex items-center bg-[#0d1022] p-0.5 rounded-lg border border-[#1b2144] text-[11px]">
                <button
                  onClick={() => setActiveTab('verdict')}
                  className={`flex-1 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'verdict'
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Realistic Setup
                </button>
                <button
                  onClick={() => setActiveTab('orderbook')}
                  className={`flex-1 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'orderbook'
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Orderbook Truth
                </button>
                <button
                  onClick={() => setActiveTab('macro')}
                  className={`flex-1 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'macro'
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Macro Checks
                </button>
              </div>

              {activeTab === 'verdict' && (
                <div className="space-y-2.5">
                  {/* Execution Levels Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-[#11162d] border border-[#1e2547]">
                      <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                        <Crosshair className="w-3 h-3" /> Entry Level
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        ${signal.entryPrice.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#11162d] border border-rose-500/30">
                      <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Invalidation (SL)
                      </div>
                      <div className="text-sm font-bold text-rose-300 mt-0.5">
                        ${signal.stopLoss.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#11162d] border border-emerald-500/30">
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Target className="w-3 h-3" /> TP1 Target
                      </div>
                      <div className="text-sm font-bold text-emerald-300 mt-0.5">
                        ${signal.takeProfit1.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#11162d] border border-purple-500/30">
                      <div className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                        <Layers className="w-3 h-3" /> TP2 Extension
                      </div>
                      <div className="text-sm font-bold text-purple-300 mt-0.5">
                        ${signal.takeProfit2.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Directive */}
                  <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                    <div className="text-[10px] font-bold text-purple-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-purple-400" />
                      OPERATIONAL ACTION DIRECTIVE:
                    </div>
                    <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">
                      {signal.recommendedAction}
                    </p>
                  </div>

                  {/* Rational Verdict */}
                  <div className="p-2.5 rounded-xl bg-[#0e1224] border border-[#1d2345]">
                    <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <span>⚖️ REALIST VERDICT:</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {signal.rationalVerdict}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'orderbook' && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-[#11162d] border border-[#1f264d] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Overhead Supply Wall:
                      </span>
                      <span className="font-mono font-bold text-white">
                        ${signal.orderbookTruth.overheadSupplyWall.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" /> Real Spot Support:
                      </span>
                      <span className="font-mono font-bold text-white">
                        ${signal.orderbookTruth.realSpotSupport.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                    <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> ORDERBOOK TRUTH & SPOOF WARNING:
                    </div>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      {signal.orderbookTruth.fakeBidDepthWarning}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#101429] border border-[#1c2242] text-xs">
                    <div className="text-[10px] font-bold text-purple-300">
                      THESIS INVALIDATION TRIGGER:
                    </div>
                    <p className="text-slate-300 font-mono text-xs mt-1">
                      If price crosses ${signal.invalidationTriggerPrice.toLocaleString()} with sustained 4H candle close, the current macro thesis is invalidated.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'macro' && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-[#11162d] border border-rose-500/30">
                    <div className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> BEAR TRAP / RELIEF PUMP WARNING:
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {signal.bearTrapWarning}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#11162d] border border-purple-500/30">
                    <div className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" /> BULLISH DELUSION CHECK:
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {signal.bullishDelusionCheck}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0e1224] border border-[#1d2345]">
                    <div className="text-[10px] font-bold text-slate-400">
                      MACRO CYCLE ASSESSMENT:
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {signal.macroCycleAssessment}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-[#181e3b] text-[11px]">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141933] border border-[#212952] text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Directive' : 'Copy Directive'}</span>
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
