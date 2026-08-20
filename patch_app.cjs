const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove Paper Position State & Effects
code = code.replace(/const \[activePositions, setActivePositions\] = useState<PaperPosition\[\]>\(\[\]\);\n?/g, '');
code = code.replace(/const activePositionsRef = useRef\(activePositions\);\n?/g, '');
code = code.replace(/activePositionsRef\.current = activePositions;\n?/g, '');

// Replace existingPos check inside handleRequestMultiAgentSignal
code = code.replace(/const existingPos = activePositions\.find\(\(p\) => p\.symbol === symbol\);/g, 'const existingPos = bitunixPositions.find((p) => p.symbol === symbol);');

// 2. Refactor handleExecuteTrade to NOT create a PaperPosition, just execute on Bitunix.
const executeTradeStart = code.indexOf('const handleExecuteTrade = useCallback((params: {');
const executeTradeEndRegex = /        if \(res\.success\) \{([\s\S]*?)\}\);/g;
// Actually, it's easier to just overwrite handleExecuteTrade using sed or string replacement.
fs.writeFileSync('src/App.tsx.bak', code);
