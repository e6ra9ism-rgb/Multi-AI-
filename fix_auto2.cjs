const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const refCode = `
  const handleRequestMultiAgentSignalRef = useRef(handleRequestMultiAgentSignal);
  useEffect(() => {
    handleRequestMultiAgentSignalRef.current = handleRequestMultiAgentSignal;
  }, [handleRequestMultiAgentSignal]);
`;

code = code.replace(/  \/\/ Setup WebSocket real-time live streaming/, refCode + '\n  // Setup WebSocket real-time live streaming');

// Now replace handleRequestMultiAgentSignal() calls inside the websocket block
code = code.replace(/handleRequestMultiAgentSignal\(\)\.finally/g, 'handleRequestMultiAgentSignalRef.current().finally');

// Also update the dependency arrays
code = code.replace(/}, \[symbol, interval, handleRequestMultiAgentSignal\]\);/g, '}, [symbol, interval]);');
code = code.replace(/}, \[account\.autoTraderActive, handleRequestMultiAgentSignal\]\);/g, '}, [account.autoTraderActive]);');

fs.writeFileSync('src/App.tsx', code);
