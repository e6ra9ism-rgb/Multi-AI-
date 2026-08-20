const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/  return \(\n    <div id="liquidity-terminal-app"/g, '  const handleOpenMultiAgentTrader = () => setShowMultiAgentModal(true);\n\n  return (\n    <div id="liquidity-terminal-app"');

fs.writeFileSync('src/App.tsx', code);
