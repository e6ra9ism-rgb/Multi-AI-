const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove activePositions hooks
code = code.replace(/const \[activePositions, setActivePositions\] = useState<PaperPosition\[\]>\(\[\]\);\n?/g, '');
code = code.replace(/const activePositionsRef = useRef\(activePositions\);\n?/g, '');
code = code.replace(/activePositionsRef\.current = activePositions;\n?/g, '');

// 2. Remove local storage loading for paper positions
code = code.replace(/const savedLocalPos = localStorage\.getItem\('quant_active_positions'\);\n\s*if \(savedLocalPos\) \{\n\s*setActivePositions\(JSON\.parse\(savedLocalPos\)\);\n\s*\}/g, '');
code = code.replace(/localStorage\.setItem\('quant_active_positions', JSON\.stringify\(activePositions\)\);/g, '');

// 3. Remove firestore subscription for paper positions
code = code.replace(/const unsubPositions = subscribeToPositions\(userProfile\.uid, \(cloudPositions\) => \{\n\s*setActivePositions\(cloudPositions \|\| \[\]\);\n\s*setFirestoreStatus\('connected'\);\n\s*\}\);\n/g, "setFirestoreStatus('connected');\n");
code = code.replace(/unsubPositions\(\);\n/g, '');

// 4. Update existingPos check
code = code.replace(/const existingPos = activePositions\.find\(\(p\) => p\.symbol === symbol\);/g, 'const existingPos = bitunixPositions.find((p) => p.symbol === symbol);');

// 5. Replace handleExecuteTrade entirely
const handleExecuteTradeRegex = /const handleExecuteTrade = useCallback\(\(params: \{[\s\S]*?\} \), \[symbol, ticker, account, livePrices, userProfile, handleBitunixSync\]\);/g;
// Actually, I can just replace the whole body of handleExecuteTrade. Let's use a targeted replace.
const oldHandleExecuteTrade = `    const newPosition: PaperPosition = {
      id: \`pos_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`,
      symbol: params.symbol,
      side: params.side,
      entryPrice: executionPrice,
      currentPrice: curPrice,
      leverage: params.leverage,
      marginUsd: params.marginUsd,
      sizeUsd: notional,
      stopLoss: params.stopLoss,
      takeProfit1: params.takeProfit1,
      takeProfit2: params.takeProfit2,
      liquidationPrice,
      unrealizedPnlUsd: 0,
      unrealizedPnlPercent: 0,
      openTime: Date.now(),
      agentConsensus: params.consensusScore,
      confidence: params.confidence,
    };

    setActivePositions((prev) => [newPosition, ...prev]);
    
    setAccount((prev) => {
      const updated = {
        ...prev,
        balanceUsd: Math.max(0, prev.balanceUsd - params.marginUsd),
      };
      if (userProfile?.uid) {
        saveUserAccount(userProfile.uid, updated, { email: userProfile.email, displayName: userProfile.displayName });
      }
      return updated;
    });

    // Save to Firestore
    if (userProfile?.uid) {
      savePositionToFirestore(userProfile.uid, newPosition);
    }`;

code = code.replace(oldHandleExecuteTrade, '');

// 6. Remove handleClosePosition, handlePartialTakeProfit, handleMoveStopToBreakeven
const closePosRegex = /\/\/ Close Position handler & Save to Firestore ClosedTrades[\s\S]*?\/\/ Partial Take Profit \(Scale 50%\)/;
code = code.replace(closePosRegex, '// Partial Take Profit (Scale 50%)');

const partialTPRegex = /\/\/ Partial Take Profit \(Scale 50%\)[\s\S]*?\/\/ Move Stop Loss to Breakeven/;
code = code.replace(partialTPRegex, '// Move Stop Loss to Breakeven');

const moveSLRegex = /\/\/ Move Stop Loss to Breakeven[\s\S]*?\/\/ RESET ACCOUNT/;
code = code.replace(moveSLRegex, '// RESET ACCOUNT');

// 7. Remove setActivePositions from handleResetAccount
code = code.replace(/setActivePositions\(\[\]\);\n/g, '');

// 8. Remove activePositionsWithPnl
const activePosWithPnlRegex = /\/\/ Compute Live Position Price & PnL across ALL symbols using useMemo[\s\S]*?\/\/ Compute Total Account Equity dynamically using useMemo/;
code = code.replace(activePosWithPnlRegex, '// Compute Total Account Equity dynamically using useMemo');

// 9. Update accountWithEquity
code = code.replace(/const totalUnrealized = activePositionsWithPnl\.reduce\(\(acc, pos\) => acc \+ \(pos\.unrealizedPnlUsd \|\| 0\) \+ pos\.marginUsd, 0\);/g, 'const totalUnrealized = bitunixPositions.reduce((acc, pos) => acc + (pos.unrealizedPnlUsd || 0), 0);');

// 10. Remove Auto Take-Profit / Stop-Loss Execution Checker
const autoTPRegex = /\/\/ Auto Take-Profit \/ Stop-Loss Execution Checker across ALL open positions[\s\S]*?\/\/ Auto-sync Bitunix positions every 15 seconds if connected/;
code = code.replace(autoTPRegex, '// Auto-sync Bitunix positions every 15 seconds if connected');

// 11. Fix component props
code = code.replace(/activePositions={activePositionsWithPnl}/g, 'activePositions={[]}');
// Change Header
code = code.replace(/activePositionsCount={activePositionsWithPnl.length}/g, 'activePositionsCount={bitunixPositions.length}');

fs.writeFileSync('src/App.tsx.new', code);
