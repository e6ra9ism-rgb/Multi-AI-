const fs = require('fs');
let code = fs.readFileSync('src/components/MultiAgentTraderModal.tsx', 'utf8');

const tab4Regex = /\{\/\* TAB 4: 3X LIVE PORTFOLIO & POSITIONS \*\/\}[\s\S]*?\{\/\* TAB 5: CLOSED TRADE HISTORY \*\/\}/;
code = code.replace(tab4Regex, '{/* TAB 5: CLOSED TRADE HISTORY */}');

// Also line 2356:
code = code.replace(/\{activePositions\.length\} Synced/g, 'Synced');

fs.writeFileSync('src/components/MultiAgentTraderModal.tsx', code);
