import React, { useState } from 'react';
import { ScalpSignal } from '../types';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Target, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

interface AiScalperCardProps {
  signal: ScalpSignal | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClose: () => void;
  showOverlayLines: boolean;
  onToggleOverlayLines: () => void;
  symbol: string;
}

export const AiScalperCard: React.FC<AiScalperCardProps> = ({
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

  const handleCopy = () => {
    if (!signal) return;
    const text = `⚡ GEMINI 3.7 FLASH SCALP SIGNAL: ${symbol}
Direction: ${signal.bias} (${signal.confidence}% Confidence)
Setup: ${signal.setupType}
Entry Zone: ${signal.entryZone} ($${signal.entryPrice.toLocaleString()})
Stop Loss: $${signal.stopLoss.toLocaleString()}
Take Profit 1: $${signal.takeProfit1.toLocaleString()}
Take Profit 2 (Liq Target): $${signal.takeProfit2.toLocaleString()}
R:R: ${signal.riskRewardRatio} | Horizon: ${signal.timeframeHorizon}
Catalyst: ${signal.keyCatalyst}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLong = signal?.bias === 'LONG';
  const isShort = signal?.bias === 'SHORT';

  return (
    <div
      id="ai-scalper-floating-card"
      className="absolute top-24 sm:top-28 left-3 z-30 w-84 sm:w-96 max-h-[calc(100%-7.5rem)] rounded-2xl bg-[#0c0f1d]/95 border border-[#242c52] shadow-2xl backdrop-blur-xl transition-all font-sans overflow-y-auto custom-scrollbar flex flex-col text-slate-200"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#12172b] border-b border-[#1f2647]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-500 text-slate-950">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
              <span>AI Scalper</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono font-normal border border-amber-500/30">
                {signal?.modelUsed || 'Gemini 3.7 Flash'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Microstructure Liquidity Engine</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleOverlayLines}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showOverlayLines 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-[#181f3b] text-slate-400 border-[#222b4f] hover:text-white'
            }`}
            title={showOverlayLines ? 'Hide Chart Target Lines' : 'Show Chart Target Lines'}
          >
            {showOverlayLines ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#181f3b] hover:bg-[#20294d] border border-[#222b4f] text-slate-300 hover:text-white transition-colors"
            title="Re-run Scalp Scan with Gemini 3.7 Flash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg bg-[#181f3b] hover:bg-[#20294d] border border-[#222b4f] text-slate-300 hover:text-white transition-colors"
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181f3b] hover:bg-rose-500/20 border border-[#222b4f] hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      {!isMinimized && (
        <div className="p-3.5 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
          {isLoading && !signal && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin"></div>
                <Sparkles className="w-5 h-5 text-amber-400 absolute animate-pulse" />
              </div>
              <div className="text-xs font-semibold text-slate-200">
                Analyzing Orderbook & Liquidation Pools...
              </div>
              <div className="text-[11px] text-slate-400 max-w-[240px]">
                Gemini 3.7 Flash is evaluating funding rate arbitrage, high-leverage clusters, and liquidity sweep setups.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>AI Scalper Notice</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                {error}
              </p>
              <button
                onClick={onRefresh}
                className="mt-1 w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {signal && !isLoading && (
            <>
              {/* Bias & Conviction Badge */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#141930] border border-[#21294d]">
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1 shadow-md ${
                      isLong
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isShort
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-slate-700/40 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {isLong && <TrendingUp className="w-3.5 h-3.5" />}
                    {isShort && <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{signal.bias} SCALP</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Archetype</span>
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">
                      {signal.setupType}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {signal.confidence}%
                  </div>
                </div>
              </div>

              {/* Trade Levels Grid */}
              {(() => {
                const ep = signal.entryPrice || 1;
                const slPercent = ((signal.stopLoss - ep) / ep) * 100;
                const tp1Percent = ((signal.takeProfit1 - ep) / ep) * 100;
                const tp2Percent = ((signal.takeProfit2 - ep) / ep) * 100;
                const formatDelta = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

                return (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Entry Zone */}
                    <div className="p-2.5 rounded-xl bg-[#12172b] border border-[#1e2544] flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Target className="w-3 h-3 text-cyan-400" />
                          Entry Trigger
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                          Micro-Scalp
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-300 mt-1">
                        ${signal.entryPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        Zone: {signal.entryZone}
                      </span>
                    </div>

                    {/* Stop Loss */}
                    <div className="p-2.5 rounded-xl bg-[#12172b] border border-[#1e2544] flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          Tight SL
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                          {formatDelta(slPercent)}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400 mt-1">
                        ${signal.stopLoss.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        R:R {signal.riskRewardRatio} (Tight)
                      </span>
                    </div>

                    {/* TP 1 */}
                    <div className="p-2.5 rounded-xl bg-[#12172b] border border-[#1e2544] flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-400" />
                          TP 1 (Quick 1.5R)
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          {formatDelta(tp1Percent)}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 mt-1">
                        ${signal.takeProfit1.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Scale 50% & Trail SL</span>
                    </div>

                    {/* TP 2 / Liq Target */}
                    <div className="p-2.5 rounded-xl bg-[#12172b] border border-[#1e2544] flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          TP 2 (Liq Sweep)
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          {formatDelta(tp2Percent)}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300 mt-1">
                        ${signal.takeProfit2.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Final Target (3R+)</span>
                    </div>
                  </div>
                );
              })()}

              {/* Catalyst & Reasoning Box */}
              <div className="p-2.5 rounded-xl bg-[#101426] border border-[#1b223d] flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-amber-300/90 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Microstructure Catalyst
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-400">
                    <Clock className="w-3 h-3" />
                    {signal.timeframeHorizon}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {signal.keyCatalyst}
                </p>

                <div className="pt-1.5 border-t border-[#1a2039] text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Rationale: </strong>
                  {signal.reasoning}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161c34] hover:bg-[#1e274a] text-slate-300 hover:text-white border border-[#232c52] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Setup'}</span>
                </button>

                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <span>Target Liq: ${signal.liquidationTarget.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
