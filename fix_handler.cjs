const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/  return \(\n    <div className="flex h-screen bg/g, '  const handleOpenMultiAgentTrader = () => setShowMultiAgentModal(true);\n\n  return (\n    <div className="flex h-screen bg');

fs.writeFileSync('src/App.tsx', code);
