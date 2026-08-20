import React, { useState } from 'react';
import { 
  MultiAgentTradeSignal, 
  PaperPosition, 
  ClosedTrade, 
  TraderAccount, 
  TickerData,
  Candle,
  CryptoNewsSignal,
  UserAuthProfile,
  MTFConfirmationPair,
  BitunixAccountInfo,
  BitunixRealPosition,
  BitunixOrderResponse,
  BitunixPlaceOrderParams,
  BitunixDryRunResult
} from '../types';
import { 
  Bot, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  RefreshCw, 
  X, 
  Check, 
  Copy, 
  Play, 
  Pause, 
  BarChart2, 
  MessageSquare, 
  Sliders, 
  Flame, 
  Award, 
  Newspaper, 
  Database, 
  ExternalLink, 
  LogIn, 
  LogOut, 
  User, 
  CheckCircle2, 
  Search,
  Globe,
  Radio,
  Send,
  Bell,
  BellRing,
  AlertCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  Workflow,
  Clock,
  Activity,
  GitFork,
  Cpu,
  Key,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { marketApi } from '../services/marketApi';

interface MultiAgentTraderModalProps {
  signal: MultiAgentTradeSignal | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: (overrideMtfPair?: string) => void;
  onClose: () => void;
  symbol: string;
  ticker: TickerData | null;
  recentCandles: Candle[];
  
  // News Agent (Agent Delphi)
  newsSignal?: CryptoNewsSignal | null;
  isNewsLoading?: boolean;
  onRefreshNews?: () => void;

  // Firebase Auth & Cloud Firestore
  userProfile?: UserAuthProfile | null;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  firestoreStatus?: 'connected' | 'syncing' | 'offline';
  
  // Paper Trading State
    closedTrades: ClosedTrade[];
  account: TraderAccount;
  onExecuteTrade: (params: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    orderType?: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    leverage: number;
    marginUsd: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    consensusScore: string;
    confidence: number;
  }) => void;
        onToggleAutoTrader: () => void;
  onUpdateAccountConfig: (config: Partial<TraderAccount>) => void;
  onResetAccount: () => void;

  // Bitunix Real Trading Props
  bitunixAccountInfo?: BitunixAccountInfo | null;
  bitunixPositions?: BitunixRealPosition[];
  isBitunixSyncing?: boolean;
  onBitunixSync?: (apiKey?: string, secretKey?: string) => Promise<void>;
  onBitunixPlaceOrder?: (params: BitunixPlaceOrderParams) => Promise<BitunixOrderResponse>;
  onBitunixClosePosition?: (symbol: string) => Promise<void>;
  onBitunixTestConnection?: (creds: { apiKey: string; secretKey: string }) => Promise<any>;
}

const CANONICAL_MTF_PAIRS: { id: string; htf: string; ltf: string; name: string; desc: string; triggerName: string }[] = [
  { id: 'W_H4', htf: '1W', ltf: '4H', name: 'W ➔ H4', desc: 'Weekly Macro Key Level (HTF Supply/Demand & Weekly Open)', triggerName: '4-Hour Intermediate Structure & Liquidity Sweep' },
  { id: 'D_H1', htf: '1D', ltf: '1H', name: 'D ➔ H1', desc: 'Daily Key Level (Major Pivot / S&R)', triggerName: '1-Hour Structural Trigger & MSS' },
  { id: 'H4_M15', htf: '4H', ltf: '15M', name: 'H4 ➔ M15', desc: '4-Hour Key Level (Orderblock / Liquidity Shelf)', triggerName: '15-Minute Market Structure Shift' },
  { id: 'H1_M5', htf: '1H', ltf: '5M', name: 'H1 ➔ M5', desc: '1-Hour Key Level (Session Pivot / VWAP)', triggerName: '5-Minute Return to Pivot & Sweep' },
  { id: 'M15_M1', htf: '15M', ltf: '1M', name: 'M15 ➔ M1', desc: '15-Minute Micro Key Level', triggerName: '1-Minute Microstructure Scalp Trigger' },
];

export const MultiAgentTraderModal: React.FC<MultiAgentTraderModalProps> = ({
  signal,
  isLoading,
  error,
  onRefresh,
  onClose,
  symbol,
  ticker,
  newsSignal,
  isNewsLoading = false,
  onRefreshNews,
  userProfile,
  onSignInGoogle,
  onSignOut,
  firestoreStatus = 'connected',
    closedTrades,
  account,
  onExecuteTrade,
        onToggleAutoTrader,
  onUpdateAccountConfig,
  onResetAccount,
  bitunixAccountInfo,
  bitunixPositions,
  isBitunixSyncing = false,
  onBitunixSync,
  onBitunixPlaceOrder,
  onBitunixClosePosition,
  onBitunixTestConnection,
}) => {
  const [activeTab, setActiveTab] = useState<'consensus' | 'mtf' | 'debate' | 'news' | 'positions' | 'history' | 'bitunix' | 'database' | 'telegram' | 'settings'>('consensus');
  const [selectedMtfPair, setSelectedMtfPair] = useState<string>('H1_M5');
  const [selectedLeverage, setSelectedLeverage] = useState<number>(account.autoTraderDefaultLeverage || 100);
  const [selectedMargin, setSelectedMargin] = useState<number>(account.autoTraderPositionSizeUsd || 10);
  const [copied, setCopied] = useState(false);

  // Telegram test status state
  const [tgBotToken, setTgBotToken] = useState(account.telegramBotToken || '');
  const [tgChatId, setTgChatId] = useState(account.telegramChatId || '');
  const [tgSending, setTgSending] = useState(false);
  const [tgResult, setTgResult] = useState<{ success: boolean; message: string } | null>(null);

  // Bitunix Real Exchange State
  const [bxApiKey, setBxApiKey] = useState(account.bitunixApiKey || '');
  const [bxSecretKey, setBxSecretKey] = useState(account.bitunixSecretKey || '');
  const [showBxSecret, setShowBxSecret] = useState(false);
  const [saveCredsStatus, setSaveCredsStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [bxTesting, setBxTesting] = useState(false);
  const [bxTestResult, setBxTestResult] = useState<{ success: boolean; connected?: boolean; latencyMs?: number; message?: string; error?: string; hint?: string; serverIp?: string } | null>(null);
  const [bxDryRunning, setBxDryRunning] = useState(false);
  const [bxDryRunResult, setBxDryRunResult] = useState<BitunixDryRunResult | null>(null);
  const [showDryRunPayload, setShowDryRunPayload] = useState(false);
  const [bxOrderExecuting, setBxOrderExecuting] = useState(false);
  const [bxOrderFeedback, setBxOrderFeedback] = useState<{ success: boolean; message: string; orderId?: string | number } | null>(null);
  const [bxClosingSymbol, setBxClosingSymbol] = useState<string | null>(null);
  const [serverOutboundIp, setServerOutboundIp] = useState<string>('34.96.39.119');
  const [copiedIp, setCopiedIp] = useState(false);

  // Fetch Server Outbound Egress IP on mount
  React.useEffect(() => {
    fetch('/api/server-ip')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ip) setServerOutboundIp(data.ip);
      })
      .catch(() => {});
  }, []);

  const isRealBitunix = account.executionMode === 'BITUNIX_REAL';
  const curPrice = ticker?.lastPrice || signal?.entryPrice || 0;
  const isLong = signal?.consensusBias === 'LONG';
  const isShort = signal?.consensusBias === 'SHORT';

  // Calculate position notional
  const notionalSize = selectedMargin * selectedLeverage;

  const handleCopySetup = () => {
    if (!signal) return;
    const text = `🤖 4-AGENT QUANT MULTI-AGENT COUNCIL SETUP: ${symbol}
Consensus: ${signal.consensusBias} (${signal.consensusConfidence}% Confidence | ${signal.consensusScore})
MTF Confluence: ${signal.mtfConfirmation?.pair || 'H1 ➔ M5'} (${signal.mtfConfirmation?.confluenceStatus || '100% Full Confluence'})
HTF Key Level: $${signal.mtfConfirmation?.htfKeyLevel?.price.toLocaleString()} | LTF Trigger: $${signal.mtfConfirmation?.ltfTrigger?.price.toLocaleString()}
Recommended Leverage: ${selectedLeverage}X
Limit Entry (RTP/Golden Ratio): $${(signal.limitEntryPrice || signal.entryPrice).toLocaleString()}
Stop Loss (Tight Invalidation): $${signal.stopLoss.toLocaleString()}
Take Profit 1 (Scale 50%): $${signal.takeProfit1.toLocaleString()}
Take Profit 2 (Liquidation Magnet): $${signal.takeProfit2.toLocaleString()}
R:R Ratio: ${signal.riskRewardRatio} | Max Drawdown: ${signal.maxExpectedDrawdownPercent}%
News Catalyst: ${newsSignal?.headline || 'Institutional spot demand & volume accumulation'}
Executive Summary: ${signal.executiveSummary}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteNow = () => {
    if (!signal) return;
    onExecuteTrade({
      symbol,
      side: signal.consensusBias === 'SHORT' ? 'SHORT' : 'LONG',
      orderType: signal.orderType || 'LIMIT',
      limitPrice: signal.limitEntryPrice || signal.entryPrice,
      leverage: selectedLeverage,
      marginUsd: selectedMargin,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit1: signal.takeProfit1,
      takeProfit2: signal.takeProfit2,
      consensusScore: signal.consensusScore,
      confidence: signal.consensusConfidence,
    });
    setActiveTab('bitunix');
  };

  const handleSwitchMtfPair = (pairId: string) => {
    setSelectedMtfPair(pairId);
    onRefresh(pairId);
  };

  return (
    <div
      id="multi-agent-trader-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md font-sans text-slate-100 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl bg-[#0b0e1b] border border-[#232b4d] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#111629] border-b border-[#1c2340]">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 shadow-lg shadow-amber-950/40">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  4-Agent Quant Multi-Agent Council & Execution Terminal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-500/40">
                  {selectedLeverage}X LEVERAGE
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Bot className="w-2.5 h-2.5 text-indigo-400" />
                  4-Agent Synthesis Bot
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>4 AI Models: Price Action Master, Truth AI, AI Scalper, and Dominant TF AI</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-mono font-semibold">{symbol}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-mono">${curPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2">
            {/* Telegram Alert Quick Status Button */}
            <button
              onClick={() => setActiveTab('telegram')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                account.telegramNotificationsEnabled
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                  : 'bg-[#181e35] text-slate-400 border-[#222b4a] hover:text-slate-200'
              }`}
              title="Configure Telegram Signal & Auto-Trade Alerts"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>{account.telegramNotificationsEnabled ? 'TG Alerts ON' : 'TG Setup'}</span>
            </button>

            {/* Auto-Trader Switch */}
            <button
              id="auto-trader-toggle-btn"
              onClick={onToggleAutoTrader}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                account.autoTraderActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/50'
                  : 'bg-[#181e35] text-slate-400 border-[#222b4a] hover:text-slate-200'
              }`}
              title="Toggle Autonomous 3X Multi-Agent Paper Execution (Every 5 min after candle close)"
            >
              {account.autoTraderActive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>Auto-Trade ON (5m Sync)</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-400" />
                  <span>Auto-Trade OFF</span>
                </>
              )}
            </button>

            {/* Refresh / Re-Debate */}
            <button
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="p-2 rounded-xl bg-[#181e35] hover:bg-[#202847] border border-[#222b4a] text-slate-300 hover:text-white transition-colors"
              title="Trigger Fresh 4-Agent Live Market Scan, News Search & Debate"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#181e35] hover:bg-rose-500/20 border border-[#222b4a] hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0c1020] border-b border-[#181e35] text-xs overflow-x-auto">
          <div className="flex items-center gap-1 py-0.5">
            <button
              onClick={() => setActiveTab('consensus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'consensus'
                  ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141930]'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Council Consensus</span>
              {signal && (
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-500/30 text-amber-200 font-mono">
                  {signal.consensusConfidence}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('mtf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'mtf'
                  ? 'bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-indigo-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141930]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>MTF Confluence</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-teal-500/30 text-teal-200 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                {signal?.mtfConfirmation?.pair || 'H1 ➔ M5'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bitunix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'bitunix'
                  ? 'bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-rose-500/20 text-orange-300 border border-orange-500/50 shadow-md shadow-orange-950/40'
                  : 'bg-orange-950/30 text-orange-400 border border-orange-500/30 hover:bg-orange-900/40'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              <span>Bitunix Real Trading (Primary)</span>
              {account.bitunixConnected ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="px-1.5 py-0.2 text-[9px] rounded bg-orange-500/30 text-orange-200 font-mono font-bold">
                  LIVE GATEWAY
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'news'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141930]'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
              <span>News Agent (Delphi)</span>
              {newsSignal && (
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-cyan-500/30 text-cyan-200 font-mono">
                  {newsSignal.sentiment}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('debate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'debate'
                  ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141930]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agent Debate</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-indigo-500/30 text-indigo-200 font-mono">
                {signal?.agents?.length || 4} Council AIs
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-[#181e35] text-slate-200 border border-[#263156]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141930]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
              <span>History ({closedTrades.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'database'
                  ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141930]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>Database & Cloud</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'telegram'
                  ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141930]'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram Alerts</span>
              {account.telegramNotificationsEnabled && (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-[#181e35] text-slate-200 border border-[#263156]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141930]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Engine Config</span>
            </button>
          </div>

          {/* Quick Bitunix Live Balances Badge */}
          <div className="hidden lg:flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Gateway:</span>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ⚡ BITUNIX REAL FUTURES
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 pl-2 border-l border-[#1d2340]">
              <span>Bitunix Equity:</span>
              <span className="text-emerald-400 font-bold">
                ${(account.bitunixBalanceUsd || bitunixAccountInfo?.totalEquityUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(94vh-130px)] flex flex-col gap-4">
          
          {/* Loading Indicator */}
          {isLoading && !signal && (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-3 border-amber-400/20 border-t-amber-400 animate-spin"></div>
                <Bot className="w-7 h-7 text-amber-400 absolute animate-pulse" />
              </div>
              <div className="text-sm font-bold text-slate-200">
                Reading Price Action Master, Truth AI, AI Scalper & Dominant TF AI...
              </div>
              <div className="text-xs text-slate-400 max-w-md leading-relaxed">
                The Master Synthesis Robot is aggregating structural pivots, Truth AI macro sanity, AI Scalper orderbook imbalance, and Dominant Timeframe alignment to compute 4-Agent consensus.
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Multi-Agent Engine Notice</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                {error}
              </p>
              <button
                onClick={onRefresh}
                className="mt-1 w-fit px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-colors"
              >
                Retry Council Scan
              </button>
            </div>
          )}

          {/* TAB 1: COUNCIL CONSENSUS & BLUEPRINT */}
          {activeTab === 'consensus' && signal && (
            <>
              {/* Executive Consensus Verdict Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#11172f] via-[#141b3a] to-[#12162b] border border-[#242f56] shadow-xl flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1.5 rounded-xl font-mono font-bold text-sm flex items-center gap-1.5 shadow-md ${
                        isLong
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isShort
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-slate-700/40 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {isLong && <TrendingUp className="w-4 h-4" />}
                      {isShort && <TrendingDown className="w-4 h-4" />}
                      <span>{signal.consensusBias} CONSENSUS</span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        {signal.consensusScore}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Synthesized by Master Robot across Price Action, Truth AI, AI Scalper, and Dominant TF AI
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Council Conviction</span>
                      <span className="text-sm font-mono font-bold text-amber-400">
                        {signal.consensusConfidence}%
                      </span>
                    </div>
                    <div className="text-right pl-3 border-l border-[#242f56]">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Risk : Reward</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {signal.riskRewardRatio}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Executive Directive */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#0d1122] p-3 rounded-xl border border-[#1b223d]">
                  <strong className="text-amber-300 font-semibold">Master Synthesis Strategy: </strong>
                  {signal.executiveSummary}
                </p>
              </div>

              {/* Multi-Timeframe Institutional Confluence Confirmation Banner */}
              {signal.mtfConfirmation && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0c182c] via-[#0f213d] to-[#0b1626] border border-teal-500/30 shadow-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <Layers className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span>Institutional MTF Confluence:</span>
                          <span className="text-teal-300 font-mono px-2 py-0.5 rounded-md bg-teal-500/20 border border-teal-500/40">
                            {signal.mtfConfirmation.pair}
                          </span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                          signal.mtfConfirmation.confluenceStatus === 'FULL_CONFLUENCE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {signal.mtfConfirmation.confluenceStatus === 'FULL_CONFLUENCE' ? '100% Full Confluence' : 'High Confluence'} ({signal.mtfConfirmation.confluenceScore}%)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-x-2">
                        <span>HTF Key Level: <strong className="text-cyan-300 font-mono">${signal.mtfConfirmation.htfKeyLevel?.price.toLocaleString()}</strong> ({signal.mtfConfirmation.htfKeyLevel?.type})</span>
                        <span className="text-slate-500">•</span>
                        <span>LTF Trigger: <strong className="text-emerald-300 font-mono">${signal.mtfConfirmation.ltfTrigger?.price.toLocaleString()}</strong> ({signal.mtfConfirmation.ltfTrigger?.type})</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('mtf')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 text-xs font-semibold transition-all hover:scale-105"
                  >
                    <span>Inspect 4-Pair MTF Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* The 4 Specialized AI Agent Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {signal.agents.map((agent) => {
                  const agentIsLong = agent.vote === 'LONG';
                  const agentIsShort = agent.vote === 'SHORT';

                  return (
                    <div
                      key={agent.id}
                      className="p-3.5 rounded-2xl bg-[#0f1325] border border-[#1e2544] flex flex-col justify-between gap-2.5 transition-all hover:border-[#2b3563]"
                    >
                      <div>
                        {/* Agent Avatar & Role */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#1b213b]">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{agent.avatar}</span>
                            <div>
                              <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                                <span>{agent.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {agent.role}
                              </div>
                            </div>
                          </div>

                          {/* Agent Vote Badge */}
                          <div
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              agentIsLong
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : agentIsShort
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-700/40 text-slate-400'
                            }`}
                          >
                            {agent.vote} ({agent.confidence}%)
                          </div>
                        </div>

                        {/* Metric Highlights */}
                        <div className="mt-2 text-[10px] font-mono text-cyan-300/90 bg-[#141930] px-2 py-1 rounded-lg border border-[#1e2648]">
                          {agent.keyMetrics}
                        </div>

                        {/* Agent Rationale */}
                        <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">
                          "{agent.rationale}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#181d33] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Rec. Sizing:</span>
                        <span className="text-amber-400 font-bold">{agent.recommendedLeverage || 3}X Leverage</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trade Blueprint Numbers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Entry Price */}
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544] flex flex-col">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <Target className="w-3 h-3 text-cyan-400" />
                    Limit Entry (RTP/Golden Ratio)
                  </div>
                  <div className="text-sm font-mono font-bold text-cyan-300 mt-1">
                    ${(signal.limitEntryPrice || signal.entryPrice).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">Golden Ratio Confluence</div>
                </div>

                {/* Stop Loss */}
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544] flex flex-col">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    Stop Loss (SL)
                  </div>
                  <div className="text-sm font-mono font-bold text-rose-400 mt-1">
                    ${signal.stopLoss.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-400/80 font-mono">
                    {(((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}% Risk
                  </div>
                </div>

                {/* Take Profit 1 */}
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544] flex flex-col">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <Target className="w-3 h-3 text-emerald-400" />
                    Take Profit 1 (50%)
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                    ${signal.takeProfit1.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-mono">
                    {(((signal.takeProfit1 - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}% (+1.8R)
                  </div>
                </div>

                {/* Take Profit 2 / Liq Target */}
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544] flex flex-col">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <Flame className="w-3 h-3 text-amber-400" />
                    TP 2 (Liq Target)
                  </div>
                  <div className="text-sm font-mono font-bold text-amber-300 mt-1">
                    ${signal.takeProfit2.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-mono">
                    {(((signal.takeProfit2 - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}% (3R+)
                  </div>
                </div>
              </div>

              {/* 1-Click Institutional Execution Console */}
              <div className="p-4 rounded-2xl bg-[#0f1429] border border-[#212a4d] flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      1-Click 3X Trade Execution Console
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-slate-400 font-semibold">Leverage:</span>
                    {[10, 20, 50, 75, 100].map((lev) => (
                      <button
                        key={lev}
                        onClick={() => setSelectedLeverage(lev)}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                          selectedLeverage === lev
                            ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300'
                            : 'bg-[#161c36] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lev}X
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margin Selector & Notional Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-[#131830] p-3 rounded-xl border border-[#1d2444]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Margin Capital ($5-$10)</span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">${selectedMargin} USD</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1 mt-1">
                      {[5, 7.5, 10, 15, 25, 50].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setSelectedMargin(amt)}
                          className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                            selectedMargin === amt
                              ? 'bg-indigo-600 text-white font-bold ring-1 ring-indigo-400'
                              : 'bg-[#1a213f] text-slate-300 hover:text-white'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                      <div className="relative inline-flex items-center ml-1">
                        <span className="text-[10px] text-slate-500 mr-1">$</span>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          step="0.5"
                          value={selectedMargin}
                          onChange={(e) => setSelectedMargin(Math.max(1, parseFloat(e.target.value) || 1))}
                          className="w-14 bg-[#0d1226] border border-[#20294e] rounded px-1 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-left sm:pl-3 sm:border-l border-[#1d2444]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Notional Position Size</span>
                    <span className="text-sm font-mono font-bold text-amber-400 mt-0.5 block">
                      ${notionalSize.toLocaleString()} USD ({selectedLeverage}X)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {(notionalSize / (signal.entryPrice || 1)).toFixed(4)} {symbol.replace('USDT', '')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCopySetup}
                      className="px-3 py-2 rounded-xl bg-[#1a2140] hover:bg-[#222b52] border border-[#27325c] text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                      title="Copy full 3X Multi-Agent setup to clipboard"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleExecuteNow}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                        isLong
                          ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 hover:from-orange-400 hover:to-emerald-400 text-slate-950 shadow-orange-950/50'
                          : 'bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/50'
                      }`}
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>DISPATCH {selectedLeverage}X {signal.consensusBias} TO BITUNIX</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: MULTI-TIMEFRAME CONFLUENCE (3X MULTI-AGENT LOGIC) */}
          {activeTab === 'mtf' && signal && (
            <div className="flex flex-col gap-4">
              {/* Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0a1628] via-[#0d1e38] to-[#0a1426] border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <Layers className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">
                        Canonical Institutional Multi-Timeframe Confluence Engine
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                        <Activity className="w-2.5 h-2.5 animate-pulse text-teal-400" />
                        3X Multi-Agent Confluence
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Higher Timeframe (HTF) Key Levels validated by Lower Timeframe (LTF) Market Structure Shifts & Return-to-Pivot entry triggers.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRefresh(selectedMtfPair)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#132342] hover:bg-[#1a2f58] border border-[#203a6b] text-xs font-semibold text-teal-300 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Re-evaluate MTF</span>
                  </button>
                </div>
              </div>

              {/* 4 Canonical Institutional Pairs Switcher */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Canonical Timeframe Pairs (Select to Evaluate)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Active: <strong className="text-teal-300 font-bold">{signal.mtfConfirmation?.pair || 'H1 ➔ M5'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CANONICAL_MTF_PAIRS.map((pair) => {
                    const isPairActive = (signal.mtfConfirmation?.pair || selectedMtfPair) === pair.id || (signal.mtfConfirmation?.pair === pair.name);
                    return (
                      <button
                        key={pair.id}
                        onClick={() => handleSwitchMtfPair(pair.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 group ${
                          isPairActive
                            ? 'bg-gradient-to-br from-teal-950/60 to-[#0e1d35] border-teal-500/50 shadow-md shadow-teal-950/40'
                            : 'bg-[#0f1429] hover:bg-[#141b36] border-[#1d264a] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-mono font-bold ${isPairActive ? 'text-teal-300' : 'text-slate-300'}`}>
                            {pair.name}
                          </span>
                          {isPairActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-teal-500/30 text-teal-200 border border-teal-500/40">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                          {pair.desc}
                        </div>
                        <div className="text-[9px] text-teal-400/80 font-mono flex items-center gap-1 pt-1 border-t border-[#1a2344]">
                          <span>Trigger:</span>
                          <span className="truncate">{pair.ltf} MSS</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Flow Architecture: HTF Key Level ➔ Confluence Bridge ➔ LTF Limit Entry (RTP/Golden Ratio) */}
              {signal.mtfConfirmation && (
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-stretch">
                  
                  {/* HTF Key Level Card (Left 3 columns) */}
                  <div className="lg:col-span-3 p-4 rounded-2xl bg-[#0e152b] border border-cyan-500/30 flex flex-col justify-between gap-3 shadow-lg">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#1a2444]">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30">
                            HTF: {signal.mtfConfirmation.htfInterval || '1H'}
                          </div>
                          <span className="text-xs font-bold text-slate-200">Higher Timeframe Anchor</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          signal.mtfConfirmation.htfKeyLevel?.bias === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : signal.mtfConfirmation.htfKeyLevel?.bias === 'BEARISH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}>
                          {signal.mtfConfirmation.htfKeyLevel?.bias}
                        </span>
                      </div>

                      <div className="mt-3">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">HTF Key Level Price</span>
                        <div className="text-xl font-mono font-bold text-cyan-300 mt-0.5">
                          ${signal.mtfConfirmation.htfKeyLevel?.price.toLocaleString()}
                        </div>
                        <div className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>Type: {signal.mtfConfirmation.htfKeyLevel?.type}</span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans bg-[#0a1020] p-2.5 rounded-xl border border-[#16203d]">
                        {signal.mtfConfirmation.htfKeyLevel?.description || 'Establishes primary macro trend, orderblock boundary, and major liquidity shelf.'}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-[#17203d] flex items-center justify-between">
                      <span>Role:</span>
                      <span className="text-cyan-400">Macro Trend & S&R Invalidation</span>
                    </div>
                  </div>

                  {/* Confluence Bridge Indicator (Center 1 column) */}
                  <div className="lg:col-span-1 p-3 rounded-2xl bg-gradient-to-b from-[#0c182c] via-[#0f233f] to-[#0c182c] border border-teal-500/40 flex flex-col items-center justify-center gap-2 text-center shadow-lg">
                    <Workflow className="w-5 h-5 text-teal-400" />
                    <div className="text-base font-mono font-bold text-teal-300">
                      {signal.mtfConfirmation.confluenceScore}%
                    </div>
                    <div className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold leading-tight ${
                      signal.mtfConfirmation.confluenceStatus === 'FULL_CONFLUENCE'
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : 'bg-amber-500/30 text-amber-200'
                    }`}>
                      {signal.mtfConfirmation.confluenceStatus === 'FULL_CONFLUENCE' ? '100% Confluence' : 'Aligned'}
                    </div>
                    <div className="hidden lg:flex flex-col items-center text-teal-400/80 text-[10px] font-mono animate-pulse">
                      <span>➔</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* LTF Limit Entry (RTP/Golden Ratio) Card (Right 3 columns) */}
                  <div className="lg:col-span-3 p-4 rounded-2xl bg-[#0e152b] border border-emerald-500/30 flex flex-col justify-between gap-3 shadow-lg">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#1a2444]">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
                            LTF: {signal.mtfConfirmation.ltfInterval || '5M'}
                          </div>
                          <span className="text-xs font-bold text-slate-200">Lower Timeframe Execution</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          signal.mtfConfirmation.ltfTrigger?.bias === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : signal.mtfConfirmation.ltfTrigger?.bias === 'BEARISH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}>
                          {signal.mtfConfirmation.ltfTrigger?.bias}
                        </span>
                      </div>

                      <div className="mt-3">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">LTF Limit Entry (RTP/Golden Ratio) Price</span>
                        <div className="text-xl font-mono font-bold text-emerald-300 mt-0.5">
                          ${signal.mtfConfirmation.ltfTrigger?.price.toLocaleString()}
                        </div>
                        <div className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>Setup: {signal.mtfConfirmation.ltfTrigger?.type}</span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans bg-[#0a1020] p-2.5 rounded-xl border border-[#16203d]">
                        {signal.mtfConfirmation.ltfTrigger?.description || 'Triggers 3X entry execution upon micro structure shift and return to pivot test.'}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-[#17203d] flex items-center justify-between">
                      <span>Execution:</span>
                      <span className="text-emerald-400">Tight Invalidation (${signal.stopLoss.toLocaleString()})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Master MTF Synthesis Directive */}
              {signal.mtfConfirmation && (
                <div className="p-4 rounded-2xl bg-[#0f1429] border border-[#1e274c] flex flex-col gap-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-100">
                      Master Robot Confluence Synthesis Directive
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans bg-[#0b0f1e] p-3 rounded-xl border border-[#171f3a]">
                    <strong className="text-teal-300 font-semibold">{signal.mtfConfirmation.pair} Confluence Rationale: </strong>
                    {signal.mtfConfirmation.explanation}
                  </p>
                </div>
              )}

              {/* Canonical 4-Pair MTF Confluence Matrix Table */}
              <div className="p-4 rounded-2xl bg-[#0e1327] border border-[#1c2448] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Canonical 4-Timeframe Matrix Confluence Table
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Triad Multi-Timeframe Alignment
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1b223f] text-slate-400 font-mono text-[10px] uppercase">
                        <th className="py-2 px-3">Canonical Pair</th>
                        <th className="py-2 px-3">HTF Bias & Key Level</th>
                        <th className="py-2 px-3">LTF Bias & Trigger</th>
                        <th className="py-2 px-3 text-center">Confluence Score</th>
                        <th className="py-2 px-3 text-center">Alignment Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#171e3b] font-sans">
                      {CANONICAL_MTF_PAIRS.map((pair) => {
                        const isCurrent = (signal.mtfConfirmation?.pair || selectedMtfPair) === pair.id || (signal.mtfConfirmation?.pair === pair.name);
                        const matchItem = signal.mtfConfirmation?.matrix?.find((m) => m.pair === pair.id || m.pair === pair.name);

                        const htfBias = matchItem?.htfBias || signal.consensusBias;
                        const ltfBias = matchItem?.ltfBias || signal.consensusBias;
                        const htfPrice = matchItem?.htfPrice || signal.mtfConfirmation?.htfKeyLevel?.price || signal.entryPrice;
                        const ltfPrice = matchItem?.ltfPrice || signal.mtfConfirmation?.ltfTrigger?.price || signal.entryPrice;
                        const score = matchItem?.confluenceScore || (isCurrent ? signal.mtfConfirmation?.confluenceScore || 95 : 88);
                        const status = matchItem?.status || (isCurrent ? signal.mtfConfirmation?.confluenceStatus || 'FULL_CONFLUENCE' : 'ALIGNED');

                        return (
                          <tr
                            key={pair.id}
                            className={`transition-colors ${
                              isCurrent ? 'bg-teal-500/10' : 'hover:bg-[#121832]'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                <span className="font-mono text-teal-300">{pair.name}</span>
                                {isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{pair.desc}</div>
                            </td>

                            <td className="py-2.5 px-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  htfBias === 'BULLISH' || htfBias === 'LONG'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {htfBias}
                                </span>
                                <span className="text-slate-200 font-bold">${htfPrice.toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans">{pair.htf} Key Pivot</div>
                            </td>

                            <td className="py-2.5 px-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  ltfBias === 'BULLISH' || ltfBias === 'LONG'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {ltfBias}
                                </span>
                                <span className="text-emerald-300 font-bold">${ltfPrice.toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans">{pair.ltf} Execution</div>
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className="text-teal-300 font-bold text-sm">{score}%</span>
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                status === 'FULL_CONFLUENCE'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {status === 'FULL_CONFLUENCE' ? 'Full Confluence' : 'High Confluence'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleSwitchMtfPair(pair.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                                  isCurrent
                                    ? 'bg-teal-500 text-slate-950 font-bold'
                                    : 'bg-[#18213f] hover:bg-[#202b52] text-slate-300 border border-[#263462]'
                                }`}
                              >
                                {isCurrent ? 'Selected' : 'Select'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE GOOGLE SEARCH NEWS AGENT (AGENT DELPHI) */}
          {activeTab === 'news' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d162a] via-[#101b38] to-[#0f142b] border border-[#1e2e5c] flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                    <Newspaper className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">
                        Agent Delphi: Live Breaking News & Macro Catalyst Intelligence
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                        Google Search Live
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Real-time institutional news synthesis grounded by Google Search for {symbol.replace('USDT', '')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onRefreshNews}
                  disabled={isNewsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172346] hover:bg-[#1f2f5c] border border-[#273a70] text-xs font-semibold text-cyan-300 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isNewsLoading ? 'animate-spin' : ''}`} />
                  <span>Scan Google News</span>
                </button>
              </div>

              {newsSignal ? (
                <>
                  {/* Headline & Sentiment Meter */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 p-4 rounded-2xl bg-[#0f1429] border border-[#1d264a] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                          Breaking Catalyst Headline
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          newsSignal.sentiment === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : newsSignal.sentiment === 'BEARISH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}>
                          {newsSignal.sentiment} ({newsSignal.sentimentScore > 0 ? '+' : ''}{newsSignal.sentimentScore})
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 leading-snug">
                        {newsSignal.headline}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        {newsSignal.summary}
                      </p>
                    </div>

                    {/* Macro Context Card */}
                    <div className="p-4 rounded-2xl bg-[#0f1429] border border-[#1d264a] flex flex-col justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                          Macroeconomic Context
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {newsSignal.macroContext}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-[#1a213e] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Agent Impact:</span>
                        <span className={`font-bold ${newsSignal.impactLevel === 'HIGH' ? 'text-amber-400' : 'text-slate-300'}`}>
                          {newsSignal.impactLevel} IMPACT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Discovered Catalysts */}
                  <div className="p-4 rounded-2xl bg-[#0f1429] border border-[#1d264a] flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Key Discovered Catalysts & Search Grounding</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {newsSignal.keyCatalysts.map((cat, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[#131a33] border border-[#1e274b] text-xs text-slate-200 flex items-start gap-2">
                          <span className="text-cyan-400 font-bold font-mono">#{i + 1}</span>
                          <span>{cat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verified Google Search Citations */}
                  <div className="p-4 rounded-2xl bg-[#0f1429] border border-[#1d264a] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Google Search Verified Sources & Citations</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {newsSignal.sources?.length || 0} Sources Grounded
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {newsSignal.sources && newsSignal.sources.length > 0 ? (
                        newsSignal.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-[#131a33] hover:bg-[#192347] border border-[#1e274b] hover:border-cyan-500/40 text-xs flex flex-col justify-between gap-1 transition-all group"
                          >
                            <div className="font-semibold text-slate-200 group-hover:text-cyan-300 line-clamp-2 leading-tight">
                              {src.title}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-[#1c2445]">
                              <span className="truncate max-w-[120px]">{src.domain || 'Google News'}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-400" />
                            </div>
                          </a>
                        ))
                      ) : (
                        <div className="col-span-3 text-xs text-slate-400 py-2">
                          Grounded via Google Search live crypto feeds.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 rounded-2xl bg-[#0f1429] border border-[#1d264a] flex flex-col items-center justify-center gap-3 text-center">
                  <Search className="w-8 h-8 text-cyan-400 animate-pulse" />
                  <div className="text-sm font-bold text-slate-200">
                    Scanning Google Search for live {symbol.replace('USDT', '')} news...
                  </div>
                  <button
                    onClick={onRefreshNews}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Fetch Latest Grounded News
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE AGENT DEBATE CHAMBER */}
          {activeTab === 'debate' && signal && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-[#11162b] border border-[#1e2544] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Live 4-Agent Council Deliberation Transcript
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Price Action Master 🎯 • Truth AI ⚖️ • AI Scalper ⚡ • Dominant TF AI 🌐
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {signal.debateTranscript.map((msg, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#0e1224] border border-[#1b223d] flex flex-col gap-1.5 transition-all hover:border-[#27325c]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{msg.avatar}</span>
                        <span className="text-xs font-bold text-slate-100">{msg.agentName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#18203d] text-slate-400 font-mono">
                          {msg.agentRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans pl-6">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: BITUNIX REAL FUTURES TRADING TERMINAL */}
          {activeTab === 'bitunix' && (
            <div className="flex flex-col gap-4">
              {/* Terminal Banner & Mode Switcher */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-[#12172e] to-amber-950/30 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-inner">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">Bitunix Futures Real Trading Gateway</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        account.bitunixConnected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      }`}>
                        {account.bitunixConnected ? '🟢 API CONNECTED' : '⚡ READY TO CONNECT'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      HMAC-SHA256 authenticated server proxy for Bitunix USDT-M Perpetual Futures
                    </div>
                  </div>
                </div>

                {/* Execution Gateway Status Badge */}
                <div className="flex items-center gap-2 bg-[#0d1224] px-3 py-1.5 rounded-xl border border-orange-500/40 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-orange-300 font-mono">
                    ⚡ Bitunix Real Futures Gateway Active
                  </span>
                </div>
              </div>

              {/* Bitunix Live Balances Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Bitunix Total Equity</span>
                  <span className="text-sm font-mono font-bold text-slate-100 mt-0.5 block">
                    ${(bitunixAccountInfo?.totalEquityUsd ?? account.bitunixBalanceUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Available Margin</span>
                  <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">
                    ${(bitunixAccountInfo?.availableBalanceUsd ?? account.bitunixAvailableBalanceUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Frozen / Position Margin</span>
                  <span className="text-sm font-mono font-bold text-amber-400 mt-0.5 block">
                    ${(bitunixAccountInfo?.frozenMarginUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Unrealized PnL</span>
                    <span className={`text-sm font-mono font-bold mt-0.5 block ${
                      (bitunixAccountInfo?.unrealizedPnlUsd ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(bitunixAccountInfo?.unrealizedPnlUsd ?? 0) >= 0 ? '+' : ''}${(bitunixAccountInfo?.unrealizedPnlUsd ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (onBitunixSync) onBitunixSync(bxApiKey, bxSecretKey);
                    }}
                    disabled={isBitunixSyncing}
                    className="p-2 rounded-lg bg-[#18203c] hover:bg-[#222c54] text-slate-300 transition-colors"
                    title="Refresh Bitunix Balances & Positions"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBitunixSyncing ? 'animate-spin text-orange-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Spot Wallet Funds Detected Notice */}
              {bitunixAccountInfo?.notice && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <span className="text-base">💡</span>
                  <div>
                    <div className="font-semibold text-amber-200">Spot Wallet Balance Detected</div>
                    <div className="mt-0.5 text-slate-300 leading-relaxed">{bitunixAccountInfo.notice}</div>
                  </div>
                </div>
              )}

              {/* Bitunix API Configuration & Live Diagnostic Box */}
              <div className="p-4 rounded-2xl bg-[#0e1224] border border-[#1d2444] text-xs flex flex-col gap-3.5">
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-orange-400" />
                    <span>Bitunix API Credentials & Security Keyring</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Keys encrypted server-side & kept strictly confidential</span>
                </div>

                {/* Server Outbound Egress IP Whitelist Banner */}
                <div className="p-3 rounded-xl bg-[#121730] border border-[#1e274f] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <Globe className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-200">Server Outbound Egress IP:</span>
                        <code className="px-2 py-0.5 rounded-md bg-[#0a0d1a] border border-[#232d56] text-sky-300 font-mono font-bold text-xs">
                          {serverOutboundIp}
                        </code>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Whitelist this IP in Bitunix API Management OR choose <b>"No IP restriction"</b> (Recommended).
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(serverOutboundIp);
                      setCopiedIp(true);
                      setTimeout(() => setCopiedIp(false), 2000);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a2244] hover:bg-[#242e5c] border border-[#2c386e] text-slate-200 text-[11px] font-medium transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                    <span>{copiedIp ? 'Copied IP!' : 'Copy Server IP'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-semibold flex items-center justify-between">
                      <span>Bitunix API Key:</span>
                      <span className="text-[10px] text-slate-500">From Bitunix API Management</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. bx_api_9f38a72b1049..."
                      value={bxApiKey}
                      onChange={(e) => setBxApiKey(e.target.value)}
                      className="w-full bg-[#131830] border border-[#20294e] rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-semibold flex items-center justify-between">
                      <span>Bitunix Secret Key:</span>
                      <button
                        type="button"
                        onClick={() => setShowBxSecret(!showBxSecret)}
                        className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1"
                      >
                        {showBxSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showBxSecret ? 'Hide' : 'Show'}</span>
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type={showBxSecret ? 'text' : 'password'}
                        placeholder="e.g. 7c4d9e2a8f01b3..."
                        value={bxSecretKey}
                        onChange={(e) => setBxSecretKey(e.target.value)}
                        className="w-full bg-[#131830] border border-[#20294e] rounded-xl px-3 py-2 pr-8 text-slate-200 font-mono text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Connection, Diagnostic Dry Run Button & Save */}
                <div className="pt-2 border-t border-[#1a213e] flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        disabled={bxTesting || (!bxApiKey && !account.bitunixApiKey)}
                        onClick={async () => {
                          setBxTesting(true);
                          setBxTestResult(null);
                          try {
                            onUpdateAccountConfig({
                              bitunixApiKey: bxApiKey,
                              bitunixSecretKey: bxSecretKey,
                            });
                            const res = await marketApi.testBitunixConnection({
                              apiKey: bxApiKey || account.bitunixApiKey || '',
                              secretKey: bxSecretKey || account.bitunixSecretKey || '',
                            });
                            setBxTestResult(res);
                            if (res.connected) {
                              onUpdateAccountConfig({ bitunixConnected: true });
                              if (onBitunixSync) onBitunixSync(bxApiKey, bxSecretKey);
                            }
                          } catch (err: any) {
                            setBxTestResult({
                              success: false,
                              connected: false,
                              error: err.message || 'Connection test failed',
                            });
                          } finally {
                            setBxTesting(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Zap className={`w-3.5 h-3.5 ${bxTesting ? 'animate-spin' : ''}`} />
                        <span>{bxTesting ? 'Testing Auth...' : 'Test Connection & Ping'}</span>
                      </button>

                      {/* 50X Leverage & $5-$10 Margin Diagnostic Dry-Run Button */}
                      <button
                        disabled={bxDryRunning || (!bxApiKey && !account.bitunixApiKey)}
                        onClick={async () => {
                          setBxDryRunning(true);
                          try {
                            onUpdateAccountConfig({
                              bitunixApiKey: bxApiKey,
                              bitunixSecretKey: bxSecretKey,
                            });
                            const res = await marketApi.dryRunBitunix({
                              apiKey: bxApiKey || account.bitunixApiKey || '',
                              secretKey: bxSecretKey || account.bitunixSecretKey || '',
                              symbol,
                              leverage: selectedLeverage || 50,
                              marginUsd: selectedMargin || 5,
                              side: signal?.consensusBias === 'SHORT' ? 'SHORT' : 'LONG',
                            });
                            setBxDryRunResult(res);
                          } catch (err: any) {
                            setBxDryRunResult({
                              success: false,
                              overallStatus: 'FAILED',
                              symbol,
                              leverage: selectedLeverage || 50,
                              marginUsd: selectedMargin || 5,
                              notionalUsd: (selectedMargin || 5) * (selectedLeverage || 50),
                              calculatedQty: 0,
                              estimatedPrice: curPrice,
                              availableBalanceUsd: 0,
                              checks: [
                                {
                                  id: 'err',
                                  name: 'Diagnostic Validation Request',
                                  status: 'FAIL',
                                  message: err.message || 'Dry run request failed',
                                },
                              ],
                              simulatedPayload: {},
                              latencyMs: 0,
                              timestamp: Date.now(),
                              error: err.message,
                            });
                          } finally {
                            setBxDryRunning(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-indigo-950/40"
                      >
                        <ShieldCheck className={`w-4 h-4 ${bxDryRunning ? 'animate-spin text-indigo-300' : 'text-indigo-400'}`} />
                        <span>{bxDryRunning ? 'Running 50X Diagnostic...' : `Dry Run Check (${selectedLeverage}X / $${selectedMargin})`}</span>
                      </button>

                      <button
                        onClick={async () => {
                          setSaveCredsStatus('saving');
                          onUpdateAccountConfig({
                            bitunixApiKey: bxApiKey,
                            bitunixSecretKey: bxSecretKey,
                          });
                          if (onBitunixSync) onBitunixSync(bxApiKey, bxSecretKey);
                          setTimeout(() => setSaveCredsStatus('saved'), 500);
                          setTimeout(() => setSaveCredsStatus('idle'), 2500);
                        }}
                        disabled={saveCredsStatus !== 'idle'}
                        className="px-3.5 py-1.5 rounded-xl bg-[#18203c] hover:bg-[#202b52] border border-[#26335e] text-slate-200 font-semibold transition-colors disabled:opacity-80"
                      >
                        {saveCredsStatus === 'idle' ? 'Save Credentials' : saveCredsStatus === 'saving' ? 'Saving...' : '✅ Saved!'}
                      </button>
                    </div>

                    {bxTestResult && !bxDryRunResult && (
                      <div className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                        bxTestResult.connected
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      }`}>
                        {bxTestResult.connected ? (
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span className="font-semibold">
                          {bxTestResult.connected
                            ? `Auth OK (${bxTestResult.latencyMs}ms)`
                            : bxTestResult.error || 'Failed to authenticate'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Comprehensive Dry-Run Diagnostic Results Modal Card */}
                  {bxDryRunResult && (
                    <div className="mt-1 p-3.5 rounded-xl bg-[#121733] border border-[#222c5c] flex flex-col gap-3 font-sans">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#1c244c]">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 ${
                            bxDryRunResult.overallStatus === 'PASSED' ? 'text-emerald-400' : bxDryRunResult.overallStatus === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                          }`} />
                          <span className="font-bold text-slate-100 text-xs">
                            Bitunix Account & Order Sizing Pre-Flight Diagnostic
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider font-mono ${
                            bxDryRunResult.overallStatus === 'PASSED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : bxDryRunResult.overallStatus === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {bxDryRunResult.overallStatus === 'PASSED' ? '✓ SETTINGS VALIDATED' : bxDryRunResult.overallStatus}
                          </span>
                          <button
                            onClick={() => setBxDryRunResult(null)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Dismiss Diagnostic"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Metric summary boxes */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                        <div className="p-2 rounded-lg bg-[#0b0e20] border border-[#1b2347]">
                          <span className="text-[10px] text-slate-500 block">Symbol / Pair</span>
                          <span className="font-bold text-slate-200">{bxDryRunResult.symbol}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0b0e20] border border-[#1b2347]">
                          <span className="text-[10px] text-slate-500 block">Leverage / Margin</span>
                          <span className="font-bold text-amber-400">{bxDryRunResult.leverage}X · ${bxDryRunResult.marginUsd} USD</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0b0e20] border border-[#1b2347]">
                          <span className="text-[10px] text-slate-500 block">Calculated Notional</span>
                          <span className="font-bold text-sky-400">${bxDryRunResult.notionalUsd.toFixed(2)} USD</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0b0e20] border border-[#1b2347]">
                          <span className="text-[10px] text-slate-500 block">Contract Lot (Qty)</span>
                          <span className="font-bold text-emerald-400">{bxDryRunResult.calculatedQty} {bxDryRunResult.symbol.replace('USDT', '')}</span>
                        </div>
                      </div>

                      {/* Validation checks checklist */}
                      <div className="flex flex-col gap-1.5">
                        {bxDryRunResult.checks.map((c, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg flex items-start justify-between gap-2 text-xs ${
                              c.status === 'PASS'
                                ? 'bg-[#0e172a]/60 border border-emerald-500/20 text-slate-300'
                                : c.status === 'WARN'
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                                : 'bg-rose-500/10 border border-rose-500/30 text-rose-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {c.status === 'PASS' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              ) : c.status === 'WARN' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="font-semibold text-slate-100">{c.name}</div>
                                <div className="text-[11px] text-slate-300">{c.message}</div>
                                {c.detail && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.detail}</div>}
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              c.status === 'PASS' ? 'text-emerald-400 bg-emerald-500/10' : c.status === 'WARN' ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Simulated OpenAPI Payload Viewer Toggle */}
                      {bxDryRunResult.simulatedPayload && Object.keys(bxDryRunResult.simulatedPayload).length > 0 && (
                        <div className="pt-2 border-t border-[#1c244c]">
                          <button
                            type="button"
                            onClick={() => setShowDryRunPayload(!showDryRunPayload)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1.5 font-mono cursor-pointer"
                          >
                            <span>{showDryRunPayload ? '▼ Hide' : '▶ Inspect'} Simulated Bitunix OpenAPI Payload</span>
                            <span className="text-[10px] text-slate-500">(Zero Risk / No Real Order Placed)</span>
                          </button>
                          {showDryRunPayload && (
                            <pre className="mt-2 p-2.5 rounded-lg bg-[#080b18] border border-[#1a2140] text-[10px] font-mono text-emerald-300 overflow-x-auto">
                              {JSON.stringify(bxDryRunResult.simulatedPayload, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bitunix Live Open Futures Positions Table */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-orange-400" />
                    <span>BITUNIX REAL OPEN POSITIONS ({(bitunixPositions || []).length})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Live L2 Exchange Book Sync</span>
                </div>

                {(!bitunixPositions || bitunixPositions.length === 0) ? (
                  <div className="p-8 rounded-2xl bg-[#0e1224] border border-[#1b223d] text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Cpu className="w-8 h-8 text-slate-600" />
                    <div>No open positions on Bitunix Futures.</div>
                    <div className="text-[11px] text-slate-500">
                      Use the 3X Order Dispatcher below or enable Autonomous Auto-Trader to enter real trades on candle confirmation.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {bitunixPositions.map((pos, idx) => {
                      const isLongPos = pos.side === 'LONG' || pos.side === 'BUY';
                      const isProfit = (pos.unrealizedPnlUsd || 0) >= 0;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-[#0e1224] border border-[#1c2448] flex flex-col gap-2 font-mono text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isLongPos ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                }`}
                              >
                                {pos.side} {pos.leverage}X
                              </span>
                              <span className="font-bold text-slate-100">{pos.symbol}</span>
                              <span className="text-[10px] text-slate-500">
                                Margin: ${(pos.marginUsd || 0).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isProfit ? '+' : ''}${(pos.unrealizedPnlUsd || 0).toFixed(2)} ({(pos.unrealizedPnlPercent || 0) >= 0 ? '+' : ''}{(pos.unrealizedPnlPercent || 0).toFixed(2)}%)
                              </div>

                              <button
                                disabled={bxClosingSymbol === pos.symbol}
                                onClick={async () => {
                                  setBxClosingSymbol(pos.symbol);
                                  try {
                                    if (onBitunixClosePosition) {
                                      await onBitunixClosePosition(pos.symbol);
                                    } else {
                                      await marketApi.closeBitunixPosition({
                                        symbol: pos.symbol,
                                        apiKey: bxApiKey || account.bitunixApiKey,
                                        secretKey: bxSecretKey || account.bitunixSecretKey,
                                      });
                                    }
                                    if (onBitunixSync) onBitunixSync(bxApiKey, bxSecretKey);
                                  } catch (e: any) {
                                    alert('Flash close failed: ' + e.message);
                                  } finally {
                                    setBxClosingSymbol(null);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                              >
                                <Zap className={`w-3 h-3 ${bxClosingSymbol === pos.symbol ? 'animate-spin' : ''}`} />
                                <span>{bxClosingSymbol === pos.symbol ? 'Closing...' : '⚡ Flash Close'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#18203c] text-[11px] text-slate-400">
                            <div>Entry: <span className="text-slate-200">${(pos.entryPrice || 0).toLocaleString()}</span></div>
                            <div>Mark: <span className="text-slate-200">${(pos.markPrice || 0).toLocaleString()}</span></div>
                            <div>Size: <span className="text-slate-200">{(pos.size || 0).toLocaleString()}</span></div>
                            <div>Est. Liq: <span className="text-amber-400">${(pos.liquidationPrice || 0).toLocaleString()}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct 3X Multi-Agent Order Dispatcher to Bitunix */}
              {signal && (
                <div className="p-4 rounded-2xl bg-[#0f1429] border border-orange-500/30 flex flex-col gap-3 text-xs">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-400" />
                      <span>One-Click Real 3X Order Dispatcher: #{symbol}</span>
                    </div>
                    <span className="text-[10px] font-mono text-orange-300">
                      Council Conviction: {signal.consensusConfidence}% ({signal.consensusScore})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#141a33] border border-[#20294d] text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block">Side / Bias:</span>
                      <span className={`font-bold ${isLong ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {signal.consensusBias} ({selectedLeverage}X ISOLATED)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Limit Entry Price:</span>
                      <span className="text-slate-200 font-bold">${(signal.limitEntryPrice || signal.entryPrice).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Take Profit 1 / 2:</span>
                      <span className="text-emerald-400 font-bold">${signal.takeProfit1.toLocaleString()} / ${signal.takeProfit2.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Stop Loss:</span>
                      <span className="text-rose-400 font-bold">${signal.stopLoss.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Execution Action Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-slate-400">
                      Margin: <b className="text-white">${selectedMargin.toLocaleString()}</b> • Notional Position: <b className="text-amber-300">${notionalSize.toLocaleString()}</b>
                    </div>

                    <button
                      disabled={bxOrderExecuting}
                      onClick={async () => {
                        setBxOrderExecuting(true);
                        setBxOrderFeedback(null);
                        try {
                          if (onBitunixPlaceOrder) {
                            const res = await onBitunixPlaceOrder({
                              symbol,
                              side: signal.consensusBias === 'SHORT' ? 'SHORT' : 'LONG',
                              tradeSide: 'OPEN',
                              orderType: signal.orderType || 'LIMIT',
                              leverage: selectedLeverage,
                              marginUsd: selectedMargin,
                              price: signal.limitEntryPrice || signal.entryPrice,
                              tpPrice: signal.takeProfit1,
                              slPrice: signal.stopLoss,
                              stopLoss: signal.stopLoss,
                              takeProfit1: signal.takeProfit1,
                              takeProfit2: signal.takeProfit2,
                              apiKey: bxApiKey || account.bitunixApiKey,
                              secretKey: bxSecretKey || account.bitunixSecretKey,
                            });
                            setBxOrderFeedback({
                              success: true,
                              message: `Real order placed successfully on Bitunix! Order ID: ${res.orderId || 'SUCCESS'}`,
                              orderId: res.orderId,
                            });
                          } else {
                            const res = await marketApi.placeBitunixOrder({
                              symbol,
                              side: signal.consensusBias === 'SHORT' ? 'SHORT' : 'LONG',
                              tradeSide: 'OPEN',
                              orderType: signal.orderType || 'LIMIT',
                              leverage: selectedLeverage,
                              marginUsd: selectedMargin,
                              price: signal.limitEntryPrice || signal.entryPrice,
                              tpPrice: signal.takeProfit1,
                              slPrice: signal.stopLoss,
                              stopLoss: signal.stopLoss,
                              takeProfit1: signal.takeProfit1,
                              takeProfit2: signal.takeProfit2,
                              apiKey: bxApiKey || account.bitunixApiKey,
                              secretKey: bxSecretKey || account.bitunixSecretKey,
                            });
                            setBxOrderFeedback({
                              success: true,
                              message: `Real order placed on Bitunix! Order ID: ${res.orderId || 'SUCCESS'}`,
                              orderId: res.orderId,
                            });
                          }
                          if (onBitunixSync) onBitunixSync(bxApiKey, bxSecretKey);
                        } catch (err: any) {
                          setBxOrderFeedback({
                            success: false,
                            message: err.message || 'Failed to place real Bitunix order',
                          });
                        } finally {
                          setBxOrderExecuting(false);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-950/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Zap className={`w-4 h-4 ${bxOrderExecuting ? 'animate-spin' : ''}`} />
                      <span>{bxOrderExecuting ? 'Dispatching to Bitunix...' : `Execute Real ${selectedLeverage}X ${signal.consensusBias} on Bitunix`}</span>
                    </button>

                    <button
                      type="button"
                      disabled={bxDryRunning || (!bxApiKey && !account.bitunixApiKey)}
                      onClick={async () => {
                        setBxDryRunning(true);
                        try {
                          const res = await marketApi.dryRunBitunix({
                            apiKey: bxApiKey || account.bitunixApiKey || '',
                            secretKey: bxSecretKey || account.bitunixSecretKey || '',
                            symbol,
                            leverage: selectedLeverage || 50,
                            marginUsd: selectedMargin || 5,
                            side: signal.consensusBias === 'SHORT' ? 'SHORT' : 'LONG',
                          });
                          setBxDryRunResult(res);
                        } catch (err: any) {
                          setBxDryRunResult({
                            success: false,
                            overallStatus: 'FAILED',
                            symbol,
                            leverage: selectedLeverage || 50,
                            marginUsd: selectedMargin || 5,
                            notionalUsd: (selectedMargin || 5) * (selectedLeverage || 50),
                            calculatedQty: 0,
                            estimatedPrice: curPrice,
                            availableBalanceUsd: 0,
                            checks: [
                              {
                                id: 'err',
                                name: 'Pre-Flight Diagnostic',
                                status: 'FAIL',
                                message: err.message || 'Dry run failed',
                              },
                            ],
                            simulatedPayload: {},
                            latencyMs: 0,
                            timestamp: Date.now(),
                            error: err.message,
                          });
                        } finally {
                          setBxDryRunning(false);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className={`w-3.5 h-3.5 ${bxDryRunning ? 'animate-spin' : ''}`} />
                      <span>{bxDryRunning ? 'Validating...' : 'Pre-Flight Dry Run'}</span>
                    </button>
                  </div>

                  {bxOrderFeedback && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      bxOrderFeedback.success
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    }`}>
                      {bxOrderFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{bxOrderFeedback.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bitunix Auto-Trading Safety Guardrails */}
              <div className="p-4 rounded-2xl bg-[#0e1224] border border-[#1d2444] text-xs flex flex-col gap-3">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Bitunix Real Trading Risk Limits & Safety Protocol</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
                  <div className="p-3 rounded-xl bg-[#131830] border border-[#1f284d] flex flex-col gap-1">
                    <span className="font-bold text-amber-300">1. Isolated Margin 3X</span>
                    <p className="text-slate-400 leading-relaxed">
                      Every position is opened in isolated mode so liquidation risk is strictly capped to the allocated margin.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#131830] border border-[#1f284d] flex flex-col gap-1">
                    <span className="font-bold text-emerald-300">2. Hard Stop Loss Enforcement</span>
                    <p className="text-slate-400 leading-relaxed">
                      Stop loss is attached at order execution using the Triad Council's tight structure invalidation level.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#131830] border border-[#1f284d] flex flex-col gap-1">
                    <span className="font-bold text-sky-300">3. Telegram Execution Sync</span>
                    <p className="text-slate-400 leading-relaxed">
                      Instant order fill receipts and PnL updates are dispatched to your private Telegram channel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLOSED TRADE HISTORY */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                <span>CLOSED 3X TRADES AUDIT LOG ({closedTrades.length})</span>
                <span>PERSISTED IN CLOUD FIRESTORE</span>
              </div>

              {closedTrades.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0e1224] border border-[#1b223d] text-center text-xs text-slate-400">
                  No completed trades yet. Once positions are closed, their audit trail will be saved here and synchronized to Firebase Firestore.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {closedTrades.map((t) => {
                    const isWin = t.pnlUsd > 0;
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-[#0f1325] border border-[#1b223d] flex flex-wrap items-center justify-between gap-2 font-mono text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {t.side} {t.leverage}X
                          </span>
                          <span className="font-bold text-slate-200">{t.symbol}</span>
                          <span className="text-[10px] text-slate-500">
                            {t.closeReason.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-[11px]">
                            <span className="text-slate-400">${t.entryPrice.toLocaleString()} → ${t.exitPrice.toLocaleString()}</span>
                          </div>
                          <div className={`text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isWin ? '+' : ''}${t.pnlUsd.toFixed(2)} ({t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DATABASE & CLOUD FIRESTORE */}
          {activeTab === 'database' && (
            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-[#0e1224] border border-[#1d2444] text-xs">
              <div className="font-bold text-sm text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Firebase Firestore Cloud Database & Authentication</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Live Sync Active
                </span>
              </div>

              {/* User Authentication Card */}
              <div className="p-3.5 rounded-xl bg-[#131830] border border-[#20294e] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow">
                    {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-xs flex items-center gap-2">
                      <span>{userProfile?.displayName || 'Local Quant Trader'}</span>
                      {userProfile ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                          Google Verified
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 text-[10px]">
                          Local Session
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {userProfile?.email ? userProfile.email : 'Sign in with Google for cloud Firestore backup'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {userProfile ? (
                    <button
                      onClick={onSignOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={onSignInGoogle}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold transition-all shadow cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In with Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Firestore Collections Blueprint Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection: Users</span>
                  <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">Account & Balance</span>
                  <span className="text-[10px] text-emerald-400 font-mono">1 Active Document</span>
                </div>
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection: Positions</span>
                  <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">3X Active Margin</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
                </div>
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection: ClosedTrades</span>
                  <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">Trade Audit Log</span>
                  <span className="text-[10px] text-emerald-400 font-mono">{closedTrades.length} Synced</span>
                </div>
                <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Collection: NewsSignals</span>
                  <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">Google Search Feeds</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Real-time Grounded</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1a213e] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Data automatically persists across browser reloads and cross-device sessions.
                </span>
                <button
                  onClick={onResetAccount}
                  className="px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold transition-colors"
                >
                  Reset Account & Clear Firestore
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: TELEGRAM NOTIFICATIONS */}
          {activeTab === 'telegram' && (
            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-[#0e1224] border border-[#1d2444] text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-sm text-slate-200">
                    Telegram Signal & Auto-Trade Alert Gateway
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                      account.telegramNotificationsEnabled
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        account.telegramNotificationsEnabled ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    />
                    {account.telegramNotificationsEnabled ? 'ALERTS LIVE' : 'ALERTS DISABLED'}
                  </span>
                </div>
              </div>

              {/* Master Enable Toggle */}
              <div className="p-3.5 rounded-xl bg-[#131830] border border-[#20294e] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-xs flex items-center gap-2">
                      <span>Instant Telegram Push Notifications</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Receive real-time alerts whenever a 3X Quant Signal is generated or an Auto-Trade position is opened/closed.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const next = !account.telegramNotificationsEnabled;
                    onUpdateAccountConfig({
                      telegramNotificationsEnabled: next,
                      telegramBotToken: tgBotToken,
                      telegramChatId: tgChatId,
                    });
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    account.telegramNotificationsEnabled
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow'
                  }`}
                >
                  {account.telegramNotificationsEnabled ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Disable Notifications</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Enable Telegram Alerts</span>
                    </>
                  )}
                </button>
              </div>

              {/* Configuration Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>Telegram Bot Token:</span>
                    <span className="text-[10px] text-slate-500 font-normal">(from @BotFather)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                    value={tgBotToken}
                    onChange={(e) => setTgBotToken(e.target.value)}
                    onBlur={() => onUpdateAccountConfig({ telegramBotToken: tgBotToken })}
                    className="w-full bg-[#131830] border border-[#20294e] rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>Telegram Chat ID / Channel ID:</span>
                    <span className="text-[10px] text-slate-500 font-normal">(e.g. user ID or @channel)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 987654321 or -1001234567890"
                    value={tgChatId}
                    onChange={(e) => setTgChatId(e.target.value)}
                    onBlur={() => onUpdateAccountConfig({ telegramChatId: tgChatId })}
                    className="w-full bg-[#131830] border border-[#20294e] rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Notification Filter Mode */}
              <div className="p-3 rounded-xl bg-[#11152a] border border-[#1e2544] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-200">Alert Trigger Filter:</div>
                  <div className="text-[11px] text-slate-400">
                    Choose whether to receive every generated 3X Signal or ONLY when an Auto-Trade is executed.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateAccountConfig({ telegramAutoTradeExecutedOnly: false })}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      !account.telegramAutoTradeExecutedOnly
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-[#161c36] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Quant Signals + Auto-Trades
                  </button>
                  <button
                    onClick={() => onUpdateAccountConfig({ telegramAutoTradeExecutedOnly: true })}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      account.telegramAutoTradeExecutedOnly
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-[#161c36] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Executed Trades Only
                  </button>
                </div>
              </div>

              {/* Quick Setup Instructions & Test Button */}
              <div className="pt-2 border-t border-[#1a213e] flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span>
                    Need help? 1. Message <b>@BotFather</b> to create a bot. 2. Message your bot once or start it. 3. Enter your Token & Chat ID.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={tgSending || (!tgBotToken && !account.telegramBotToken)}
                    onClick={async () => {
                      setTgSending(true);
                      setTgResult(null);
                      try {
                        onUpdateAccountConfig({
                          telegramBotToken: tgBotToken,
                          telegramChatId: tgChatId,
                        });
                        const testMessage = `🤖 <b>3X MULTI-AGENT QUANT TERMINAL</b>
✅ <b>Telegram Alert System Connected Successfully!</b>

📡 <b>Symbol Active:</b> #${symbol}
⚡ <b>Triad Engines:</b> Price Action Master, Truth AI, AI Scalper
⚙️ <b>Auto-Trade Status:</b> ${account.autoTraderActive ? '🟢 ACTIVE' : '⏸ PAUSED'}
🎯 <b>Min Conviction Threshold:</b> ${account.autoTraderMinConfidence}%
💼 <b>Default Leverage:</b> ${account.autoTraderDefaultLeverage || 3}X

<i>You will receive real-time execution and signal alerts directly in this channel.</i>`;

                        const res = await marketApi.sendTelegramNotification({
                          botToken: tgBotToken || account.telegramBotToken,
                          chatId: tgChatId || account.telegramChatId,
                          message: testMessage,
                        });

                        setTgResult({
                          success: true,
                          message: `Test alert sent successfully (ID: ${res.messageId})!`,
                        });
                      } catch (err: any) {
                        setTgResult({
                          success: false,
                          message: err?.message || 'Failed to send test Telegram message.',
                        });
                      } finally {
                        setTgSending(false);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className={`w-3.5 h-3.5 ${tgSending ? 'animate-spin' : ''}`} />
                    <span>{tgSending ? 'Sending Test...' : 'Send Test Notification'}</span>
                  </button>
                </div>
              </div>

              {/* Test Result Message */}
              {tgResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    tgResult.success
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {tgResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{tgResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: ENGINE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-[#0e1224] border border-[#1d2444] text-xs">
              <div className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>3X Multi-Agent Autonomous Parameters</span>
              </div>

              {/* Leverage Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Default Sizing Leverage Multiplier:</label>
                <div className="flex items-center flex-wrap gap-2">
                  {[10, 20, 50, 75, 100].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => onUpdateAccountConfig({ autoTraderDefaultLeverage: lev })}
                      className={`px-3 py-1.5 rounded-xl font-mono font-bold transition-all ${
                        account.autoTraderDefaultLeverage === lev
                          ? 'bg-amber-500 text-slate-950 shadow ring-1 ring-amber-300'
                          : 'bg-[#161c36] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lev}X
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">100X is optimal for micro-margin ($5-$10) institutional high-frequency scalping.</span>
              </div>

              {/* Minimum Confidence Filter */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-[#1a213e]">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">Autonomous Auto-Trade Confidence Threshold:</label>
                  <span className="text-amber-400 font-mono font-bold">{account.autoTraderMinConfidence}%</span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="95"
                  step="1"
                  value={account.autoTraderMinConfidence}
                  onChange={(e) => onUpdateAccountConfig({ autoTraderMinConfidence: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-[#18203c] rounded-lg"
                />
                <span className="text-[11px] text-slate-500">Only executes automated trades when Council consensus reaches or exceeds this conviction.</span>
              </div>

              {/* Execution Cadence & 5-Minute Candle Close Timing */}
              <div className="flex flex-col gap-2 pt-3 border-t border-[#1a213e]">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">Autonomous Execution Cadence:</label>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ⚡ Every 5 Min (On Candle Close)
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#141a33] border border-[#20294d] text-slate-300 text-[11px] leading-relaxed flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Real-time WebSocket Candle Finalization Trigger (`k.x = true`)</span>
                  </div>
                  <div className="text-slate-400">
                    The 3X Council automatically convenes the moment each 5-minute candle closes (at :00, :05, :10, :15, :20, :25...). If the 3 AI models agree on a 100X entry with confidence ≥ {account.autoTraderMinConfidence}%, it executes immediately with zero lag.
                  </div>
                </div>
              </div>

              {/* Position Margin Sizing */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-[#1a213e]">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">Position Margin Sizing per Trade (USD):</label>
                  <span className="text-amber-400 font-mono font-bold">${account.autoTraderPositionSizeUsd || 10} USD</span>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {[5, 7.5, 10, 15, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => onUpdateAccountConfig({ autoTraderPositionSizeUsd: amt })}
                      className={`px-3 py-1.5 rounded-xl font-mono transition-all ${
                        account.autoTraderPositionSizeUsd === amt
                          ? 'bg-indigo-600 text-white font-bold ring-1 ring-indigo-400'
                          : 'bg-[#161c36] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                  <div className="relative inline-flex items-center ml-2">
                    <span className="text-xs text-slate-500 mr-1.5">$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="0.5"
                      value={account.autoTraderPositionSizeUsd || 10}
                      onChange={(e) => onUpdateAccountConfig({ autoTraderPositionSizeUsd: Math.max(1, parseFloat(e.target.value) || 1) })}
                      className="w-20 bg-[#131830] border border-[#20294e] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
