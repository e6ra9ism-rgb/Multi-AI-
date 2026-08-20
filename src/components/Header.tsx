import React, { useState } from 'react';
import { ColorPreset, LeverageFilter, SymbolOption, TickerData, Venue, TraderAccount, MultiAgentTradeSignal } from '../types';
import { SUPPORTED_SYMBOLS, getExchangePairName, getBaseCoin } from '../services/marketApi';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Sliders, 
  Activity, 
  ChevronDown, 
  Flame, 
  ShieldCheck, 
  Zap,
  Globe,
  BarChart3,
  Bot,
  Sparkles,
  Scale,
  Compass
} from 'lucide-react';

interface HeaderProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  venue: Venue;
  onVenueChange: (venue: Venue) => void;
  ticker: TickerData | null;
  colorPreset: ColorPreset;
  onColorPresetChange: (preset: ColorPreset) => void;
  intensitySensitivity: number;
  onIntensityChange: (val: number) => void;
  leverageFilter: LeverageFilter;
  onLeverageFilterChange: (lev: LeverageFilter) => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  showCandles: boolean;
  onToggleCandles: () => void;
  showDepthProfile: boolean;
  onToggleDepthProfile: () => void;
  showVolumeProfile: boolean;
  onToggleVolumeProfile: () => void;
  
  // 3X Multi-Agent Trader
  onOpenMultiAgentTrader?: () => void;
  multiAgentSignal?: MultiAgentTradeSignal | null;
  traderAccount?: TraderAccount;
  activePositionsCount?: number;

  // Truth AI
  onToggleTruthAI?: () => void;
  showTruthAICard?: boolean;

  // Price Action Master
  onTogglePriceAction?: () => void;
  showPriceActionCard?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSymbolChange,
  venue,
  onVenueChange,
  ticker,
  colorPreset,
  onColorPresetChange,
  intensitySensitivity,
  onIntensityChange,
  leverageFilter,
  onLeverageFilterChange,
  showHeatmap,
  onToggleHeatmap,
  showCandles,
  onToggleCandles,
  showDepthProfile,
  onToggleDepthProfile,
  showVolumeProfile,
  onToggleVolumeProfile,
  onOpenMultiAgentTrader,
  multiAgentSignal,
  traderAccount,
  activePositionsCount = 0,
  onToggleTruthAI,
  showTruthAICard = false,
  onTogglePriceAction,
  showPriceActionCard = false,
}) => {
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const isPositive = (ticker?.priceChangePercent || 0) >= 0;

  const formatUsd = (val: number) => {
    if (!val) return '$0.00';
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (!price) return '0.00';
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <header id="app-top-header" className="relative z-30 flex flex-col border-b border-[#1b1f33] bg-[#0c0e1a] text-slate-100">
      {/* Top Bar: Brand, Symbol, Ticker Numbers, Heatmap Intensity Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        
        {/* Left Section: Logo & Symbol Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-[#20253d]">
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-950/40">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold tracking-tight text-sm text-white">LIQUIDITY</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  LEGEND
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Heatmap Terminal</span>
            </div>
          </div>

          {/* Symbol Selector Dropdown */}
          <div className="relative">
            <button
              id="symbol-selector-btn"
              onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14182b] hover:bg-[#1a203a] border border-[#222947] text-sm font-semibold transition-all"
            >
              <span className="text-amber-400 font-mono font-bold">
                {getExchangePairName(currentSymbol, venue)}
              </span>
              <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                venue === 'hyperliquid'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : venue === 'binance'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {venue === 'hyperliquid' ? 'USDC DEX' : venue === 'binance' ? 'USDT PERP' : 'AGGREGATED'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showSymbolDropdown && (
              <div id="symbol-dropdown-menu" className="absolute top-full left-0 mt-1.5 w-64 rounded-xl bg-[#121629] border border-[#262e50] shadow-2xl p-1.5 z-50">
                <div className="text-[10px] text-slate-400 px-2.5 py-1 uppercase font-semibold tracking-wider flex items-center justify-between">
                  <span>Select Market</span>
                  <span className="text-[9px] text-amber-400">Binance USDT / Hyperliquid USDC</span>
                </div>
                <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
                  {SUPPORTED_SYMBOLS.map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => {
                        onSymbolChange(s.symbol);
                        setShowSymbolDropdown(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        currentSymbol === s.symbol
                          ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                          : 'text-slate-300 hover:bg-[#1c223d] hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-mono font-bold text-slate-100">
                          {venue === 'hyperliquid' ? s.hyperliquidSymbol : venue === 'binance' ? s.binanceSymbol : `${s.baseAsset} (USDT/USDC)`}
                        </span>
                        <span className="text-[10px] text-slate-400">{s.name}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 font-mono text-[9px]">
                        <span className="px-1 py-0.2 rounded bg-[#1e243f] text-amber-300">BIN: {s.binanceSymbol}</span>
                        <span className="px-1 py-0.2 rounded bg-[#16273e] text-cyan-300">HL: {s.hyperliquidSymbol}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Venue Toggle Switcher (Binance / Hyperliquid / Aggregated) */}
          <div id="venue-switcher" className="hidden sm:flex items-center bg-[#14182b] p-0.5 rounded-lg border border-[#222947] text-xs">
            <button
              id="venue-binance"
              onClick={() => onVenueChange('binance')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                venue === 'binance'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Binance Futures Perpetual Contracts (Settled in USDT)"
            >
              <span>Binance</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 font-mono">USDT</span>
            </button>
            <button
              id="venue-hyperliquid"
              onClick={() => onVenueChange('hyperliquid')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                venue === 'hyperliquid'
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hyperliquid Decentralized Perpetual Contracts (Settled in USDC)"
            >
              <span>Hyperliquid</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 font-mono">USDC</span>
            </button>
            <button
              id="venue-aggregated"
              onClick={() => onVenueChange('aggregated')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                venue === 'aggregated'
                  ? 'bg-purple-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Aggregated Dual-Exchange Liquidity (Binance USDT + Hyperliquid USDC combined)"
            >
              <span>Aggregated</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 font-mono">Dual</span>
            </button>
          </div>
        </div>

        {/* Center Section: Live Heatmap Intensity Spectrum Slider (as seen in CoinGlass screenshot) */}
        <div id="heatmap-spectrum-controller" className="hidden xl:flex items-center gap-3 bg-[#13172b] px-3 py-1.5 rounded-xl border border-[#202747]">
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Heatmap Intensity:
          </span>
          <div className="flex items-center gap-2">
            {/* Visual gradient spectrum bar */}
            <div className="w-32 h-3 rounded-full bg-gradient-to-r from-[#181230] via-[#8c2a7e] via-[#e25c56] via-[#f7b744] to-[#fffee0] border border-slate-700/50 shadow-inner" />
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={intensitySensitivity}
              onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
              className="w-20 accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              title="Adjust heatmap liquidation density sensitivity"
            />
            <span className="text-[10px] font-mono text-amber-300 w-8">{intensitySensitivity.toFixed(1)}x</span>
          </div>
        </div>

        {/* Right Section: Live Price & 24h Stats + 3X Multi-Agent Launcher Button */}
        <div className="flex items-center gap-2.5">
          {/* Price Action Master Bot Button */}
          {onTogglePriceAction && (
            <button
              id="header-open-price-action-btn"
              onClick={onTogglePriceAction}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                showPriceActionCard
                  ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400/60 shadow-lg shadow-cyan-950/50'
                  : 'bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 border-cyan-500/30'
              }`}
              title="Open Price Action Master (Return to Pivot & Market Structure)"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">Price Action</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/30 text-cyan-200 font-mono">
                    Pivots
                  </span>
                </div>
                <span className="text-[9px] text-cyan-300/70 font-mono font-normal">RTP & Structure</span>
              </div>
            </button>
          )}

          {/* Truth AI Button */}
          {onToggleTruthAI && (
            <button
              id="header-open-truth-ai-btn"
              onClick={onToggleTruthAI}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                showTruthAICard
                  ? 'bg-purple-600/30 text-purple-200 border-purple-400/60 shadow-lg shadow-purple-950/50'
                  : 'bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 border-purple-500/30'
              }`}
              title="Open Truth AI (Macro Realist & Bear Market Reality Anchor)"
            >
              <Scale className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">Truth AI</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono">
                    Realist
                  </span>
                </div>
                <span className="text-[9px] text-purple-300/70 font-mono font-normal">Macro Context</span>
              </div>
            </button>
          )}

          {onOpenMultiAgentTrader && (
            <button
              id="header-open-multi-agent-btn"
              onClick={onOpenMultiAgentTrader}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-slate-100 shadow-md shadow-amber-950/30 transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
              title="Open 4-Agent Quant Council & Bitunix Live Futures Terminal"
            >
              <div className="relative">
                <Bot className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                {traderAccount?.autoTraderActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono tracking-tight text-white">
                    4-Agent Council
                  </span>
                  <span className="px-1 py-0.2 rounded text-[9px] font-mono font-extrabold bg-amber-400 text-slate-950">
                    4-AI
                  </span>
                </div>
                <div className="text-[10px] text-amber-300/80 font-mono flex items-center gap-1">
                  {multiAgentSignal ? (
                    <span className={multiAgentSignal.consensusBias === 'LONG' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {multiAgentSignal.consensusBias} ({multiAgentSignal.consensusConfidence}%)
                    </span>
                  ) : (
                    <span>Quad Engine</span>
                  )}
                  {activePositionsCount > 0 && (
                    <span className="ml-1 px-1 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-bold">
                      {activePositionsCount} POS
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}

          {ticker && (
            <div id="ticker-live-stats" className="flex items-center gap-4 text-xs font-mono">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${formatPrice(ticker.lastPrice)}
                  </span>
                  <span
                    className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                      isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {ticker.priceChangePercent.toFixed(2)}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Live Mark Price</span>
              </div>

              <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-[#20253d] text-[11px]">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px]">24h Volume</span>
                  <span className="text-slate-200">{formatUsd(ticker.quoteVolume24h)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px]">Open Interest</span>
                  <span className="text-amber-400 font-semibold">{formatUsd(ticker.openInterestUsd || 0)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px]">Funding Rate</span>
                  <span className={`font-semibold ${(ticker.fundingRate || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {((ticker.fundingRate || 0) * 100).toFixed(4)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Controls Bar: CoinGlass Indicators Toggles, Leverage Filter, Palette */}
      <div id="secondary-controls-bar" className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-[#090a14] border-t border-[#181c2f] text-xs">
        
        {/* Left: Indicator Layers Toggle (matching user's CoinGlass screenshot labels) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="toggle-coinglass-heatmap"
            onClick={onToggleHeatmap}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              showHeatmap
                ? 'bg-[#222b4c] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-[#121626] text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>&lt;CoinGlass&gt; Liquidation Heatmap</span>
          </button>

          <button
            id="toggle-depth-profile"
            onClick={onToggleDepthProfile}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              showDepthProfile
                ? 'bg-[#222b4c] text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-[#121626] text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>&lt;CoinGlass&gt; Liquidity Profile</span>
          </button>

          <button
            id="toggle-candlestick-series"
            onClick={onToggleCandles}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              showCandles
                ? 'bg-[#222b4c] text-emerald-300 border border-emerald-500/40'
                : 'bg-[#121626] text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Candlesticks</span>
          </button>

          <button
            id="toggle-volume-bars"
            onClick={onToggleVolumeProfile}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
              showVolumeProfile
                ? 'bg-[#222b4c] text-purple-300 border border-purple-500/40'
                : 'bg-[#121626] text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span>Volume</span>
          </button>
        </div>

        {/* Right: Leverage Tier Filter & Colormap Preset */}
        <div className="flex items-center gap-3">
          {/* Leverage Filter */}
          <div className="flex items-center gap-1 bg-[#121626] p-0.5 rounded-lg border border-[#1e2540]">
            <span className="text-[10px] text-slate-400 px-1.5 font-semibold">LEVERAGE:</span>
            {(['all', '100x', '50x', '25x', '10x'] as LeverageFilter[]).map((lev) => (
              <button
                key={lev}
                onClick={() => onLeverageFilterChange(lev)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                  leverageFilter === lev
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2038]'
                }`}
              >
                {lev.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Colormap Preset Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#121626] px-2 py-1 rounded-lg border border-[#1e2540]">
            <span className="text-[10px] text-slate-400 font-semibold">PALETTE:</span>
            <select
              value={colorPreset}
              onChange={(e) => onColorPresetChange(e.target.value as ColorPreset)}
              className="bg-[#181d33] text-slate-200 text-[11px] rounded px-1.5 py-0.5 border border-[#293254] outline-none font-medium cursor-pointer"
            >
              <option value="coinglass">CoinGlass Legend</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
              <option value="magma">Deep Magma</option>
              <option value="inferno">Inferno Thermal</option>
              <option value="viridis">Viridis Spectrum</option>
            </select>
          </div>
        </div>

      </div>
    </header>
  );
};
