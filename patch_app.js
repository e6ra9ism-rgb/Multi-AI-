const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove activePositions state
code = code.replace(/const \[activePositions, setActivePositions\] = useState<PaperPosition\[\]>\(\[\]\);\n/g, '');
code = code.replace(/const activePositionsRef = useRef\(activePositions\);\n/g, '');
code = code.replace(/activePositionsRef\.current = activePositions;\n/g, '');

// Save to disk
fs.writeFileSync('src/App.tsx', code);
