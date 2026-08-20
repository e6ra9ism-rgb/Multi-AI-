import React, { useState } from 'react';
import { DominantTimeframeAnalysis, TimeframeReactionScore } from '../types';
import { 
  Compass, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  Sliders, 
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  ArrowRight,
  Filter
} from 'lucide-react';

interface DominantTimeframeCardProps {
  data: DominantTimeframeAnalysis | null;
  loading: boolean;
  onRefresh: () => void;
  symbol: string;
  activeInterval?: string;
  onSelectTimeframe?: (tf: string) => void;
}

export const DominantTimeframeCard: React.FC<DominantTimeframeCardProps> = ({
  data,
  loading,
  onRefresh,
  symbol,
  activeInterval,
  onSelectTimeframe,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showPersianGuide, setShowPersianGuide] = useState(false);

  if (!data && loading) {
    return (
      <div className="bg-[#0e1224] border border-[#222947] rounded-xl p-3.5 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#181f3b] flex items-center justify-center">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
          <div>
            <div className="h-4 w-44 bg-[#181f3b] rounded mb-1.5" />
            <div className="h-3 w-64 bg-[#141a33] rounded" />
          </div>
        </div>
        <div className="h-8 w-28 bg-[#181f3b] rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  const isBullish = data.dominantBias === 'BULLISH';
  const isBearish = data.dominantBias === 'BEARISH';

  return (
    <div id="dominant-timeframe-widget" className="bg-[#0c1022]/95 border border-[#222947] rounded-xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
      {/* Top Main Status Bar */}
      <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1b223d]/80 bg-gradient-to-r from-[#10152e] via-[#0d1226] to-[#121630]">
        
        {/* Left: Dominant Timeframe King & Bias */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center shadow-lg ${
            isBullish 
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-emerald-950/40' 
              : isBearish 
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-rose-950/40'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-amber-950/40'
          }`}>
            <Compass className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Dominant Reaction TF:
              </span>
              <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs sm:text-sm border shadow-sm flex items-center gap-1 ${
                isBullish 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : isBearish 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <span className="text-white font-bold">{data.dominantLabel}</span>
                <span>•</span>
                <span>{data.dominantBias}</span>
                {isBullish ? <TrendingUp className="w-3.5 h-3.5 ml-0.5" /> : <TrendingDown className="w-3.5 h-3.5 ml-0.5" />}
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171e3b] text-cyan-300 border border-cyan-500/30">
                Confidence: {data.dominantConfidence}%
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-400" />
                <span>Trigger: <strong className="text-white">{data.triggerLabel}</strong></span>
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1 line-clamp-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{data.tradingRule}</span>
            </p>
          </div>
        </div>

        {/* Right: Actions, Alignment Meter & Expand Toggle */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {/* MTF Alignment Score Meter */}
          <div className="hidden sm:flex flex-col items-end px-3 py-1 rounded-lg bg-[#141933] border border-[#222a4d]">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>MTF Alignment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-[#1e264a] overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    data.overallAlignmentScore >= 80 ? 'bg-emerald-400' : data.overallAlignmentScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${data.overallAlignmentScore}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-200">
                {data.overallAlignmentScore}%
              </span>
            </div>
          </div>

          {/* Persian Guide Toggle */}
          <button
            onClick={() => setShowPersianGuide(!showPersianGuide)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 font-sans ${
              showPersianGuide
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-[#141933] text-slate-400 border-[#222a4d] hover:text-slate-200'
            }`}
            title="راهنمای حل تضاد نظرات ربات‌ها و تشخیص تایم فریم اصلی"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>راهنما و فیلتر</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-[#141933] hover:bg-[#1a2142] border border-[#222a4d] text-slate-400 hover:text-cyan-300 transition-all"
            title="Recalculate MTF Dominance"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Expand Matrix Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span>{expanded ? 'Hide Matrix' : '7-TF Matrix'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Persian Explainability & Bot Noise Filter Banner */}
      {showPersianGuide && (
        <div className="p-3.5 bg-[#121733]/95 border-b border-[#222a4d] text-right font-sans text-xs space-y-2.5 text-slate-200" dir="rtl">
          <div className="flex items-center justify-between text-amber-400 font-bold border-b border-[#1f284f] pb-1.5">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>چرا ربات‌ها در هر تایم‌فریم نظر متفاوتی دارند و چطور فیلتر کنیم؟</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-[#1b2247]">
              فرمول انحصاری HTF ➔ LTF
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
            <div className="p-2.5 rounded-lg bg-[#0b0e1d] border border-[#1e264a]">
              <strong className="text-cyan-300 block mb-1">۱. تایم‌فریم غالب ({data.dominantLabel}):</strong>
              <span>مارکت در حال حاضر به استخر نقدینگی تایم <strong>{data.dominantLabel}</strong> پاسخ داده است. تمام جهت‌گیری اصلی معامله باید با جهت <strong>{data.dominantBias}</strong> این تایم هماهنگ باشد.</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0b0e1d] border border-[#1e264a]">
              <strong className="text-rose-300 block mb-1">۲. فیلتر نویز تایم‌های پایین (1m / 5m):</strong>
              <span>اگر ربات‌های تایم ۱ دقیقه سیگنال خلاف جهت دادند، صرفاً نوسانات مقطعی و پولبک هستند. <strong>سیگنال‌های خلاف جهت تایم {data.dominantLabel} را نادیده بگیرید.</strong></span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0b0e1d] border border-[#1e264a]">
              <strong className="text-emerald-300 block mb-1">۳. زمان دقیق ورود روی تریگر ({data.triggerLabel}):</strong>
              <span>{data.triggerCondition} با این استراتژی، بهترین نسبت ریسک به ریوارد با کمترین حدضرر بدست می‌آید.</span>
            </div>
          </div>

          <div className="bg-[#171f40] p-2 rounded-lg text-[11px] text-amber-200 border border-amber-500/20 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>دستور معاملاتی لحظه‌ای:</strong> {data.tradingRule}</span>
          </div>
        </div>
      )}

      {/* Expandable 7-Timeframe Matrix */}
      {expanded && (
        <div className="p-3 sm:p-4 bg-[#090d1c] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                7-Timeframe Orderflow & Reaction Strength Matrix
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Model: {data.modelUsed || 'Gemini 3.7 Orderflow Engine'}
            </span>
          </div>

          {/* 7-Timeframe Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {data.timeframes?.map((tf) => {
              const isTfDominant = tf.isDominant;
              const isTfBull = tf.bias === 'BULLISH';
              const isTfBear = tf.bias === 'BEARISH';
              const isNoise = tf.status === 'SUBORDINATE_NOISE';

              return (
                <div
                  key={tf.timeframe}
                  className={`p-2.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isTfDominant
                      ? 'bg-gradient-to-b from-[#18234d] to-[#0f1633] border-cyan-400/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
                      : isNoise
                      ? 'bg-[#0f1326]/60 border-[#1a203b] opacity-80'
                      : 'bg-[#10152e] border-[#1e274b] hover:border-[#2d3a70]'
                  }`}
                >
                  {/* Dominant Crown Badge */}
                  {isTfDominant && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-bl-md shadow uppercase tracking-wider font-mono">
                      👑 DOMINANT
                    </div>
                  )}

                  {/* Header: TF Label + Status */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <button
                        onClick={() => onSelectTimeframe?.(tf.timeframe)}
                        className={`text-sm font-black font-mono px-2 py-0.5 rounded transition-all ${
                          isTfDominant
                            ? 'bg-cyan-500 text-slate-950 shadow'
                            : 'bg-[#182040] text-slate-200 hover:bg-[#202b54]'
                        }`}
                        title={`Click to switch chart to ${tf.label}`}
                      >
                        {tf.label}
                      </button>

                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isTfBull 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : isTfBear 
                          ? 'bg-rose-500/20 text-rose-300' 
                          : 'bg-slate-500/20 text-slate-300'
                      }`}>
                        {tf.bias}
                      </span>
                    </div>

                    {/* Reaction Score Gauge */}
                    <div className="space-y-1 my-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Reaction:</span>
                        <span className="font-bold text-slate-200">{tf.reactionScore}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#181f3d] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isTfDominant
                              ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                              : tf.reactionScore >= 75
                              ? 'bg-emerald-400'
                              : tf.reactionScore >= 50
                              ? 'bg-amber-400'
                              : 'bg-slate-500'
                          }`}
                          style={{ width: `${tf.reactionScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Micro Metrics */}
                    <div className="space-y-1 text-[10px] font-mono text-slate-400 border-t border-[#1a2142] pt-1.5 mb-2">
                      <div className="flex items-center justify-between">
                        <span>Pool Vol:</span>
                        <span className="text-slate-200 font-bold">
                          ${((tf.liquidityPoolVolumeUsd || 0) / 1e6).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Displace:</span>
                        <span className="text-cyan-300">
                          +{tf.displacementPercent || 0.5}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verdict Pill */}
                  <div className={`p-1.5 rounded-lg text-[9px] leading-tight font-sans mt-auto ${
                    isTfDominant
                      ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 font-medium'
                      : isNoise
                      ? 'bg-rose-500/10 text-rose-300/90 border border-rose-500/20'
                      : 'bg-[#141b38] text-slate-300'
                  }`}>
                    {tf.actionableVerdict}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Bar with Institutional Pairing */}
          <div className="p-3 rounded-xl bg-[#111630] border border-[#20294e] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Institutional Execution Pair:</strong> {data.dominantLabel} (Key Level) ➔ {data.triggerLabel} (Trigger Entry).
              </span>
            </div>
            <div className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
              Rule: Ignore counter-trend noise on 1m/5m until {data.triggerLabel} prints confirmed MSS.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
