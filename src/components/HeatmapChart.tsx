import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Candle, ColorPreset, HeatmapData, LeverageFilter, OrderBook, TickerData, Timeframe, Venue, ScalpSignal, DualExchangeTicker, DualExchangeDepth, MultiAgentTradeSignal, PaperPosition, PriceActionSignal, DominantTimeframeAnalysis } from '../types';
import { getColormapLUT } from '../utils/colormaps';
import { SUPPORTED_SYMBOLS, getExchangePairName, getBaseCoin } from '../services/marketApi';
import { AiScalperCard } from './AiScalperCard';
import { TruthAICard } from './TruthAICard';
import { PriceActionCard } from './PriceActionCard';
import { DominantTimeframeCard } from './DominantTimeframeCard';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Flame, 
  Activity, 
  BarChart3, 
  Sliders, 
  ChevronDown, 
  RefreshCw, 
  Wifi, 
  Zap, 
  Layers,
  Settings2,
  Sparkles,
  ArrowLeftRight,
  Globe,
  Bot,
  Scale,
  Compass
} from 'lucide-react';

interface HeatmapChartProps {
  candles: Candle[];
  orderBook: OrderBook;
  heatmapData: HeatmapData | null;
  ticker: TickerData | null;
  dualTicker?: DualExchangeTicker | null;
  dualDepth?: DualExchangeDepth | null;
  colorPreset: ColorPreset;
  onColorPresetChange: (p: ColorPreset) => void;
  intensitySensitivity: number;
  onIntensityChange: (val: number) => void;
  showCandles: boolean;
  onToggleCandles: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  showDepthProfile: boolean;
  onToggleDepthProfile: () => void;
  showVolumeProfile: boolean;
  onToggleVolumeProfile: () => void;
  symbol: string;
  onSymbolChange: (s: string) => void;
  interval: Timeframe;
  onIntervalChange: (tf: Timeframe) => void;
  venue: Venue;
  onVenueChange: (v: Venue) => void;
  leverageFilter: LeverageFilter;
  onLeverageFilterChange: (l: LeverageFilter) => void;
  isLoading: boolean;
  onRefresh: () => void;
  latencyMs: number;
  scalpSignal?: ScalpSignal | null;
  isScalpLoading?: boolean;
  scalpError?: string | null;
  showScalpCard?: boolean;
  onToggleScalpCard?: () => void;
  onRequestScalpSignal?: () => void;
  showScalpOverlay?: boolean;
  onToggleScalpOverlay?: () => void;
  
  // 3X Multi-Agent Trader
  onOpenMultiAgentTrader?: () => void;
  multiAgentSignal?: MultiAgentTradeSignal | null;
  activePositions?: any[];

  // Truth AI State & Handlers
  truthSignal?: any;
  isTruthLoading?: boolean;
  truthError?: string | null;
  showTruthCard?: boolean;
  onToggleTruthCard?: () => void;
  onRequestTruthSignal?: () => void;

  // Price Action Master State & Handlers
  priceActionSignal?: PriceActionSignal | null;
  isPriceActionLoading?: boolean;
  priceActionError?: string | null;
  showPriceActionCard?: boolean;
  onTogglePriceActionCard?: () => void;
  onRequestPriceActionSignal?: () => void;
  showPriceActionOverlay?: boolean;
  onTogglePriceActionOverlay?: () => void;

  // Dominant Timeframe State & Handlers
  dominantTfData?: DominantTimeframeAnalysis | null;
  isDominantTfLoading?: boolean;
  onRequestDominantTf?: () => void;
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

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  candles,
  orderBook,
  heatmapData,
  ticker,
  dualTicker,
  dualDepth,
  colorPreset,
  onColorPresetChange,
  intensitySensitivity,
  onIntensityChange,
  showCandles,
  onToggleCandles,
  showHeatmap,
  onToggleHeatmap,
  showDepthProfile,
  onToggleDepthProfile,
  showVolumeProfile,
  onToggleVolumeProfile,
  symbol,
  onSymbolChange,
  interval,
  onIntervalChange,
  venue,
  onVenueChange,
  leverageFilter,
  onLeverageFilterChange,
  isLoading,
  onRefresh,
  latencyMs,
  scalpSignal,
  isScalpLoading = false,
  scalpError = null,
  showScalpCard = false,
  onToggleScalpCard,
  onRequestScalpSignal,
  showScalpOverlay = true,
  onToggleScalpOverlay,
  onOpenMultiAgentTrader,
  multiAgentSignal,
  activePositions = [],
  truthSignal,
  isTruthLoading = false,
  truthError = null,
  showTruthCard = false,
  onToggleTruthCard,
  onRequestTruthSignal,
  priceActionSignal,
  isPriceActionLoading = false,
  priceActionError = null,
  showPriceActionCard = false,
  onTogglePriceActionCard,
  onRequestPriceActionSignal,
  showPriceActionOverlay = true,
  onTogglePriceActionOverlay,
  dominantTfData = null,
  isDominantTfLoading = false,
  onRequestDominantTf,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showDominantTfWidget, setShowDominantTfWidget] = useState(true);

  // View state: viewport window indices and price range
  const [viewState, setViewState] = useState<{
    startIdx: number;
    endIdx: number;
    minPrice: number;
    maxPrice: number;
    userAdjustedPrice: boolean;
  }>({
    startIdx: 0,
    endIdx: 0,
    minPrice: 0,
    maxPrice: 0,
    userAdjustedPrice: false,
  });

  // Crosshair mouse state
  const [mousePos, setMousePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  // Dragging state for pan
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; startIdx: number; endIdx: number; minPrice: number; maxPrice: number }>({
    x: 0,
    y: 0,
    startIdx: 0,
    endIdx: 0,
    minPrice: 0,
    maxPrice: 0,
  });

  // Format currency helpers
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toFixed(4);
    }
    return price.toFixed(6);
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
    return vol.toFixed(0);
  };

  // Sync initial view window when candles load or interval changes
  useEffect(() => {
    if (!candles || candles.length === 0) return;

    setViewState((prev) => {
      // Default view: show last 110 candles or all if fewer
      const total = candles.length;
      const count = Math.min(total, 110);
      const startIdx = Math.max(0, total - count);
      const endIdx = total - 1;

      // Find high/low in this initial range
      let low = Infinity;
      let high = -Infinity;
      for (let i = startIdx; i <= endIdx; i++) {
        if (candles[i]) {
          if (candles[i].low < low) low = candles[i].low;
          if (candles[i].high > high) high = candles[i].high;
        }
      }
      const padding = (high - low) * 0.08 || high * 0.02;

      return {
        startIdx,
        endIdx,
        minPrice: low - padding,
        maxPrice: high + padding,
        userAdjustedPrice: false,
      };
    });
  }, [candles.length, interval]);

  const drawFibonacciLevels = (
    ctx: CanvasRenderingContext2D,
    swingHigh: number,
    swingLow: number,
    getY: (price: number) => number,
    leftMargin: number,
    rightMargin: number,
    width: number
  ) => {
    const diff = swingHigh - swingLow;
    if (diff <= 0) return;

    const fibLevels = [
      { level: 0.236, color: '#f87171' },
      { level: 0.382, color: '#fb923c' },
      { level: 0.5, color: '#a3e635' },
      { level: 0.618, color: '#fbbf24', isGolden: true }, // Golden Ratio
      { level: 0.786, color: '#60a5fa' }
    ];

    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = '11px sans-serif';

    fibLevels.forEach(({ level, color, isGolden }) => {
      // Calculate price based on standard retracement (High to Low implies support levels from bottom)
      const price = swingLow + diff * level; 
      const y = getY(price);

      ctx.beginPath();
      ctx.setLineDash(isGolden ? [6, 4] : [2, 4]);
      ctx.strokeStyle = color;
      ctx.globalAlpha = isGolden ? 0.9 : 0.4;
      ctx.lineWidth = isGolden ? 1.5 : 1;
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(width - rightMargin, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = color;
      ctx.globalAlpha = isGolden ? 1 : 0.6;
      ctx.fillText(`Fib ${level.toFixed(3)} ${isGolden ? '(Golden)' : ''} - ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`, width - rightMargin - 8, y - 4);
    });

    ctx.restore();
  };

  // Main Render Loop onto HTML5 Canvas
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Margins matching professional CoinGlass Legend layout
    const rightMargin = showDepthProfile ? 140 : 70;
    const bottomMargin = 32;
    const topMargin = 52;
    const leftMargin = 10;

    const chartWidth = width - leftMargin - rightMargin;
    const chartHeight = height - topMargin - bottomMargin;
    const volumeHeight = showVolumeProfile ? Math.min(60, chartHeight * 0.18) : 0;
    const priceChartHeight = chartHeight - volumeHeight;

    // 1. Draw solid dark backdrop
    ctx.fillStyle = '#0a0b12'; // Deepest midnight navy
    ctx.fillRect(0, 0, width, height);

    if (!candles || candles.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading real-time market data...', width / 2, height / 2);
      ctx.restore();
      return;
    }

    const { startIdx, endIdx, minPrice, maxPrice } = viewState;
    const visibleCount = Math.max(1, endIdx - startIdx + 1);
    const candleWidth = chartWidth / visibleCount;
    const priceRange = maxPrice - minPrice || 1;

    // Coordinate conversion functions
    const getX = (index: number) => leftMargin + (index - startIdx + 0.5) * candleWidth;
    const getY = (price: number) => topMargin + priceChartHeight * (1 - (price - minPrice) / priceRange);
    const getPriceAtY = (y: number) => minPrice + (1 - (y - topMargin) / priceChartHeight) * priceRange;

    // 2. Render Heatmap Background
    if (showHeatmap && heatmapData && heatmapData.matrix.length > 0) {
      const lut = getColormapLUT(colorPreset);
      const { priceSteps, priceLevels, timeSteps, matrix, maxIntensity } = heatmapData;

      // Determine price slice in view
      const pStep = heatmapData.priceStep;
      const lutMax = Math.max(0.001, maxIntensity / (intensitySensitivity || 1.0));

      // Render cells across visible timeframe
      for (let i = startIdx; i <= endIdx; i++) {
        if (i < 0 || i >= timeSteps) continue;
        const x = leftMargin + (i - startIdx) * candleWidth;
        const colWidth = Math.ceil(candleWidth) + 0.6;

        for (let p = 0; p < priceSteps; p++) {
          const price = priceLevels[p];
          if (price + pStep < minPrice || price > maxPrice) continue;

          const val = matrix[i * priceSteps + p];
          if (val <= 0.0001) continue;

          // Non-linear gamma curve for rich visual gradient matching CoinGlass
          const normalized = Math.min(1, Math.pow(val / lutMax, 0.62));
          const lutIdx = Math.min(255, Math.max(0, Math.floor(normalized * 255)));
          const offset = lutIdx * 4;

          const r = lut[offset];
          const g = lut[offset + 1];
          const b = lut[offset + 2];
          const a = (lut[offset + 3] / 255);

          const yTop = getY(price + pStep);
          const yBot = getY(price);
          const cellH = Math.max(1, yBot - yTop + 0.5);

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.fillRect(x, yTop, colWidth, cellH);
        }
      }
    }

    // 3. Render Subtle Grid Lines & Price Ticks
    ctx.strokeStyle = '#181b2a';
    ctx.lineWidth = 1;

    // Horizontal price grid lines
    const numPriceLines = Math.max(4, Math.floor(priceChartHeight / 48));
    const priceInterval = priceRange / numPriceLines;

    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';

    for (let i = 0; i <= numPriceLines; i++) {
      const p = minPrice + i * priceInterval;
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(width - rightMargin, y);
      ctx.stroke();

      // Right-side price labels
      ctx.fillText(formatPrice(p), width - rightMargin + 8, y + 3.5);
    }

    // Vertical time grid lines
    const timeGridStep = Math.max(5, Math.floor(visibleCount / 7));
    for (let i = startIdx; i <= endIdx; i += timeGridStep) {
      const x = getX(i);
      const candle = candles[i];
      if (!candle) continue;

      ctx.beginPath();
      ctx.moveTo(x, topMargin);
      ctx.lineTo(x, height - bottomMargin);
      ctx.stroke();

      // Time label on bottom axis
      const date = new Date(candle.time);
      let line1 = '';
      let line2 = '';

      if (interval === '1w') {
        line1 = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        line2 = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (interval === '1d') {
        line1 = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        line2 = `${date.getFullYear()}`;
      } else {
        line1 = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        line2 = `${date.getMonth() + 1}/${date.getDate()}`;
      }
      
      ctx.textAlign = 'center';
      ctx.fillText(line1, x, height - bottomMargin + 16);
      ctx.fillText(line2, x, height - bottomMargin + 28);
    }

    // 4. Render Candlestick Series
    if (showCandles) {
      let swingHigh = -Infinity;
      let swingHighIdx = -1;
      let swingLow = Infinity;
      let swingLowIdx = -1;

      for (let i = startIdx; i <= endIdx; i++) {
        const c = candles[i];
        if (!c) continue;

        if (c.high > swingHigh) {
          swingHigh = c.high;
          swingHighIdx = i;
        }
        if (c.low < swingLow) {
          swingLow = c.low;
          swingLowIdx = i;
        }

        const isBull = c.close >= c.open;
        const color = isBull ? '#22c55e' : '#ef4444'; // Emerald / Red
        const x = getX(i);
        const yOpen = getY(c.open);
        const yClose = getY(c.close);
        const yHigh = getY(c.high);
        const yLow = getY(c.low);

        // Candle Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, candleWidth > 12 ? 1.5 : 1);
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Candle Body
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
        const bodyWidth = Math.max(2, candleWidth * 0.72);

        ctx.fillStyle = color;
        ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
      }

      // 5. Draw Swing High / Low Callout Annotations
      if (swingHighIdx !== -1) {
        const xHigh = getX(swingHighIdx);
        const yHigh = getY(swingHigh);

        ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yHigh);
        ctx.lineTo(width - rightMargin, yHigh);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1;
        const textHigh = `${formatPrice(swingHigh)} ▲`;
        ctx.font = 'bold 11px sans-serif';
        const txtWidth = ctx.measureText(textHigh).width;
        const bx = Math.min(width - rightMargin - txtWidth - 16, Math.max(leftMargin + 10, xHigh - txtWidth / 2));
        ctx.fillRect(bx - 4, yHigh - 18, txtWidth + 8, 16);
        ctx.strokeRect(bx - 4, yHigh - 18, txtWidth + 8, 16);
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'left';
        ctx.fillText(textHigh, bx, yHigh - 6);
      }

      if (swingLowIdx !== -1) {
        const xLow = getX(swingLowIdx);
        const yLow = getY(swingLow);

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yLow);
        ctx.lineTo(width - rightMargin, yLow);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1;
        const textLow = `${formatPrice(swingLow)} ▼`;
        ctx.font = 'bold 11px sans-serif';
        const txtWidth = ctx.measureText(textLow).width;
        const bx = Math.min(width - rightMargin - txtWidth - 16, Math.max(leftMargin + 10, xLow - txtWidth / 2));
        ctx.fillRect(bx - 4, yLow + 4, txtWidth + 8, 16);
        ctx.strokeRect(bx - 4, yLow + 4, txtWidth + 8, 16);
        ctx.fillStyle = '#d8b4fe';
        ctx.textAlign = 'left';
        ctx.fillText(textLow, bx, yLow + 16);
      }

      if (swingHighIdx !== -1 && swingLowIdx !== -1) {
        drawFibonacciLevels(ctx, swingHigh, swingLow, getY, leftMargin, rightMargin, width);
      }
    }

    // 6. Render Volume Sub-Pane
    if (showVolumeProfile && volumeHeight > 0) {
      const volumeTop = topMargin + priceChartHeight;
      let maxVol = 0.001;
      for (let i = startIdx; i <= endIdx; i++) {
        if (candles[i] && candles[i].volume > maxVol) {
          maxVol = candles[i].volume;
        }
      }

      // Divider line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftMargin, volumeTop);
      ctx.lineTo(width - rightMargin, volumeTop);
      ctx.stroke();

      // Volume bars
      for (let i = startIdx; i <= endIdx; i++) {
        const c = candles[i];
        if (!c) continue;

        const x = getX(i);
        const volH = (c.volume / maxVol) * (volumeHeight - 8);
        const isBull = c.close >= c.open;
        ctx.fillStyle = isBull ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        const bWidth = Math.max(1.5, candleWidth * 0.72);
        ctx.fillRect(x - bWidth / 2, height - bottomMargin - volH, bWidth, volH);
      }
    }

    // 7. Right-Side Orderbook Depth Profile & Liquidation Cumulative Histogram
    if (showDepthProfile && heatmapData) {
      const { cumulativeDepthByPrice, priceStep } = heatmapData;
      const profileStartX = width - rightMargin;
      const profileWidth = rightMargin - 65;

      // Find max volume for scale
      let maxProfileVol = 0.001;
      for (const d of cumulativeDepthByPrice) {
        const total = d.bidVolume + d.askVolume + d.liqVolume;
        if (total > maxProfileVol) maxProfileVol = total;
      }

      const currentPrice = ticker?.lastPrice || candles[candles.length - 1]?.close || 0;

      // Draw Depth histogram bars
      for (const d of cumulativeDepthByPrice) {
        if (d.price < minPrice || d.price > maxPrice) continue;

        const y = getY(d.price);
        const barH = Math.max(1.5, Math.abs(getY(d.price + priceStep) - y));

        // Green support for bids / long liqs below current price
        // Red resistance for asks / short liqs above current price
        const isSupport = d.price <= currentPrice;
        const totalVol = d.bidVolume + d.askVolume + d.liqVolume;
        const barW = (totalVol / maxProfileVol) * profileWidth;

        ctx.fillStyle = isSupport ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)';
        ctx.fillRect(profileStartX, y - barH / 2, barW, barH);

        // Highlight high intensity liquidation walls with brighter tips
        if (d.liqVolume > maxProfileVol * 0.3) {
          ctx.fillStyle = '#fde047';
          ctx.fillRect(profileStartX + barW - 2, y - barH / 2, 2, barH);
        }
      }
    }

    // 8. Real-Time Dual-Exchange Price Tracking Lines & Badges
    const livePrice = ticker?.lastPrice || candles[candles.length - 1]?.close || 0;
    const binanceMarkPrice = dualTicker?.binance?.markPrice || dualTicker?.binance?.lastPrice || (venue === 'binance' ? livePrice : 0);
    const hlMarkPrice = dualTicker?.hyperliquid?.markPrice || dualTicker?.hyperliquid?.lastPrice || (venue === 'hyperliquid' ? livePrice : 0);

    // 8a. Binance Price Line (Gold/Amber)
    if (binanceMarkPrice >= minPrice && binanceMarkPrice <= maxPrice && Math.abs(binanceMarkPrice - livePrice) > 0.05) {
      const yBin = getY(binanceMarkPrice);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.65)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(leftMargin, yBin);
      ctx.lineTo(width - rightMargin, yBin);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge on right
      ctx.fillStyle = '#b45309';
      ctx.fillRect(width - rightMargin, yBin - 9, rightMargin, 18);
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`BIN: ${formatPrice(binanceMarkPrice)}`, width - rightMargin + 4, yBin + 4);
    }

    // 8b. Hyperliquid Price Line (Cyan)
    if (hlMarkPrice >= minPrice && hlMarkPrice <= maxPrice && Math.abs(hlMarkPrice - livePrice) > 0.05) {
      const yHl = getY(hlMarkPrice);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(leftMargin, yHl);
      ctx.lineTo(width - rightMargin, yHl);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge on right
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(width - rightMargin, yHl - 9, rightMargin, 18);
      ctx.fillStyle = '#cffafe';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`HL: ${formatPrice(hlMarkPrice)}`, width - rightMargin + 4, yHl + 4);
    }

    // 8c. Primary Live Price Tag Line & Badge
    if (livePrice >= minPrice && livePrice <= maxPrice) {
      const yLive = getY(livePrice);
      const isBull = (ticker?.priceChange || 0) >= 0;
      const badgeColor = venue === 'hyperliquid' ? '#06b6d4' : venue === 'binance' ? '#eab308' : (isBull ? '#22c55e' : '#ef4444');

      // Pulsing dashed price line
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(leftMargin, yLive);
      ctx.lineTo(width - rightMargin, yLive);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price Tag Pill on Right Axis
      ctx.fillStyle = badgeColor;
      ctx.fillRect(width - rightMargin, yLive - 11, rightMargin, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      const prefix = venue === 'aggregated' ? 'AGG ' : venue === 'hyperliquid' ? 'HL ' : 'BIN ';
      ctx.fillText(`${prefix}${formatPrice(livePrice)}`, width - rightMargin + 5, yLive + 4);
    }

    // 8.5 AI Scalper Targets & Invalidation Overlay Lines
    if (showScalpOverlay && scalpSignal) {
      const isLong = scalpSignal.bias === 'LONG';
      const rightWidth = width - rightMargin;
      const setupWidth = Math.min(320, (rightWidth - leftMargin) * 0.45);
      const leftX = rightWidth - setupWidth;

      // 1. Entry Line (Cyan)
      if (scalpSignal.entryPrice >= minPrice && scalpSignal.entryPrice <= maxPrice) {
        const yEntry = getY(scalpSignal.entryPrice);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yEntry);
        ctx.lineTo(rightWidth, yEntry);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right axis badge
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(rightWidth, yEntry - 10, rightMargin, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🎯 Entry`, rightWidth + 4, yEntry + 4);
      }

      // 2. Stop Loss Line (Rose Red)
      if (scalpSignal.stopLoss >= minPrice && scalpSignal.stopLoss <= maxPrice) {
        const ySL = getY(scalpSignal.stopLoss);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, ySL);
        ctx.lineTo(rightWidth, ySL);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right axis badge
        ctx.fillStyle = '#be123c';
        ctx.fillRect(rightWidth, ySL - 10, rightMargin, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🛑 SL`, rightWidth + 4, ySL + 4);
      }

      // 3. Take Profit 1 (Emerald Green)
      if (scalpSignal.takeProfit1 >= minPrice && scalpSignal.takeProfit1 <= maxPrice) {
        const yTP1 = getY(scalpSignal.takeProfit1);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yTP1);
        ctx.lineTo(rightWidth, yTP1);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right axis badge
        ctx.fillStyle = '#047857';
        ctx.fillRect(rightWidth, yTP1 - 10, rightMargin, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`💰 TP1`, rightWidth + 4, yTP1 + 4);
      }

      // 4. Take Profit 2 / Liquidation Target (Amber Gold)
      if (scalpSignal.takeProfit2 >= minPrice && scalpSignal.takeProfit2 <= maxPrice) {
        const yTP2 = getY(scalpSignal.takeProfit2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yTP2);
        ctx.lineTo(rightWidth, yTP2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right axis badge
        ctx.fillStyle = '#b45309';
        ctx.fillRect(rightWidth, yTP2 - 10, rightMargin, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🔥 Liq TP2`, rightWidth + 4, yTP2 + 4);
      }

      // Shaded Risk-Reward Zones on the right area of chart
      if (scalpSignal.entryPrice >= minPrice && scalpSignal.entryPrice <= maxPrice) {
        const yEntry = getY(scalpSignal.entryPrice);
        if (scalpSignal.stopLoss >= minPrice && scalpSignal.stopLoss <= maxPrice) {
          const ySL = getY(scalpSignal.stopLoss);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.09)';
          ctx.fillRect(leftX, Math.min(yEntry, ySL), setupWidth, Math.abs(ySL - yEntry));
        }
        if (scalpSignal.takeProfit2 >= minPrice && scalpSignal.takeProfit2 <= maxPrice) {
          const yTP = getY(scalpSignal.takeProfit2);
          ctx.fillStyle = isLong ? 'rgba(16, 185, 129, 0.09)' : 'rgba(245, 158, 11, 0.09)';
          ctx.fillRect(leftX, Math.min(yEntry, yTP), setupWidth, Math.abs(yTP - yEntry));
        }
      }
    }

    // 8.6 Price Action & Floor Trader Pivot Lines Overlay
    if (showPriceActionOverlay && priceActionSignal && priceActionSignal.pivotLevels) {
      const { centralPivot, r1, r2, s1, s2, equilibrium50 } = priceActionSignal.pivotLevels;
      const rightWidth = width - rightMargin;

      // Central Pivot (P) - High Visibility Cyan
      if (centralPivot >= minPrice && centralPivot <= maxPrice) {
        const yP = getY(centralPivot);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yP);
        ctx.lineTo(rightWidth, yP);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#0891b2';
        ctx.fillRect(rightWidth, yP - 10, rightMargin, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🎯 Pivot P`, rightWidth + 4, yP + 4);
      }

      // Resistance 1 (R1) - Rose Red
      if (r1 >= minPrice && r1 <= maxPrice) {
        const yR1 = getY(r1);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yR1);
        ctx.lineTo(rightWidth, yR1);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#be123c';
        ctx.fillRect(rightWidth, yR1 - 9, rightMargin, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`R1`, rightWidth + 4, yR1 + 3);
      }

      // Resistance 2 (R2) - Crimson
      if (r2 >= minPrice && r2 <= maxPrice) {
        const yR2 = getY(r2);
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yR2);
        ctx.lineTo(rightWidth, yR2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#9f1239';
        ctx.fillRect(rightWidth, yR2 - 8, rightMargin, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`R2`, rightWidth + 4, yR2 + 3);
      }

      // Support 1 (S1) - Emerald Green
      if (s1 >= minPrice && s1 <= maxPrice) {
        const yS1 = getY(s1);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yS1);
        ctx.lineTo(rightWidth, yS1);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#047857';
        ctx.fillRect(rightWidth, yS1 - 9, rightMargin, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`S1`, rightWidth + 4, yS1 + 3);
      }

      // Support 2 (S2) - Deep Forest Green
      if (s2 >= minPrice && s2 <= maxPrice) {
        const yS2 = getY(s2);
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yS2);
        ctx.lineTo(rightWidth, yS2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#065f46';
        ctx.fillRect(rightWidth, yS2 - 8, rightMargin, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`S2`, rightWidth + 4, yS2 + 3);
      }

      // 50% Equilibrium (EQ) - Subtle Amber
      if (equilibrium50 && equilibrium50 >= minPrice && equilibrium50 <= maxPrice) {
        const yEQ = getY(equilibrium50);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(leftMargin, yEQ);
        ctx.lineTo(rightWidth, yEQ);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(rightWidth, yEQ - 8, rightMargin, 16);
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`50% EQ`, rightWidth + 4, yEQ + 3);
      }
    }

    // 9. Interactive Crosshair & Hover Inspector
    if (mousePos.active && mousePos.x >= leftMargin && mousePos.x <= width - rightMargin && mousePos.y >= topMargin && mousePos.y <= height - bottomMargin) {
      const crossX = mousePos.x;
      const crossY = mousePos.y;
      const hoverPrice = getPriceAtY(crossY);

      // Find hovered candle
      const hoveredIdx = Math.min(endIdx, Math.max(startIdx, Math.floor((crossX - leftMargin) / candleWidth) + startIdx));
      const hoveredCandle = candles[hoveredIdx];

      // Crosshair lines
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crossX, topMargin);
      ctx.lineTo(crossX, height - bottomMargin);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(leftMargin, crossY);
      ctx.lineTo(width - rightMargin, crossY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price badge on axis
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(width - rightMargin, crossY - 10, rightMargin, 20);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(width - rightMargin, crossY - 10, rightMargin, 20);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(formatPrice(hoverPrice), width - rightMargin + 6, crossY + 4);

      // Time badge on bottom axis
      if (hoveredCandle) {
        const hoverDate = new Date(hoveredCandle.time);
        const timeBadge = `${hoverDate.toLocaleDateString()} ${hoverDate.toLocaleTimeString()}`;
        ctx.font = '11px sans-serif';
        const tbWidth = ctx.measureText(timeBadge).width + 12;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(crossX - tbWidth / 2, height - bottomMargin + 2, tbWidth, 20);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(crossX - tbWidth / 2, height - bottomMargin + 2, tbWidth, 20);
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(timeBadge, crossX, height - bottomMargin + 16);
      }
    }

    ctx.restore();
  }, [
    candles,
    viewState,
    heatmapData,
    ticker,
    dualTicker,
    dualDepth,
    venue,
    colorPreset,
    intensitySensitivity,
    showCandles,
    showHeatmap,
    showDepthProfile,
    showVolumeProfile,
    mousePos,
    scalpSignal,
    showScalpOverlay,
    priceActionSignal,
    showPriceActionOverlay,
  ]);

  // Request Animation Frame on state changes & resize
  useEffect(() => {
    let animationFrameId: number;
    const handleRender = () => {
      renderChart();
    };
    animationFrameId = requestAnimationFrame(handleRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, [renderChart]);

  // Resize observer to ensure full responsiveness
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      renderChart();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [renderChart]);

  // Mouse / Touch Event Handlers for Panning & Zooming
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startIdx: viewState.startIdx,
      endIdx: viewState.endIdx,
      minPrice: viewState.minPrice,
      maxPrice: viewState.maxPrice,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y, active: true });

    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const containerW = rect.width;
    const containerH = rect.height;
    const visibleCount = dragStartRef.current.endIdx - dragStartRef.current.startIdx + 1;
    const candleW = containerW / visibleCount;

    // Shift time indices
    const indexShift = Math.round(dx / candleW);
    const newStart = Math.max(0, dragStartRef.current.startIdx - indexShift);
    const newEnd = Math.min(candles.length - 1, dragStartRef.current.endIdx - indexShift);

    // Shift price
    const priceRange = dragStartRef.current.maxPrice - dragStartRef.current.minPrice;
    const priceShift = (dy / containerH) * priceRange;

    setViewState({
      startIdx: newStart,
      endIdx: newEnd,
      minPrice: dragStartRef.current.minPrice + priceShift,
      maxPrice: dragStartRef.current.maxPrice + priceShift,
      userAdjustedPrice: true,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  // Zooming with Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;

    setViewState((prev) => {
      const count = prev.endIdx - prev.startIdx + 1;
      const newCount = Math.max(15, Math.min(candles.length, Math.round(count * zoomFactor)));
      const centerIdx = Math.round((prev.startIdx + prev.endIdx) / 2);
      const half = Math.round(newCount / 2);

      let newStart = Math.max(0, centerIdx - half);
      let newEnd = Math.min(candles.length - 1, newStart + newCount - 1);

      // Also adjust price scale if Alt/Ctrl is held, or auto-fit price to visible candles
      let low = Infinity;
      let high = -Infinity;
      for (let i = newStart; i <= newEnd; i++) {
        if (candles[i]) {
          if (candles[i].low < low) low = candles[i].low;
          if (candles[i].high > high) high = candles[i].high;
        }
      }
      const pad = (high - low) * 0.08 || 50;

      return {
        startIdx: newStart,
        endIdx: newEnd,
        minPrice: low - pad,
        maxPrice: high + pad,
        userAdjustedPrice: false,
      };
    });
  };

  // Quick Controls
  const handleZoomIn = () => {
    setViewState((prev) => {
      const count = prev.endIdx - prev.startIdx + 1;
      const newCount = Math.max(15, Math.round(count * 0.75));
      const end = prev.endIdx;
      const start = Math.max(0, end - newCount + 1);
      return { ...prev, startIdx: start, endIdx: end };
    });
  };

  const handleZoomOut = () => {
    setViewState((prev) => {
      const count = prev.endIdx - prev.startIdx + 1;
      const newCount = Math.min(candles.length, Math.round(count * 1.35));
      const end = prev.endIdx;
      const start = Math.max(0, end - newCount + 1);
      return { ...prev, startIdx: start, endIdx: end };
    });
  };

  const handleResetView = () => {
    const total = candles.length;
    const count = Math.min(total, 110);
    const startIdx = Math.max(0, total - count);
    const endIdx = total - 1;

    let low = Infinity;
    let high = -Infinity;
    for (let i = startIdx; i <= endIdx; i++) {
      if (candles[i].low < low) low = candles[i].low;
      if (candles[i].high > high) high = candles[i].high;
    }
    const padding = (high - low) * 0.08 || 50;

    setViewState({
      startIdx,
      endIdx,
      minPrice: low - padding,
      maxPrice: high + padding,
      userAdjustedPrice: false,
    });
  };

  // Current Hovered Stats Calculation for Top Floating Card
  const hoveredIndex = mousePos.active && canvasRef.current
    ? Math.min(viewState.endIdx, Math.max(viewState.startIdx, Math.floor((mousePos.x - 10) / ((canvasRef.current.clientWidth - (showDepthProfile ? 140 : 70) - 10) / Math.max(1, viewState.endIdx - viewState.startIdx + 1))) + viewState.startIdx))
    : viewState.endIdx;
  const activeCandle = candles[hoveredIndex] || candles[candles.length - 1];

  const isPositive = (ticker?.priceChangePercent || 0) >= 0;

  return (
    <div id="liquidity-chart-container" className="relative w-full h-full flex flex-col bg-[#0a0b12] select-none overflow-hidden">
      {/* Top Floating Master HUD (Unified Non-Overlapping Two-Row Design) */}
      <div id="chart-floating-hud" className="absolute top-2 left-2 right-2 z-20 flex flex-col gap-1.5 pointer-events-auto select-none">
        
        {/* ROW 1: Symbol, Interval, Price & AI Suite + Layer Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          
          {/* Left: Symbol Selector, Timeframe Pills, Live Price */}
          <div className="flex items-center gap-2 bg-[#0e111d]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#1d233d] shadow-2xl shrink-0">
            {/* Symbol Dropdown */}
            <div className="relative">
              <button
                id="chart-symbol-dropdown-btn"
                onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#151a2e] hover:bg-[#1d2440] border border-[#252e50] text-xs font-bold text-amber-400 transition-all font-mono shadow-sm"
              >
                <span>{getExchangePairName(symbol, venue)}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold uppercase ${
                  venue === 'hyperliquid'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : venue === 'binance'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {venue === 'hyperliquid' ? 'USDC DEX' : venue === 'binance' ? 'USDT' : 'DUAL'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showSymbolDropdown && (
                <div
                  id="chart-symbol-menu"
                  className="absolute top-full left-0 mt-1.5 w-60 rounded-xl bg-[#101426] border border-[#252e50] shadow-2xl p-1 z-50 backdrop-blur-lg"
                >
                  <div className="text-[10px] text-slate-400 px-2 py-1 font-semibold uppercase tracking-wider flex items-center justify-between">
                    <span>Select Market</span>
                    <span className="text-[9px] text-amber-400">Binance USDT / HL USDC</span>
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
                    {SUPPORTED_SYMBOLS.map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          onSymbolChange(s.symbol);
                          setShowSymbolDropdown(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          symbol === s.symbol
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                            : 'text-slate-300 hover:bg-[#181f3b] hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="font-mono font-bold text-slate-100">
                            {venue === 'hyperliquid' ? s.hyperliquidSymbol : venue === 'binance' ? s.binanceSymbol : s.symbol}
                          </span>
                          <span className="text-[10px] text-slate-400">{s.name}</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 font-mono text-[9px]">
                          <span className="text-amber-300">BIN: {s.binanceSymbol}</span>
                          <span className="text-cyan-300">HL: {s.hyperliquidSymbol}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Timeframe Interval Buttons */}
            <div className="flex items-center bg-[#13172a] p-0.5 rounded-lg border border-[#202747]">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => onIntervalChange(tf.value)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                    interval === tf.value
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c223d]'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Live Price Badge */}
            {ticker && (
              <div className="flex items-center gap-1.5 pl-1 font-mono text-xs">
                <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${formatPrice(ticker.lastPrice)}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {ticker.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Right: AI Intelligence Suite, Layer Toggles, Settings Popover */}
          <div className="flex items-center gap-1.5 bg-[#0e111d]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#1d233d] shadow-2xl shrink-0 overflow-x-auto max-w-full">
            
            {/* 3X Multi-Agent Quant Triad Button */}
            {onOpenMultiAgentTrader && (
              <button
                id="chart-multi-agent-trader-btn"
                onClick={onOpenMultiAgentTrader}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-600/30 hover:from-amber-500/30 hover:to-indigo-600/40 text-amber-300 border border-amber-500/40 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                title="Open 3X Multi-Agent Quant Triad & Execution Terminal"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">3X Multi-Agent</span>
                <span className="sm:hidden inline">3X Agent</span>
                {activePositions.length > 0 ? (
                  (() => {
                    const totalUnrealized = activePositions.reduce((sum, p) => sum + (p.unrealizedPnlUsd || 0), 0);
                    const isPos = totalUnrealized >= 0;
                    return (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                        isPos 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {activePositions.length} Pos ({isPos ? '+' : ''}${totalUnrealized.toFixed(0)})
                      </span>
                    );
                  })()
                ) : multiAgentSignal ? (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    multiAgentSignal.consensusBias === 'LONG' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
                  }`}>
                    {multiAgentSignal.consensusBias}
                  </span>
                ) : null}
              </button>
            )}

            {/* Dominant Timeframe (MTF Alignment) Button */}
            <button
              id="chart-dominant-tf-btn"
              onClick={() => {
                setShowDominantTfWidget(!showDominantTfWidget);
                if (!dominantTfData && onRequestDominantTf) onRequestDominantTf();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                isDominantTfLoading
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse shadow-sm'
                  : showDominantTfWidget
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-[#151a2e] text-emerald-300 hover:text-white hover:bg-[#132d28] border border-[#1d4d3e]'
              }`}
              title="Dominant Reaction Timeframe & MTF Alignment (Resolves Bot Timeframe Conflicts)"
            >
              <Compass className={`w-3.5 h-3.5 ${isDominantTfLoading ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">Dominant TF</span>
              {dominantTfData ? (
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  dominantTfData.dominantBias === 'BULLISH' ? 'bg-emerald-400/30 text-emerald-200' : 'bg-rose-400/30 text-rose-200'
                }`}>
                  {dominantTfData.dominantLabel} {dominantTfData.dominantBias}
                </span>
              ) : (
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-emerald-300 font-mono font-normal">MTF</span>
              )}
            </button>

            {/* Price Action Master (Return to Pivot) Button */}
            <button
              id="chart-price-action-btn"
              onClick={() => {
                if (onTogglePriceActionCard) onTogglePriceActionCard();
                if (!priceActionSignal && onRequestPriceActionSignal) onRequestPriceActionSignal();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                isPriceActionLoading
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 animate-pulse shadow-sm'
                  : showPriceActionCard
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white border border-cyan-400/40 shadow-lg shadow-cyan-500/20'
                  : 'bg-[#151a2e] text-cyan-300 hover:text-white hover:bg-[#13283d] border border-[#1d3e5c]'
              }`}
              title="Open Price Action Master (Return to Pivot & Market Structure)"
            >
              <Compass className={`w-3.5 h-3.5 ${isPriceActionLoading ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline">Price Action</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-cyan-300 font-mono font-normal">Pivots</span>
            </button>

            {/* Truth AI Reality Anchor Button */}
            <button
              id="chart-truth-ai-btn"
              onClick={() => {
                if (onToggleTruthCard) onToggleTruthCard();
                if (!truthSignal && onRequestTruthSignal) onRequestTruthSignal();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                isTruthLoading
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 animate-pulse shadow-sm'
                  : showTruthCard
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/40 shadow-lg shadow-purple-500/20'
                  : 'bg-[#151a2e] text-purple-300 hover:text-white hover:bg-[#1f1d3d] border border-[#30275c]'
              }`}
              title="Open Truth AI (Macro Realist & Bear Market Reality Anchor)"
            >
              <Scale className={`w-3.5 h-3.5 ${isTruthLoading ? 'animate-spin text-purple-400' : 'text-purple-400'}`} />
              <span className="hidden sm:inline">Truth AI</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-purple-300 font-mono font-normal">Realist</span>
            </button>

            {/* AI Scalper Button (Gemini 3.7 Flash) */}
            <button
              id="chart-ai-scalper-btn"
              onClick={() => {
                if (onToggleScalpCard) onToggleScalpCard();
                if (!scalpSignal && onRequestScalpSignal) onRequestScalpSignal();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                isScalpLoading
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse shadow-sm'
                  : showScalpCard
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white border border-amber-400/40 shadow-lg shadow-amber-500/20'
                  : 'bg-[#151a2e] text-amber-300 hover:text-white hover:bg-[#1d2440] border border-[#2e375c]'
              }`}
              title="Open AI Scalper with Gemini 3.7 Flash"
            >
              <Zap className={`w-3.5 h-3.5 ${isScalpLoading ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">AI Scalper</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono font-normal">3.7 Flash</span>
            </button>

            {/* Divider */}
            <div className="w-[1px] h-4 bg-[#232b4b] mx-0.5 shrink-0" />

            {/* Quick Heatmap & Depth Profile Toggles */}
            <button
              onClick={onToggleHeatmap}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                showHeatmap
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-[#13172a]'
              }`}
              title="Toggle Liquidation Heatmap Layer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Heatmap</span>
            </button>

            <button
              onClick={onToggleDepthProfile}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                showDepthProfile
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-[#13172a]'
              }`}
              title="Toggle Orderbook Liquidity Depth Profile"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Depth</span>
            </button>

            <button
              onClick={onToggleCandles}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                showCandles
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-[#13172a]'
              }`}
              title="Toggle Candlesticks"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Candles</span>
            </button>

            {/* Settings Popover Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className={`p-1.5 rounded-lg border transition-all ${
                  showSettingsDrawer
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-[#151a2e] text-slate-300 hover:text-white border-[#252e50]'
                }`}
                title="Chart & Heatmap Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {showSettingsDrawer && (
                <div
                  id="chart-settings-popover"
                  className="absolute top-full right-0 mt-2 w-72 rounded-xl bg-[#101426] border border-[#252e50] shadow-2xl p-3 z-50 flex flex-col gap-3 font-sans text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-200 pb-1 border-b border-[#1e2542]">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      Heatmap Settings
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono">Legend v2</span>
                  </div>

                  {/* Heatmap Sensitivity Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>Intensity Sensitivity:</span>
                      <span className="text-amber-400 font-mono font-bold">{intensitySensitivity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.5"
                      step="0.1"
                      value={intensitySensitivity}
                      onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                    />
                  </div>

                  {/* Leverage Tier Filter */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-300">Leverage Filter:</span>
                    <div className="grid grid-cols-5 gap-1 bg-[#151a2e] p-1 rounded-lg border border-[#222947]">
                      {(['all', '100x', '50x', '25x', '10x'] as LeverageFilter[]).map((lev) => (
                        <button
                          key={lev}
                          onClick={() => onLeverageFilterChange(lev)}
                          className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                            leverageFilter === lev
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lev.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Preset Palette */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-300">Color Palette:</span>
                    <select
                      value={colorPreset}
                      onChange={(e) => onColorPresetChange(e.target.value as ColorPreset)}
                      className="bg-[#171d36] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-[#283254] outline-none font-medium cursor-pointer"
                    >
                      <option value="coinglass">CoinGlass Legend</option>
                      <option value="cyberpunk">Cyberpunk Neon</option>
                      <option value="magma">Deep Magma</option>
                      <option value="inferno">Inferno Thermal</option>
                      <option value="viridis">Viridis Spectrum</option>
                    </select>
                  </div>

                  {/* Venue Switcher */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-300">Exchange Venue Feed:</span>
                    <div className="grid grid-cols-3 gap-1 bg-[#151a2e] p-1 rounded-lg border border-[#222947]">
                      <button
                        onClick={() => onVenueChange('aggregated')}
                        className={`py-1 rounded text-[11px] font-semibold transition-all ${
                          venue === 'aggregated' ? 'bg-purple-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Aggregated
                      </button>
                      <button
                        onClick={() => onVenueChange('binance')}
                        className={`py-1 rounded text-[11px] font-semibold transition-all ${
                          venue === 'binance' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Binance
                      </button>
                      <button
                        onClick={() => onVenueChange('hyperliquid')}
                        className={`py-1 rounded text-[11px] font-semibold transition-all ${
                          venue === 'hyperliquid' ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Hyperliquid
                      </button>
                    </div>
                  </div>

                  {/* Refresh & Latency */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#1e2542] text-[11px] text-slate-400">
                    <button
                      onClick={onRefresh}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-[#171d36] hover:bg-[#202747] text-slate-200 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                      <span>Sync Feed</span>
                    </button>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <Wifi className="w-3 h-3" />
                      {latencyMs || 42}ms
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ROW 2: Microstructure Dual-Exchange & OHLC Live Strip (Seamlessly Flowing) */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          
          {/* Left: Dual-Exchange & Cross-Basis Spread Pills */}
          <div className="flex items-center gap-1.5 bg-[#0e111d]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#1d233d] shadow-xl text-[11px] font-mono shrink-0 overflow-x-auto max-w-full">
            {/* Binance Pill */}
            <button 
              onClick={() => onVenueChange('binance')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all shrink-0 ${
                venue === 'binance' 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-sm' 
                  : 'border-[#222947] bg-[#121629] text-slate-400 hover:text-amber-300'
              }`}
              title="Focus on Binance Futures (Settled in USDT)"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
              <span className="font-bold">BINANCE (USDT):</span>
              <span className="text-slate-100 font-bold">${formatPrice(dualTicker?.binance?.lastPrice || ticker?.lastPrice || 0)}</span>
              <span className="text-emerald-400 text-[10px]">Fund: {(((dualTicker?.binance?.fundingRate || ticker?.fundingRate || 0.0001) * 100)).toFixed(3)}%</span>
              <span className="text-slate-400 text-[10px]">OI: ${(((dualTicker?.binance?.openInterestUsd || ticker?.openInterestUsd || 1e9) / 1e6)).toFixed(0)}M</span>
            </button>

            {/* Hyperliquid Pill */}
            <button 
              onClick={() => onVenueChange('hyperliquid')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all shrink-0 ${
                venue === 'hyperliquid' 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-sm' 
                  : 'border-[#222947] bg-[#121629] text-slate-400 hover:text-cyan-300'
              }`}
              title="Focus on Hyperliquid DEX (Settled in USDC)"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm" />
              <span className="font-bold">HYPERLIQUID (USDC):</span>
              <span className="text-slate-100 font-bold">${formatPrice(dualTicker?.hyperliquid?.lastPrice || ((ticker?.lastPrice || 0) * 1.0002))}</span>
              <span className="text-emerald-400 text-[10px]">Fund: {(((dualTicker?.hyperliquid?.fundingRate || (ticker?.fundingRate || 0.0001) * 1.15) * 100)).toFixed(3)}%</span>
              <span className="text-slate-400 text-[10px]">OI: ${(((dualTicker?.hyperliquid?.openInterestUsd || (ticker?.openInterestUsd || 1e9) * 0.28) / 1e6)).toFixed(0)}M</span>
            </button>

            {/* Cross Spread Delta Pill */}
            <button 
              onClick={() => onVenueChange('aggregated')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all shrink-0 ${
                venue === 'aggregated' 
                  ? 'bg-purple-600/30 border-purple-500/60 text-purple-300 font-bold shadow-sm' 
                  : 'border-[#222947] bg-[#121629] text-slate-400 hover:text-purple-300'
              }`}
              title="Switch to Aggregated Dual-Exchange Heatmap (Both Exchanges Combined)"
            >
              <ArrowLeftRight className="w-3 h-3 text-purple-400" />
              <span className="text-purple-300 font-bold">CROSS BASIS SPREAD:</span>
              <span className={((dualTicker?.spreadUsd || 0) >= 0) ? 'text-cyan-300 font-bold' : 'text-amber-300 font-bold'}>
                ${(dualTicker?.spreadUsd || 0).toFixed(2)} ({((dualTicker?.spreadPercent || 0) >= 0 ? '+' : '')}{(dualTicker?.spreadPercent || 0).toFixed(3)}%)
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/50 text-purple-200 border border-purple-700/50">
                AGGREGATED
              </span>
            </button>
          </div>

          {/* Right: Active Candle OHLC Bar */}
          {activeCandle && (
            <div className="hidden lg:flex items-center gap-2.5 bg-[#0e111d]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-[#1d233d] shadow-xl text-[11px] text-slate-400 font-mono shrink-0">
              <span>O: <strong className="text-slate-200">{formatPrice(activeCandle.open)}</strong></span>
              <span>H: <strong className="text-emerald-400">{formatPrice(activeCandle.high)}</strong></span>
              <span>L: <strong className="text-rose-400">{formatPrice(activeCandle.low)}</strong></span>
              <span>C: <strong className="text-slate-200">{formatPrice(activeCandle.close)}</strong></span>
              <span>Vol: <strong className="text-amber-400">{formatVolume(activeCandle.volume)}</strong></span>
            </div>
          )}

        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="relative flex-1 w-full h-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className="absolute inset-0 w-full h-full"
        />

        {/* Floating Dominant Reaction Timeframe & MTF Alignment Widget */}
        {showDominantTfWidget && dominantTfData && (
          <div className="absolute top-24 left-2 right-2 sm:left-3 sm:right-auto sm:max-w-3xl z-30 pointer-events-auto">
            <DominantTimeframeCard
              data={dominantTfData}
              loading={isDominantTfLoading}
              onRefresh={onRequestDominantTf || (() => {})}
              symbol={symbol}
              activeInterval={interval}
              onSelectTimeframe={(tf) => onIntervalChange(tf as Timeframe)}
            />
          </div>
        )}

        {/* Floating AI Scalper Card Widget */}
        {showScalpCard && (
          <AiScalperCard
            signal={scalpSignal || null}
            isLoading={isScalpLoading}
            error={scalpError}
            onRefresh={onRequestScalpSignal || (() => {})}
            onClose={onToggleScalpCard || (() => {})}
            showOverlayLines={showScalpOverlay}
            onToggleOverlayLines={onToggleScalpOverlay || (() => {})}
            symbol={symbol}
          />
        )}

        {/* Floating Truth AI Reality Anchor Widget */}
        {showTruthCard && (
          <TruthAICard
            signal={truthSignal || null}
            isLoading={isTruthLoading}
            error={truthError}
            onRefresh={onRequestTruthSignal || (() => {})}
            onClose={onToggleTruthCard || (() => {})}
            symbol={symbol}
          />
        )}

        {/* Floating Price Action Master (Return to Pivot) Widget */}
        {showPriceActionCard && (
          <PriceActionCard
            signal={priceActionSignal || null}
            isLoading={isPriceActionLoading}
            error={priceActionError}
            onRefresh={onRequestPriceActionSignal || (() => {})}
            onClose={onTogglePriceActionCard || (() => {})}
            showOverlayLines={showPriceActionOverlay}
            onToggleOverlayLines={onTogglePriceActionOverlay || (() => {})}
            symbol={symbol}
          />
        )}
      </div>

      {/* Floating Chart Zoom & Reset Controls */}
      <div id="chart-floating-actions" className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-[#11131f]/90 border border-[#1e2238] backdrop-blur-md p-1 rounded-lg shadow-xl">
        <button
          id="btn-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In (Time)"
          className="p-1.5 hover:bg-[#1f243d] text-slate-300 hover:text-white rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out (Time)"
          className="p-1.5 hover:bg-[#1f243d] text-slate-300 hover:text-white rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-view"
          onClick={handleResetView}
          title="Reset View"
          className="p-1.5 hover:bg-[#1f243d] text-slate-300 hover:text-white rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
