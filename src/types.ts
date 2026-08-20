export type Venue = 'binance' | 'hyperliquid' | 'aggregated';

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | '12h' | '1d' | '1w';

export type LeverageFilter = 'all' | '100x' | '50x' | '25x' | '10x';

export type ColorPreset = 'coinglass' | 'cyberpunk' | 'magma' | 'inferno' | 'viridis';

export interface Candle {
  time: number; // unix timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  trades?: number;
  takerBuyBaseVolume?: number;
  isClosed?: boolean; // Whether the kline candle has finalized/closed (k.x from WebSocket)
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total?: number;
  venue?: 'binance' | 'hyperliquid' | 'aggregated';
  binanceSize?: number;
  hlSize?: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId?: number;
  timestamp?: number;
  venue?: Venue;
}

export interface DualExchangeTicker {
  symbol: string;
  binance: TickerData;
  hyperliquid: TickerData;
  spreadUsd: number;
  spreadPercent: number;
  fundingDelta: number;
  aggregatedOI: number;
  aggregatedVol: number;
  timestamp: number;
}

export interface DualExchangeDepth {
  symbol: string;
  binance: OrderBook;
  hyperliquid: OrderBook;
  aggregated: OrderBook;
  timestamp: number;
}

export interface LiquidationPoint {
  price: number;
  volumeUsd: number;
  side: 'long' | 'short';
  leverage: number;
  openTime: number;
  clearedTime: number | null; // null if still active
}

export interface HeatmapCell {
  priceIndex: number;
  price: number;
  timeIndex: number;
  time: number;
  intensity: number; // 0 to 1 normalized
  volumeUsd: number;
  leverageBreakdown: {
    '100x': number;
    '50x': number;
    '25x': number;
    '10x': number;
  };
  swept: boolean;
}

export interface HeatmapData {
  priceStep: number;
  minPrice: number;
  maxPrice: number;
  priceLevels: number[];
  matrix: Float32Array; // 2D flattened: timeSteps x priceSteps
  timeSteps: number;
  priceSteps: number;
  startTime: number;
  endTime: number;
  maxIntensity: number;
  cumulativeDepthByPrice: { 
    price: number; 
    bidVolume: number; 
    askVolume: number; 
    liqVolume: number;
    clusterAgeMinutes?: number;
    phantomLiquidityRisk?: string;
  }[];
}

export interface TickerData {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  openInterestUsd?: number;
  fundingRate?: number;
  nextFundingTime?: number;
  markPrice?: number;
}

export interface LiquidationEvent {
  id: string;
  time: number;
  symbol: string;
  side: 'BUY' | 'SELL'; // Buy = Short Liquidated, Sell = Long Liquidated
  price: number;
  quantity: number;
  volumeUsd: number;
  leverage: number;
}

export interface SymbolOption {
  symbol: string;
  binanceSymbol: string;
  hyperliquidSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  hlQuoteAsset: string;
  name: string;
  hyperliquidCoin?: string;
}

export interface ScalpSignal {
  bias: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0 to 100
  setupType: string;
  entryPrice: number;
  entryZone: string;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: string;
  timeframeHorizon: string;
  keyCatalyst: string;
  liquidationTarget: number;
  reasoning: string;
  timestamp: number;
  modelUsed?: string;
}

export interface AgentOpinion {
  id: string;
  name: string;
  role: string;
  avatar: string;
  vote: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  keyMetrics: string;
  rationale: string;
  recommendedLeverage: number;
}

export interface DebateMessage {
  agentId: string;
  agentName: string;
  agentRole: string;
  avatar: string;
  message: string;
  timestamp: number;
}

export interface NewsSourceItem {
  title: string;
  url: string;
  source?: string;
}

export interface CryptoNewsSignal {
  id: string;
  symbol: string;
  headline: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number; // -100 to +100
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  keyCatalysts: string[];
  macroContext: string;
  sources: NewsSourceItem[];
  searchQueries: string[];
  timestamp: number;
  modelUsed?: string;
}

export interface UserAuthProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface MTFConfirmationPair {
  id: string; // 'D_H1' | 'H4_M15' | 'H1_M5' | 'M15_M1'
  htf: '1d' | '4h' | '1h' | '15m';
  ltf: '1h' | '15m' | '5m' | '1m';
  htfLabel: string; // "D" | "H4" | "H1" | "M15"
  ltfLabel: string; // "H1" | "M15" | "M5" | "M1"
  displayName: string; // "D ➔ H1" | "H4 ➔ M15" | "H1 ➔ M5" | "M15 ➔ M1"
  description: string;
}

export interface MTFKeyLevel {
  price: number;
  levelType: 'MAJOR_PIVOT' | 'DAILY_OPEN' | 'S1_DEMAND' | 'R1_SUPPLY' | 'RANGE_EQUILIBRIUM' | 'ORDERBLOCK_ZONE';
  name: string;
  description: string;
}

export interface MTFTrigger {
  price: number;
  triggerType: 'MSS_BREAKOUT' | 'RETURN_TO_PIVOT' | 'LIQUIDITY_SWEEP' | 'PULLBACK_RETEST' | 'MOMENTUM_EXPANSION';
  name: string;
  description: string;
}

export interface MTFMatrixItem {
  pairId: string; // 'D_H1' | 'H4_M15' | 'H1_M5' | 'M15_M1'
  htfLabel: string; // 'D' | 'H4' | 'H1' | 'M15'
  ltfLabel: string; // 'H1' | 'M15' | 'M5' | 'M1'
  htfBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ltfBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  htfKeyLevelPrice: number;
  ltfTriggerPrice: number;
  confluenceStatus: 'FULL_CONFLUENCE' | 'PARTIAL_CONFLUENCE' | 'COUNTER_TREND_DIVERGENCE';
  confluenceScore: number;
  summary: string;
}

export interface MTFAnalysis {
  pair: string; // "D ➔ H1" | "H4 ➔ M15" | "H1 ➔ M5" | "M15 ➔ M1"
  htfTimeframe: '1d' | '4h' | '1h' | '15m';
  ltfTimeframe: '1h' | '15m' | '5m' | '1m';
  htfBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ltfBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  htfKeyLevel: MTFKeyLevel;
  ltfTrigger: MTFTrigger;
  confluenceStatus: 'FULL_CONFLUENCE' | 'PARTIAL_CONFLUENCE' | 'COUNTER_TREND_DIVERGENCE';
  confluenceScore: number; // 0 to 100
  confluenceVerdict: string;
  matrix?: MTFMatrixItem[];
  htfCandlesSummary?: string;
  ltfCandlesSummary?: string;
}

export interface MultiAgentTradeSignal {
  id: string;
  symbol: string;
  timestamp: number;
  consensusBias: 'LONG' | 'SHORT' | 'NEUTRAL';
  orderType?: 'MARKET' | 'LIMIT';
  limitEntryPrice?: number;
  consensusConfidence: number; // 0 to 100
  recommendedLeverage: number; // default 3
  consensusScore: string; // e.g. "4/4 Unanimous Bullish" or "3/4 Split Decision"
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: string;
  liquidationTargetPrice: number;
  maxExpectedDrawdownPercent: number;
  agents: AgentOpinion[];
  debateTranscript: DebateMessage[];
  executiveSummary: string;
  newsContext?: CryptoNewsSignal;
  mtfConfirmation?: MTFAnalysis;
  dominantTfContext?: DominantTimeframeAnalysis;
  modelUsed?: string;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  leverage: number; // 3x default
  sizeUsd: number;
  marginUsd: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  liquidationPrice: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  openTime: number;
  agentConsensus: string;
  confidence: number;
  tp1Triggered?: boolean;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  sizeUsd: number;
  marginUsd: number;
  pnlUsd: number;
  pnlPercent: number;
  openTime: number;
  closeTime: number;
  closeReason: 'TAKE_PROFIT_1' | 'TAKE_PROFIT_2' | 'STOP_LOSS' | 'MANUAL' | 'LIQUIDATION';
  agentConsensus: string;
}

export interface TruthAISignal {
  bias: 'LONG' | 'SHORT' | 'NEUTRAL' | 'CASH_WAIT';
  confidence: number; // 0 to 100
  marketRegime: 'BEAR_MARKET_DISTRIBUTION' | 'BEAR_MARKET_RALLY_TRAP' | 'RANGE_BOUND_CHOP' | 'ACCUMULATION_BOTTOM' | 'BULL_MARKET_EXPANSION';
  realistScore: number; // 0 to 100 (Unbiased reality conviction)
  macroCycleAssessment: string;
  bearTrapWarning: string;
  bullishDelusionCheck: string;
  orderbookTruth: {
    realSpotSupport: number;
    overheadSupplyWall: number;
    fakeBidDepthWarning: string;
  };
  recommendedAction: string;
  invalidationTriggerPrice: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: string;
  rationalVerdict: string;
  timestamp: number;
  modelUsed?: string;
}

export interface PivotPoints {
  centralPivot: number; // P = (H + L + C) / 3
  r1: number; // 2P - L
  r2: number; // P + (H - L)
  r3: number; // H + 2(P - L)
  s1: number; // 2P - H
  s2: number; // P - (H - L)
  s3: number; // L - 2(H - P)
  dailyOpen: number;
  dailyHigh: number;
  dailyLow: number;
  dailyClose: number;
  equilibrium50: number; // (H + L) / 2
}

export interface PriceActionSignal {
  symbol: string;
  bias: 'LONG' | 'SHORT' | 'WAIT_FOR_PIVOT_RETEST';
  confidence: number; // 70-99
  setupName: string; // e.g. "Return to Pivot (RTP) Mean Reversion", "S1 Demand Spring", "R1 Rejection Sweep"
  marketStructure: 'BULLISH_MSS' | 'BEARISH_MSS' | 'RANGE_EXPANSION' | 'PIVOT_MEAN_REVERSION' | 'COMPRESSION';
  candlestickPattern: string; // e.g. "Pin Bar Rejection on Central Pivot", "Bullish Engulfing off S1"
  pivotLevels: PivotPoints;
  pivotDistancePercent: number; // % distance from current price to Central Pivot
  returnToPivotStatus: 'AT_RTP_NODE' | 'APPROACHING_RTP' | 'FLOATING_NODE_ENGULFMENT' | 'RTP_BREAKOUT';
  entryPrice: number;
  entryZone: string;
  stopLoss: number;
  takeProfit1: number; // Primary Pivot Target (e.g. Central P or R1)
  takeProfit2: number; // Secondary Pivot Target (e.g. R2 or S2)
  takeProfit3: number; // Structural Extension
  riskRewardRatio: string;
  actionPlan: string; // Actionable execution steps
  proAnalysis: string; // Deep price action breakdown
  timestamp: number;
  modelUsed?: string;
}

export interface TimeframeReactionScore {
  timeframe: '1w' | '1d' | '4h' | '1h' | '15m' | '5m' | '1m';
  label: string; // '1W', '1D', '4H', '1H', '15m', '5m', '1m'
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reactionScore: number; // 0 - 100
  isDominant: boolean;
  status: 'CONTROLLING_FLOW' | 'ACTIVE_REACTION' | 'SECONDARY_PULLBACK' | 'SUBORDINATE_NOISE';
  liquidityPoolVolumeUsd: number; // e.g. $45,000,000
  displacementPercent: number; // e.g. 2.4%
  openInterestImpact: 'MASSIVE_LIQUIDATION_FLUSH' | 'NEW_POSITIONS_BUILDUP' | 'STABLE_OI' | 'CHOP_DISTRIBUTION';
  structureStatus: 'MSS_CONFIRMED' | 'KEY_LEVEL_SWEEP' | 'RANGE_ROTATION' | 'SUBORDINATE_NOISE';
  actionableVerdict: string;
}

export interface DominantTimeframeAnalysis {
  dominantTimeframe: '1w' | '1d' | '4h' | '1h' | '15m' | '5m' | '1m';
  dominantLabel: string; // e.g. '4H' or '1D'
  dominantBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  dominantConfidence: number; // 0 - 100
  dominantReasoning: string;
  triggerTimeframe: '4h' | '1h' | '15m' | '5m' | '1m';
  triggerLabel: string; // e.g. '15M'
  triggerCondition: string;
  overallAlignmentScore: number; // 0 - 100%
  noiseWarning: string | null;
  tradingRule: string;
  timeframes: TimeframeReactionScore[];
  timestamp: number;
  modelUsed?: string;
}

export interface TraderAccount {
  balanceUsd: number;
  initialBalanceUsd: number;
  equityUsd: number;
  totalRealizedPnlUsd: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  autoTraderActive: boolean;
  autoTraderMinConfidence: number;
  autoTraderDefaultLeverage: number; // default 3
  autoTraderPositionSizeUsd: number;
  autoTraderIntervalMinutes?: number; // default 5 (runs every 5m candle close)
  lastProcessedCandleTime?: number; // timestamp of last closed 5m candle evaluated
  // Telegram Signal & Auto-Trade Notifications
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
  telegramAutoTradeExecutedOnly?: boolean;
  // Bitunix Real Exchange Live Trading
  executionMode?: 'PAPER' | 'BITUNIX_REAL';
  bitunixApiKey?: string;
  bitunixSecretKey?: string;
  bitunixConnected?: boolean;
  bitunixBalanceUsd?: number;
  bitunixAvailableBalanceUsd?: number;
  bitunixAutoTradeEnabled?: boolean;
  bitunixLastSyncTime?: number;
}

export interface BitunixAccountInfo {
  totalEquityUsd: number;
  availableBalanceUsd: number;
  frozenMarginUsd: number;
  unrealizedPnlUsd: number;
  walletBalanceUsd?: number;
  spotBalanceUsd?: number;
  spotAvailableUsd?: number;
  hasSpotFundsOnly?: boolean;
  marginRate: number;
  positionsCount: number;
  timestamp: number;
  notice?: string;
}

export interface BitunixRealPosition {
  positionId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  marginUsd: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  liquidationPrice: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  openTime: number;
}

export interface BitunixOrderResponse {
  success: boolean;
  orderId?: string;
  clientOrderId?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  price?: number;
  qty: number;
  notionalUsd: number;
  leverage: number;
  fillPrice?: number;
  status: 'FILLED' | 'NEW' | 'PARTIALLY_FILLED' | 'REJECTED' | 'CANCELED';
  message?: string;
  timestamp: number;
}

export interface BitunixPlaceOrderParams {
  symbol: string;
  side: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  tradeSide?: 'OPEN' | 'CLOSE';
  orderType?: 'MARKET' | 'LIMIT';
  price?: number;
  qty?: number;
  marginUsd?: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  tpPrice?: number;
  slPrice?: number;
  effect?: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
  reduceOnly?: boolean;
  apiKey?: string;
  secretKey?: string;
}

export interface BitunixDryRunCheck {
  id: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  detail?: string;
}

export interface BitunixDryRunResult {
  success: boolean;
  overallStatus: 'PASSED' | 'WARNING' | 'FAILED';
  symbol: string;
  leverage: number;
  marginUsd: number;
  notionalUsd: number;
  calculatedQty: number;
  estimatedPrice: number;
  availableBalanceUsd: number;
  checks: BitunixDryRunCheck[];
  simulatedPayload: Record<string, any>;
  latencyMs: number;
  timestamp: number;
  error?: string;
}
