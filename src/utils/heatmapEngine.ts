import { Candle, HeatmapData, LeverageFilter, OrderBook } from '../types';

export interface HeatmapEngineOptions {
  candles: Candle[];
  orderBook: OrderBook;
  leverageFilter: LeverageFilter;
  intensitySensitivity: number; // 0.5 to 2.5
  priceSteps?: number;
}

export function computeLiquidityHeatmap({
  candles,
  orderBook,
  leverageFilter,
  intensitySensitivity = 1.0,
  priceSteps = 160,
}: HeatmapEngineOptions): HeatmapData {
  if (!candles || candles.length === 0) {
    return {
      priceStep: 1,
      minPrice: 0,
      maxPrice: 1,
      priceLevels: [],
      matrix: new Float32Array(0),
      timeSteps: 0,
      priceSteps: 0,
      startTime: 0,
      endTime: 0,
      maxIntensity: 1,
      cumulativeDepthByPrice: [],
    };
  }

  const timeSteps = candles.length;
  const startTime = candles[0].time;
  const endTime = candles[candles.length - 1].time;

  // 1. Calculate min and max price across candles with generous buffer for liquidation levels
  let rawMin = Infinity;
  let rawMax = -Infinity;
  let totalQuoteVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (c.low < rawMin) rawMin = c.low;
    if (c.high > rawMax) rawMax = c.high;
    totalQuoteVolume += c.quoteVolume || (c.volume * ((c.open + c.close) / 2));
  }

  const avgCandleQuoteVol = totalQuoteVolume / Math.max(1, candles.length);
  const priceRange = rawMax - rawMin || rawMax * 0.02;
  // Margin for out-of-range liquidation levels (8-10% range)
  const margin = Math.max(priceRange * 0.10, rawMax * 0.018);
  const minPrice = Math.max(0, rawMin - margin);
  const maxPrice = rawMax + margin;
  const priceStep = (maxPrice - minPrice) / priceSteps;

  const priceLevels: number[] = new Array(priceSteps);
  for (let p = 0; p < priceSteps; p++) {
    priceLevels[p] = minPrice + p * priceStep;
  }

  // 2D matrix: Float32Array of size (timeSteps * priceSteps)
  // Index = timeIndex * priceSteps + priceIndex
  const matrix = new Float32Array(timeSteps * priceSteps);

  // Leverage tiers and realistic liquidation distance percentages
  const leverageTiers: { leverage: number; weight: number; dist: number }[] = [];
  if (leverageFilter === 'all' || leverageFilter === '100x') {
    leverageTiers.push({ leverage: 100, weight: 0.35, dist: 0.008 }); // ~0.8% distance
  }
  if (leverageFilter === 'all' || leverageFilter === '50x') {
    leverageTiers.push({ leverage: 50, weight: 0.30, dist: 0.016 }); // ~1.6% distance
  }
  if (leverageFilter === 'all' || leverageFilter === '25x') {
    leverageTiers.push({ leverage: 25, weight: 0.22, dist: 0.035 }); // ~3.5% distance
  }
  if (leverageFilter === 'all' || leverageFilter === '10x') {
    leverageTiers.push({ leverage: 10, weight: 0.13, dist: 0.085 }); // ~8.5% distance
  }

  // Track active unliquidated clusters
  interface Cluster {
    openTimeIndex: number;
    price: number;
    priceIndex: number;
    side: 'long' | 'short';
    volumeUsd: number;
    clearedAtTimeIndex: number | null;
  }

  const clusters: Cluster[] = [];

  // Generate liquidation points from historical candle price actions
  for (let t = 0; t < timeSteps; t++) {
    const c = candles[t];
    const avgPrice = (c.open + c.close + c.high + c.low) / 4;
    const baseVolume = (c.quoteVolume || (c.volume * avgPrice)) || avgCandleQuoteVol;

    for (const tier of leverageTiers) {
      // Longs get liquidated below entry
      const longLiqPrice = avgPrice * (1 - tier.dist);
      const longPriceIdx = Math.floor((longLiqPrice - minPrice) / priceStep);

      // Shorts get liquidated above entry
      const shortLiqPrice = avgPrice * (1 + tier.dist);
      const shortPriceIdx = Math.floor((shortLiqPrice - minPrice) / priceStep);

      const vol = baseVolume * tier.weight * 0.6;

      if (longPriceIdx >= 0 && longPriceIdx < priceSteps) {
        clusters.push({
          openTimeIndex: t,
          price: longLiqPrice,
          priceIndex: longPriceIdx,
          side: 'long',
          volumeUsd: vol,
          clearedAtTimeIndex: null,
        });
      }

      if (shortPriceIdx >= 0 && shortPriceIdx < priceSteps) {
        clusters.push({
          openTimeIndex: t,
          price: shortLiqPrice,
          priceIndex: shortPriceIdx,
          side: 'short',
          volumeUsd: vol,
          clearedAtTimeIndex: null,
        });
      }
    }
  }

  // Process liquidation sweeps / invalidations
  for (let i = 0; i < clusters.length; i++) {
    const cl = clusters[i];
    for (let t = cl.openTimeIndex + 1; t < timeSteps; t++) {
      const candle = candles[t];
      if (cl.side === 'long' && candle.low <= cl.price) {
        cl.clearedAtTimeIndex = t;
        break;
      }
      if (cl.side === 'short' && candle.high >= cl.price) {
        cl.clearedAtTimeIndex = t;
        break;
      }
    }
  }

  // Populate time-price matrix from clusters with persistence & diffusion
  for (let i = 0; i < clusters.length; i++) {
    const cl = clusters[i];
    const endT = cl.clearedAtTimeIndex !== null ? cl.clearedAtTimeIndex : timeSteps;
    const pIdx = cl.priceIndex;

    for (let t = cl.openTimeIndex; t < endT; t++) {
      const idx = t * priceSteps + pIdx;
      // Slight decay over extended time to represent aging positions
      const age = t - cl.openTimeIndex;
      const decay = Math.max(0.55, 1 - (age / Math.max(1, timeSteps)) * 0.45);
      matrix[idx] += cl.volumeUsd * decay;

      // Also diffuse to adjacent price bins for luminous smooth bands
      if (pIdx > 0) {
        matrix[t * priceSteps + (pIdx - 1)] += cl.volumeUsd * decay * 0.4;
      }
      if (pIdx < priceSteps - 1) {
        matrix[t * priceSteps + (pIdx + 1)] += cl.volumeUsd * decay * 0.4;
      }
    }

    // Flash liquidation burst at the moment of sweep
    if (cl.clearedAtTimeIndex !== null && cl.clearedAtTimeIndex < timeSteps) {
      const sweepT = cl.clearedAtTimeIndex;
      const sweepIdx = sweepT * priceSteps + pIdx;
      matrix[sweepIdx] += cl.volumeUsd * 1.5;
    }
  }

  // Integrate live Order Book bids and asks at the latest time steps with proportional scaling
  const lastTimeIndex = timeSteps - 1;
  if (orderBook && ((orderBook.bids && orderBook.bids.length > 0) || (orderBook.asks && orderBook.asks.length > 0))) {
    const orderBookWidth = Math.min(30, Math.max(10, Math.floor(timeSteps * 0.18)));

    // Maximum cap so an individual orderbook wall doesn't distort the rest of the chart
    const maxAllowedOrderVal = avgCandleQuoteVol * 1.8;

    // Bids
    for (const b of orderBook.bids || []) {
      if (b.price >= minPrice && b.price <= maxPrice) {
        const pIdx = Math.floor((b.price - minPrice) / priceStep);
        const rawOrderVol = b.size * b.price;
        const normalizedOrderVol = Math.min(maxAllowedOrderVal, rawOrderVol);

        for (let dt = 0; dt < orderBookWidth; dt++) {
          const t = lastTimeIndex - dt;
          if (t >= 0 && pIdx >= 0 && pIdx < priceSteps) {
            const idx = t * priceSteps + pIdx;
            matrix[idx] += normalizedOrderVol * (1 - dt / orderBookWidth);
          }
        }
      }
    }

    // Asks
    for (const a of orderBook.asks || []) {
      if (a.price >= minPrice && a.price <= maxPrice) {
        const pIdx = Math.floor((a.price - minPrice) / priceStep);
        const rawOrderVol = a.size * a.price;
        const normalizedOrderVol = Math.min(maxAllowedOrderVal, rawOrderVol);

        for (let dt = 0; dt < orderBookWidth; dt++) {
          const t = lastTimeIndex - dt;
          if (t >= 0 && pIdx >= 0 && pIdx < priceSteps) {
            const idx = t * priceSteps + pIdx;
            matrix[idx] += normalizedOrderVol * (1 - dt / orderBookWidth);
          }
        }
      }
    }
  }

  // Calculate robust 97th percentile for maxIntensity to prevent outlier washout
  const nonZeroValues: number[] = [];
  for (let i = 0; i < matrix.length; i++) {
    if (matrix[i] > 0.001) {
      nonZeroValues.push(matrix[i]);
    }
  }

  let maxIntensity = 1.0;
  if (nonZeroValues.length > 0) {
    nonZeroValues.sort((a, b) => a - b);
    const p97Index = Math.min(nonZeroValues.length - 1, Math.floor(nonZeroValues.length * 0.97));
    maxIntensity = Math.max(0.001, nonZeroValues[p97Index]);
  }

  // Cumulative depth profile for right-hand side histogram
  const cumulativeDepthByPrice = new Array(priceSteps);
  for (let p = 0; p < priceSteps; p++) {
    const price = priceLevels[p];
    let liqSum = 0;
    // Sum active surviving clusters at the current time bar
    const lastIdx = (timeSteps - 1) * priceSteps + p;
    liqSum = matrix[lastIdx];

    // Find closest orderbook volume
    let bidVol = 0;
    let askVol = 0;
    if (orderBook.bids) {
      for (const b of orderBook.bids) {
        if (Math.abs(b.price - price) <= priceStep * 0.75) {
          bidVol += b.size * b.price;
        }
      }
    }
    if (orderBook.asks) {
      for (const a of orderBook.asks) {
        if (Math.abs(a.price - price) <= priceStep * 0.75) {
          askVol += a.size * a.price;
        }
      }
    }

    // Calculate cluster age and phantom risk
    let oldestActiveTime = endTime;
    for (const cl of clusters) {
      if (cl.priceIndex === p && cl.clearedAtTimeIndex === null) {
        const clTime = candles[cl.openTimeIndex]?.time || startTime;
        if (clTime < oldestActiveTime) {
          oldestActiveTime = clTime;
        }
      }
    }
    const ageMinutes = Math.round((endTime - oldestActiveTime) / 60000);
    let phantomRisk = "LOW";
    if (liqSum > maxIntensity * 0.7 && ageMinutes < 15) {
      phantomRisk = "HIGH_SPOOF_RISK"; // Huge volume appeared recently
    } else if (liqSum > maxIntensity * 0.4 && ageMinutes > 60) {
      phantomRisk = "SOLID_INSTITUTIONAL"; // Survived for an hour without vanishing
    } else if (ageMinutes > 30) {
      phantomRisk = "MODERATE_PERSISTENCE";
    }

    cumulativeDepthByPrice[p] = {
      price,
      bidVolume: bidVol,
      askVolume: askVol,
      liqVolume: liqSum,
      clusterAgeMinutes: ageMinutes > 0 ? ageMinutes : undefined,
      phantomLiquidityRisk: ageMinutes > 0 ? phantomRisk : undefined,
    };
  }

  return {
    priceStep,
    minPrice,
    maxPrice,
    priceLevels,
    matrix,
    timeSteps,
    priceSteps,
    startTime,
    endTime,
    maxIntensity,
    cumulativeDepthByPrice,
  };
}
