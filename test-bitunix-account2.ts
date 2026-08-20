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

    let sigStr = "";
    if (body) {
      sigStr = `${nonce}${timestamp}${cleanApiKey}${JSON.stringify(body)}`;
    } else {
      sigStr = `${nonce}${timestamp}${cleanApiKey}${queryStr}`;
    }

    const h1 = crypto.createHmac("sha256", cleanSecretKey).update(sigStr).digest("hex");
    const signature = crypto.createHmac("sha256", cleanSecretKey).update(h1).digest("hex");

    return {
      headers: {
        "Content-Type": "application/json",
        "api-key": cleanApiKey,
        timestamp,
        nonce,
        sign: signature,
      },
      queryStr,
    };
}

async function run() {
    const p1 = createBitunixAuthHeaders(apiKey, secretKey, { marginCoin: "USDT" });
    const r1 = await fetch(`${BITUNIX_FUTURES_BASE_URL}/api/v1/futures/account?${p1.queryStr}`, { method: "GET", headers: p1.headers });
    console.log("Account w/ USDT:", await r1.json());
    
    const p2 = createBitunixAuthHeaders(apiKey, secretKey, {});
    const r2 = await fetch(`${BITUNIX_FUTURES_BASE_URL}/api/v1/futures/account`, { method: "GET", headers: p2.headers });
    console.log("Account no params:", await r2.json());
}
run();
