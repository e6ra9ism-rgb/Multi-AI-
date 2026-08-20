import { 
  Candle, 
  OrderBook, 
  TickerData, 
  Venue, 
  Timeframe, 
  LiquidationEvent, 
  ScalpSignal, 
  MultiAgentTradeSignal, 
  CryptoNewsSignal, 
  TruthAISignal, 
  PriceActionSignal, 
  SymbolOption, 
  DominantTimeframeAnalysis,
  BitunixAccountInfo,
  BitunixRealPosition,
  BitunixOrderResponse,
  BitunixPlaceOrderParams,
  BitunixDryRunResult
} from '../types';

export const SUPPORTED_SYMBOLS: SymbolOption[] = [
  { symbol: 'BTCUSDT', binanceSymbol: 'BTCUSDT', hyperliquidSymbol: 'BTCUSDC', baseAsset: 'BTC', quoteAsset: 'USDT', hlQuoteAsset: 'USDC', name: 'Bitcoin', hyperliquidCoin: 'BTC' },
  { symbol: 'ETHUSDT', binanceSymbol: 'ETHUSDT', hyperliquidSymbol: 'ETHUSDC', baseAsset: 'ETH', quoteAsset: 'USDT', hlQuoteAsset: 'USDC', name: 'Ethereum', hyperliquidCoin: 'ETH' },
  { symbol: 'SOLUSDT', binanceSymbol: 'SOLUSDT', hyperliquidSymbol: 'SOLUSDC', baseAsset: 'SOL', quoteAsset: 'USDT', hlQuoteAsset: 'USDC', name: 'Solana', hyperliquidCoin: 'SOL' },
  { symbol: 'DOGEUSDT', binanceSymbol: 'DOGEUSDT', hyperliquidSymbol: 'DOGEUSDC', baseAsset: 'DOGE', quoteAsset: 'USDT', hlQuoteAsset: 'USDC', name: 'Dogecoin', hyperliquidCoin: 'DOGE' },
  { symbol: 'XRPUSDT', binanceSymbol: 'XRPUSDT', hyperliquidSymbol: 'XRPUSDC', baseAsset: 'XRP', quoteAsset: 'USDT', hlQuoteAsset: 'USDC', name: 'XRP', hyperliquidCoin: 'XRP' },
  { symbol: 'BNBUSDT', binanceSymbol: 'BNBUSDT', hyperliquidSymbol: 'BNBUSDC', baseAsset: 'BNB', quoteAsset: 'USDT', hlQuoteAsset: 'USDC', name: 'BNB Chain', hyperliquidCoin: 'BNB' },
  { symbol: 'SUIUSDT', binanceSymbol: 'SUIUSDT', hyperliquidSymbol: 'SUIUSDC', baseAsset: 'SUI', quoteAsset: 'USDT', hlQuoteAsset: 'USDC', name: 'Sui Network', hyperliquidCoin: 'SUI' },
  { symbol: 'AVAXUSDT', binanceSymbol: 'AVAXUSDT', hyperliquidSymbol: 'AVAXUSDC', baseAsset: 'AVAX', quoteAsset: 'USDT', hlQuoteAsset: 'USDC', name: 'Avalanche', hyperliquidCoin: 'AVAX' },
];

/**
 * Returns the correct exchange-specific pair ticker:
 * - Binance: e.g. "BTCUSDT" (or "BTC/USDT")
 * - Hyperliquid: e.g. "BTCUSDC" (or "BTC/USDC")
 * - Aggregated: e.g. "BTC (USDT/USDC)"
 */
export function getExchangePairName(symbol: string, venue: Venue = 'binance', slash = false): string {
  const base = symbol.replace(/(USDT|USDC|PERP)$/i, '').toUpperCase();
  if (venue === 'hyperliquid') {
    return slash ? `${base}/USDC` : `${base}USDC`;
  }
  if (venue === 'binance') {
    return slash ? `${base}/USDT` : `${base}USDT`;
  }
  return slash ? `${base} (USDT + USDC)` : `${base} (USDT+USDC)`;
}

export function getBaseCoin(symbol: string): string {
  return symbol.replace(/(USDT|USDC|PERP)$/i, '').toUpperCase();
}

class MarketApiService {
  private ws: WebSocket | null = null;
  private wsCallbacks: {
    onCandle?: (candle: Candle) => void;
    onTicker?: (price: number) => void;
    onDepth?: (book: OrderBook) => void;
    onLiquidation?: (liq: LiquidationEvent) => void;
    onMultiPrices?: (prices: Record<string, number>) => void;
  } = {};

  // Fetch all live ticker prices across all futures pairs for cross-symbol portfolio PnL
  async fetchAllPrices(): Promise<Record<string, number>> {
    try {
      const res = await fetch('/api/binance/all-prices');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch all prices:', e);
    }
    return {};
  }

  // Fetch Kline / Candlestick data with fallback (up to 1500 candles for deep history)
  async fetchKlines(symbol = 'BTCUSDT', interval: Timeframe = '5m', limit = 1000, venue: Venue = 'binance'): Promise<Candle[]> {
    if (venue === 'hyperliquid') {
      return this.fetchHyperliquidKlines(symbol, interval, limit);
    }

    const binanceInterval = interval;
    const proxyUrl = `/api/binance/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;

    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Failed to load klines: ${res.statusText}`);
      const raw = await res.json();
      
      if (Array.isArray(raw) && raw.length > 0) {
        if (typeof raw[0] === 'object' && 'open' in raw[0]) {
          return raw;
        }
        return raw.map((k: any[]) => ({
          time: Number(k[0]),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
          quoteVolume: parseFloat(k[7] || (parseFloat(k[5]) * parseFloat(k[4])).toString()),
          trades: Number(k[8] || 0),
          takerBuyBaseVolume: parseFloat(k[9] || '0'),
        }));
      }
      return [];
    } catch (err) {
      console.warn('Kline proxy fetch failed:', err);
      return [];
    }
  }

  // Fetch Orderbook Depth (L2) with real volume bids & asks
  async fetchOrderBook(symbol = 'BTCUSDT', limit = 500, venue: Venue = 'binance'): Promise<OrderBook> {
    if (venue === 'hyperliquid') {
      return this.fetchHyperliquidOrderBook(symbol);
    }

    const proxyUrl = `/api/binance/depth?symbol=${symbol}&limit=${limit}`;

    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Depth fetch error: ${res.statusText}`);
      const data = await res.json();

      const bids = (data.bids || []).map((b: any) => ({
        price: Array.isArray(b) ? parseFloat(b[0]) : parseFloat(b.price || '0'),
        size: Array.isArray(b) ? parseFloat(b[1]) : parseFloat(b.size || '0'),
      })).filter((b: any) => b.price > 0 && b.size > 0);

      const asks = (data.asks || []).map((a: any) => ({
        price: Array.isArray(a) ? parseFloat(a[0]) : parseFloat(a.price || '0'),
        size: Array.isArray(a) ? parseFloat(a[1]) : parseFloat(a.size || '0'),
      })).filter((a: any) => a.price > 0 && a.size > 0);

      return {
        bids,
        asks,
        lastUpdateId: data.lastUpdateId,
        timestamp: Date.now(),
      };
    } catch (err) {
      console.warn('Orderbook fetch error:', err);
      return { bids: [], asks: [] };
    }
  }

  // Fetch 24hr Ticker, Open Interest, Funding Rate
  async fetchTicker(symbol = 'BTCUSDT', venue: Venue = 'binance'): Promise<TickerData> {
    try {
      const proxyUrl = `/api/binance/ticker?symbol=${symbol}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Ticker error: ${res.statusText}`);
      const data = await res.json();

      return {
        symbol,
        lastPrice: parseFloat(data.lastPrice || '0'),
        priceChange: parseFloat(data.priceChange || '0'),
        priceChangePercent: parseFloat(data.priceChangePercent || '0'),
        high24h: parseFloat(data.high24h || data.highPrice || '0'),
        low24h: parseFloat(data.low24h || data.lowPrice || '0'),
        volume24h: parseFloat(data.volume24h || data.volume || '0'),
        quoteVolume24h: parseFloat(data.quoteVolume24h || data.quoteVolume || '0'),
        openInterestUsd: parseFloat(data.openInterestUsd || '0'),
        fundingRate: parseFloat(data.fundingRate || '0.0001'),
        nextFundingTime: Number(data.nextFundingTime || Date.now() + 28800000),
        markPrice: parseFloat(data.markPrice || data.lastPrice || '0'),
      };
    } catch (err) {
      console.warn('Ticker fetch error:', err);
      return {
        symbol,
        lastPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        quoteVolume24h: 0,
        openInterestUsd: 0,
        fundingRate: 0.0001,
        nextFundingTime: Date.now() + 28800000,
        markPrice: 0,
      };
    }
  }

  // Hyperliquid DEX APIs
  async fetchHyperliquidKlines(symbol: string, interval: Timeframe, limit = 1000): Promise<Candle[]> {
    const coin = getBaseCoin(symbol);
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '3m': '5m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '2h': '2h',
      '4h': '4h',
      '8h': '8h',
      '12h': '12h',
      '1d': '1d',
      '1w': '1w',
    };
    const hlInterval = intervalMap[interval] || '5m';
    const startTime = Date.now() - limit * (this.getIntervalMs(interval));

    try {
      const body = {
        type: 'candleSnapshot',
        req: {
          coin,
          interval: hlInterval,
          startTime,
        },
      };

      const res = await fetch('/api/hyperliquid/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((c: any) => ({
            time: Number(c.t),
            open: parseFloat(c.o),
            high: parseFloat(c.h),
            low: parseFloat(c.l),
            close: parseFloat(c.c),
            volume: parseFloat(c.v),
            quoteVolume: parseFloat(c.v) * parseFloat(c.c),
            trades: Number(c.n || 0),
          }));
        }
      }
    } catch (e) {
      console.warn('Hyperliquid kline proxy error:', e);
    }
    // Fallback to Binance klines if Hyperliquid coin not found
    return this.fetchKlines(symbol, interval, limit, 'binance');
  }

  async fetchHyperliquidOrderBook(symbol: string): Promise<OrderBook> {
    const coin = getBaseCoin(symbol);
    try {
      const body = { type: 'l2Book', coin };
      const res = await fetch('/api/hyperliquid/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const levels = data.levels || [[], []];
        const bids = (levels[0] || []).map((l: any) => ({
          price: parseFloat(l.px),
          size: parseFloat(l.sz),
        }));
        const asks = (levels[1] || []).map((l: any) => ({
          price: parseFloat(l.px),
          size: parseFloat(l.sz),
        }));

        return {
          bids,
          asks,
          timestamp: data.time || Date.now(),
        };
      }
    } catch (e) {
      console.warn('Hyperliquid book error, fallback to Binance:', e);
    }
    return this.fetchOrderBook(symbol, 500, 'binance');
  }

  // Subscribe to real-time WebSockets
  subscribeWebSocket(
    symbol: string,
    interval: Timeframe,
    callbacks: {
      onCandle?: (candle: Candle) => void;
      onTicker?: (price: number) => void;
      onDepth?: (book: OrderBook) => void;
      onLiquidation?: (liq: LiquidationEvent) => void;
      onMultiPrices?: (prices: Record<string, number>) => void;
    }
  ) {
    this.unsubscribeWebSocket();
    this.wsCallbacks = callbacks;

    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;

    // Normalize symbol for Binance WebSocket (always USDT-denominated stream)
    const baseCoin = getBaseCoin(symbol);
    const binanceStreamSymbol = `${baseCoin.toLowerCase()}usdt`;
    // Include the active symbol kline, ticker, and forceOrder streams plus the global miniTicker array for cross-asset live prices
    const streamName = `${binanceStreamSymbol}@kline_${interval}/${binanceStreamSymbol}@ticker/${binanceStreamSymbol}@forceOrder/!miniTicker@arr`;
    const wsUrl = `wss://fstream.binance.com/stream?streams=${streamName}`;

    try {
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        // Connected to Binance Live Stream
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { stream, data } = message;

          if (stream?.includes('!miniTicker@arr') || Array.isArray(data)) {
            const priceMap: Record<string, number> = {};
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
              if (item.s && item.c) {
                priceMap[item.s.toUpperCase()] = parseFloat(item.c);
              }
            }
            if (Object.keys(priceMap).length > 0) {
              this.wsCallbacks.onMultiPrices?.(priceMap);
            }
          } else if (stream?.includes('@kline')) {
            const k = data.k;
            const candle: Candle = {
              time: k.t,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v),
              quoteVolume: parseFloat(k.q),
              trades: k.n,
              takerBuyBaseVolume: parseFloat(k.V),
              isClosed: Boolean(k.x),
            };
            this.wsCallbacks.onCandle?.(candle);
          } else if (stream?.includes('@ticker')) {
            const price = parseFloat(data.c);
            const sym = (data.s || symbol).toUpperCase();
            this.wsCallbacks.onTicker?.(price);
            this.wsCallbacks.onMultiPrices?.({ [sym]: price });
          } else if (stream?.includes('@forceOrder')) {
            const o = data.o;
            const liq: LiquidationEvent = {
              id: `${data.E}_${o.p}`,
              time: data.E,
              symbol: o.s,
              side: o.S, // SELL for long liq, BUY for short liq
              price: parseFloat(o.p),
              quantity: parseFloat(o.q),
              volumeUsd: parseFloat(o.p) * parseFloat(o.q),
              leverage: 50, // default estimation
            };
            this.wsCallbacks.onLiquidation?.(liq);
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      socket.onerror = () => {
        // Quietly failover to HTTP polling
      };

      socket.onclose = () => {
        // Closed safely
      };
    } catch (err) {
      // Fallback to HTTP polling
    }
  }

  unsubscribeWebSocket() {
    if (this.ws) {
      const currentWs = this.ws;
      this.ws = null;
      currentWs.onmessage = null;
      currentWs.onerror = null;
      currentWs.onclose = null;
      try {
        if (currentWs.readyState === WebSocket.OPEN) {
          currentWs.close();
        } else if (currentWs.readyState === WebSocket.CONNECTING) {
          currentWs.onopen = () => {
            try { currentWs.close(); } catch (e) {}
          };
          try { currentWs.close(); } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    }
    this.wsCallbacks = {};
  }

  getIntervalMs(interval: Timeframe): number {
    const map: Record<Timeframe, number> = {
      '1m': 60 * 1000,
      '3m': 3 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    return map[interval] || 5 * 60 * 1000;
  }

  // Fetch Consolidated Dual-Exchange Ticker (Binance CEX + Hyperliquid DEX)
  async fetchDualTicker(symbol = 'BTCUSDT'): Promise<any> {
    try {
      const res = await fetch(`/api/market/dual-ticker?symbol=${symbol}`);
      if (!res.ok) throw new Error(`Dual ticker fetch error: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn('Dual ticker fetch error:', err);
      return null;
    }
  }

  // Fetch Consolidated Dual-Exchange Depth (Binance + Hyperliquid + Combined Aggregated)
  async fetchDualOrderBook(symbol = 'BTCUSDT'): Promise<any> {
    try {
      const res = await fetch(`/api/market/dual-depth?symbol=${symbol}`);
      if (!res.ok) throw new Error(`Dual depth fetch error: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn('Dual depth fetch error:', err);
      return null;
    }
  }

  // Request real-time Gemini 3.7 Flash AI Scalping Setup with Dual-Exchange Microstructure
  async fetchScalpSignal(params: {
    symbol: string;
    lastPrice: number;
    fundingRate: number;
    openInterestUsd: number;
    priceChange24h: number;
    interval: Timeframe;
    recentCandles: Candle[];
    orderBookImbalance: number;
    topLiquidationClusters: { price: number; side: string; volumeUsd: number; intensity: number }[];
    binanceData?: any;
    hyperliquidData?: any;
    crossExchangeSpread?: number;
  }): Promise<ScalpSignal> {
    const res = await fetch('/api/ai/scalp-signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.message || err.error || 'Failed to generate scalp signal');
    }

    return await res.json();
  }

  // Request Real-time Crypto News & Sentiment with Google Search Grounding
  async fetchCryptoNews(symbol: string, lastPrice?: number): Promise<CryptoNewsSignal> {
    const res = await fetch('/api/ai/crypto-news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, lastPrice }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.message || err.error || 'Failed to fetch crypto news');
    }

    return await res.json();
  }

  // Request institutional 3X Multi-Agent Quant Council Consensus & Live Debate (synthesizing Price Action, Truth AI, AI Scalper & MTF Confirmation)
  async fetchMultiAgentSignal(params: {
    symbol: string;
    lastPrice: number;
    fundingRate: number;
    openInterestUsd: number;
    priceChange24h: number;
    interval: Timeframe;
    recentCandles: Candle[];
    htfInterval?: Timeframe | string;
    htfCandles?: Candle[];
    selectedMtfPair?: string;
    orderBookImbalance: number;
    topLiquidationClusters: { price: number; side: string; volumeUsd: number; intensity: number }[];
    binanceData?: any;
    hyperliquidData?: any;
    crossExchangeSpread?: number;
    defaultLeverage?: number;
    newsContext?: CryptoNewsSignal | null;
    priceActionSignal?: PriceActionSignal | null;
    truthSignal?: TruthAISignal | null;
    scalpSignal?: ScalpSignal | null;
    dominantTfData?: DominantTimeframeAnalysis | null;
    fibonacciLevels?: { swingHigh: number; swingLow: number; fib0_382: number; fib0_500: number; fib0_618: number } | null;
  }): Promise<MultiAgentTradeSignal> {
    const safeSelectedMtfPair = typeof params.selectedMtfPair === 'string' && params.selectedMtfPair.trim().length > 0
      ? params.selectedMtfPair.trim()
      : 'H1_M5';

    const safeParams = {
      ...params,
      selectedMtfPair: safeSelectedMtfPair,
    };

    const res = await fetch('/api/ai/multi-agent-trade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(safeParams),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.message || err.error || 'Failed to generate multi-agent consensus trade');
    }

    return await res.json();
  }

  // Request Truth AI Reality Anchor & Bear Market Regime Analysis
  async fetchTruthAISignal(params: {
    symbol: string;
    lastPrice: number;
    fundingRate: number;
    openInterestUsd: number;
    priceChange24h: number;
    interval: Timeframe;
    recentCandles: Candle[];
    orderBookImbalance: number;
    topLiquidationClusters: { price: number; side: string; volumeUsd: number; intensity: number }[];
    binanceData?: any;
    hyperliquidData?: any;
    crossExchangeSpread?: number;
    coinName?: string;
    newsContext?: CryptoNewsSignal | null;
  }): Promise<TruthAISignal> {
    const res = await fetch('/api/ai/truth-signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.message || err.error || 'Failed to generate Truth AI reality directive');
    }

    return await res.json();
  }

  // Request Price Action Master & Return to Pivot Analysis
  async fetchPriceActionSignal(params: {
    symbol: string;
    lastPrice: number;
    fundingRate: number;
    openInterestUsd: number;
    priceChange24h: number;
    interval: Timeframe;
    recentCandles: Candle[];
    orderBookImbalance: number;
    topLiquidationClusters: { price: number; side: string; volumeUsd: number; intensity: number }[];
    binanceData?: any;
    hyperliquidData?: any;
    crossExchangeSpread?: number;
    coinName?: string;
  }): Promise<PriceActionSignal> {
    const res = await fetch('/api/ai/price-action-signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.message || err.error || 'Failed to generate Price Action Master analysis');
    }

    return await res.json();
  }

  // Request Dominant Reaction Timeframe & MTF Alignment Analysis
  async fetchDominantTimeframeAnalysis(params: {
    symbol: string;
    lastPrice: number;
    openInterestUsd: number;
    priceChange24h: number;
    recentCandles: Candle[];
    orderBookImbalance: number;
    topLiquidationClusters: { price: number; side: string; volumeUsd: number; intensity: number }[];
    binanceData?: any;
    hyperliquidData?: any;
    crossExchangeSpread?: number;
    activeInterval?: string;
  }): Promise<DominantTimeframeAnalysis> {
    const res = await fetch('/api/market/dominant-timeframe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.message || err.error || 'Failed to calculate dominant timeframe analysis');
    }

    return await res.json();
  }

  // Send Telegram Notification for Signals & Auto-Trade Executions
  async sendTelegramNotification(params: {
    botToken?: string;
    chatId?: string;
    message: string;
  }): Promise<{ success: boolean; messageId?: number }> {
    const res = await fetch('/api/notifications/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || 'Failed to send Telegram alert');
    }

    return await res.json();
  }

  // ==========================================
  // BITUNIX FUTURES REAL TRADING API METHODS
  // ==========================================

  // Fetch Bitunix Account & Balance
  async fetchBitunixAccount(credentials?: { apiKey?: string; secretKey?: string }): Promise<{
    success: boolean;
    connected: boolean;
    data?: BitunixAccountInfo;
    error?: string;
    code?: number | string;
  }> {
    const res = await fetch('/api/bitunix/account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials || {}),
    });

    return await res.json();
  }

  // Fetch Bitunix Open Positions
  async fetchBitunixPositions(params?: {
    apiKey?: string;
    secretKey?: string;
    symbol?: string;
  }): Promise<{
    success: boolean;
    positions: BitunixRealPosition[];
    count?: number;
    error?: string;
  }> {
    const res = await fetch('/api/bitunix/positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params || {}),
    });

    return await res.json();
  }

  // Place Real Order on Bitunix Futures Exchange
  async placeBitunixOrder(params: BitunixPlaceOrderParams): Promise<BitunixOrderResponse> {
    const res = await fetch('/api/bitunix/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok && !data.message && !data.error) {
      throw new Error(`Order placement failed: HTTP ${res.status}`);
    }

    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  // Flash Close / Close All Positions for Symbol on Bitunix
  async closeBitunixPosition(params: {
    symbol: string;
    apiKey?: string;
    secretKey?: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/bitunix/close-position', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return await res.json();
  }

  // Test Bitunix Connection & Validate API / Secret Keys
  async testBitunixConnection(credentials: {
    apiKey: string;
    secretKey: string;
  }): Promise<{
    success: boolean;
    connected: boolean;
    latencyMs: number;
    message?: string;
    error?: string;
    hint?: string;
    tradingPermissions?: string;
    accountData?: any;
  }> {
    const res = await fetch('/api/bitunix/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    return await res.json();
  }

  // Bitunix 50X Leverage & $5-$10 Margin Diagnostic Dry-Run Validator
  async dryRunBitunix(params: {
    apiKey?: string;
    secretKey?: string;
    symbol?: string;
    leverage?: number;
    marginUsd?: number;
    side?: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  }): Promise<BitunixDryRunResult> {
    const res = await fetch('/api/bitunix/dry-run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return await res.json();
  }
}

export const marketApi = new MarketApiService();
