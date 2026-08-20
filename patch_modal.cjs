const fs = require('fs');
let code = fs.readFileSync('src/components/MultiAgentTraderModal.tsx', 'utf8');

// Remove activePositions from props
code = code.replace(/activePositions: PaperPosition\[\];\n/g, '');
code = code.replace(/activePositions,\n/g, '');

// Remove unused prop types
code = code.replace(/onClosePosition: \([\s\S]*?\n/g, '');
code = code.replace(/onPartialTakeProfit: \([\s\S]*?\n/g, '');
code = code.replace(/onMoveStopToBreakeven: \([\s\S]*?\n/g, '');

code = code.replace(/onClosePosition,\n/g, '');
code = code.replace(/onPartialTakeProfit,\n/g, '');
code = code.replace(/onMoveStopToBreakeven,\n/g, '');

// Remove TAB 4 entirely (which uses activePositions)
const tab4Regex = /\{\/\* TAB 4: 3X LIVE PORTFOLIO & POSITIONS \*\/\}([\s\S]*?)\{\/\* TAB 5: BITUNIX REAL TRADING \*\/\}/;
code = code.replace(tab4Regex, '{/* TAB 5: BITUNIX REAL TRADING */}');

fs.writeFileSync('src/components/MultiAgentTraderModal.tsx', code);
