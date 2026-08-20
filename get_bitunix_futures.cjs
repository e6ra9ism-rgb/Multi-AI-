const https = require('https');

https.get('https://www.bitunix.com/api-docs/assets/futures_trade_place_order.md.BEWc9vFy.js', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log(data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
