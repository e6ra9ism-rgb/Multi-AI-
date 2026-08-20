import crypto from "crypto";

const BITUNIX_FUTURES_BASE_URL = "https://fapi.bitunix.com";
const apiKey = "dc75458adfbfea0c20c96e76bada0613";
const secretKey = "c4a3501a3debb0f33dfdaea9ed07d8d2"; // dummy

function createBitunixAuthHeaders(apiKey: string, secretKey: string, queryParams: Record<string, any> = {}, body: any = null) {
    const cleanApiKey = (apiKey || "").trim();
    const cleanSecretKey = (secretKey || "").trim();
    const nonce = crypto.randomBytes(16).toString("hex");
    const timestamp = Date.now().toString();
    const queryKeys = Object.keys(queryParams).sort();
    const queryStr = queryKeys.map((key) => `${key}=${queryParams[key]}`).join("&");
    let sigStr = body ? `${nonce}${timestamp}${cleanApiKey}${JSON.stringify(body)}` : `${nonce}${timestamp}${cleanApiKey}${queryStr}`;
    const h1 = crypto.createHmac("sha256", cleanSecretKey).update(sigStr).digest("hex");
    const signature = crypto.createHmac("sha256", cleanSecretKey).update(h1).digest("hex");
    return {
      headers: { "Content-Type": "application/json", "api-key": cleanApiKey, timestamp, nonce, sign: signature },
      queryStr,
    };
}

async function run() {
    const endpoints = [
        "/api/v1/futures/account",
        "/api/v1/futures/account/balance",
        "/api/v1/futures/account/assets",
        "/api/v1/futures/user/account",
        "/api/v1/futures/assets",
        "/api/v1/futures/wallet/balance",
        "/api/v1/futures/user/balance",
        "/api/v1/user/account",
        "/api/v1/user/balance",
    ];
    for (const ep of endpoints) {
        const p = createBitunixAuthHeaders(apiKey, secretKey, { marginCoin: "USDT" });
        const r = await fetch(`${BITUNIX_FUTURES_BASE_URL}${ep}?${p.queryStr}`, { method: "GET", headers: p.headers });
        console.log(`[${ep}] w/ marginCoin:`, await r.json());
        
        const p2 = createBitunixAuthHeaders(apiKey, secretKey, {});
        const r2 = await fetch(`${BITUNIX_FUTURES_BASE_URL}${ep}`, { method: "GET", headers: p2.headers });
        console.log(`[${ep}] no params:`, await r2.json());
    }
}
run();
