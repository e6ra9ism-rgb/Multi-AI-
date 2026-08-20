const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
let bak = fs.readFileSync('src/App.tsx.bak', 'utf8');

const loadMarketDataBlock = bak.match(/\/\/ Fetch all market data including Dual-Exchange Ticker and Dual-Depth[\s\S]*?clearInterval\(intervalId\);\n    };\n  \}, \[loadMarketData\]\);/)[0];

const insertTarget = '  // Periodic 1-minute candle-close synchronization safety loop';
code = code.replace(insertTarget, loadMarketDataBlock + '\n\n' + insertTarget);

fs.writeFileSync('src/App.tsx', code);
