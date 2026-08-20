const https = require('https');

https.get('https://www.bitunix.com/api-docs/spots/en_us/order/', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const match = data.match(/1\. Place order.*?(?=<h4 id="2-batch-order">)/s);
    if(match) {
      console.log(match[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 2000));
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
