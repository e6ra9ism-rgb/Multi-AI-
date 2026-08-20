const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const missingCode = `
  // Open Multi-Agent Modal handler
  const handleOpenMultiAgentTrader = useCallback(() => {
    setShowMultiAgentModal(true);
    if (!multiAgentSignal) {
      handleRequestMultiAgentSignal();
    }
  }, [multiAgentSignal, handleRequestMultiAgentSignal]);

  // Reset scalp, multi-agent, truth, price action, and dominant timeframe signal on symbol switch
  useEffect(() => {
    setScalpSignal(null);
    setScalpError(null);
    setMultiAgentSignal(null);
    setMultiAgentError(null);
    setTruthSignal(null);
    setTruthError(null);
    setPriceActionSignal(null);
    setPriceActionError(null);
    setDominantTfData(null);
  }, [symbol]);

  // Fetch all market data including Dual-Exchange Ticker and Dual-Depth
  const loadMarketData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    const start = performance.now();
    try {
      // Fetch deep historical candles (1500 for low timeframes, 1000 for high timeframes)
      const candleLimit = ['1m', '3m', '5m', '15m', '30m'].includes(interval) ? 1500 : 1000;
      const [fetchedCandles, fetchedDualTicker, fetchedDualDepth, allPrices] = await Promise.all([
        marketApi.fetchKlines(symbol, interval, candleLimit, venue === 'hyperliquid' ? 'hyperliquid' : 'binance'),
        marketApi.fetchDualTicker(symbol),
        marketApi.fetchDualOrderBook(symbol),
        marketApi.fetchAllPrices(),
      ]);

      if (!isMountedRef.current) return;

      const duration = Math.round(performance.now() - start);
      setLatencyMs(duration);

      if (allPrices && Object.keys(allPrices).length > 0) {
        setLivePrices((prev) => ({ ...prev, ...allPrices }));
      }

      if (fetchedCandles && fetchedCandles.length > 0) {
        setCandles(fetchedCandles);
      }

      if (fetchedDualTicker) {
        setDualTicker(fetchedDualTicker);
        if (venue === 'aggregated') {
          setTicker({
            ...fetchedDualTicker.binance,
            openInterestUsd: fetchedDualTicker.aggregatedOI,
            quoteVolume24h: fetchedDualTicker.aggregatedVol,
          });
        } else if (venue === 'hyperliquid') {
          setTicker(fetchedDualTicker.hyperliquid);
        } else {
          setTicker(fetchedDualTicker.binance);
        }
      }

      if (fetchedDualDepth) {
        setDualDepth(fetchedDualDepth);
        if (venue === 'aggregated' && fetchedDualDepth.aggregated) {
          setOrderBook(fetchedDualDepth.aggregated);
        } else if (venue === 'hyperliquid' && fetchedDualDepth.hyperliquid) {
          setOrderBook(fetchedDualDepth.hyperliquid);
        } else if (fetchedDualDepth.binance) {
          setOrderBook(fetchedDualDepth.binance);
        }
      }
    } catch (err) {
      console.error('Error fetching dual market data:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [symbol, interval, venue]);

  // Initial load & periodic polling
  useEffect(() => {
    isMountedRef.current = true;
    loadMarketData(true);
    const intervalId = window.setInterval(() => {
      loadMarketData(false);
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [loadMarketData]);
`;

code = code.replace(/\/\/ Auto-sync Bitunix positions every 15 seconds if connected/g, missingCode + '\n  // Auto-sync Bitunix positions every 15 seconds if connected');

// Also remove the incorrect handleOpenMultiAgentTrader I added
code = code.replace(/  const handleOpenMultiAgentTrader = \(\) => setShowMultiAgentModal\(true\);\n\n/g, '');


fs.writeFileSync('src/App.tsx', code);
