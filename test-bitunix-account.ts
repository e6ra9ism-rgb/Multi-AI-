import crypto from "crypto";
const BITUNIX_FUTURES_BASE_URL = "https://fapi.bitunix.com";

function createBitunixAuthHeaders(apiKey: string, secretKey: string, queryParams: Record<string, any> = {}, body: any = null) {
    const cleanApiKey = (apiKey || "").trim();
    const cleanSecretKey = (secretKey || "").trim();
    const nonce = crypto.randomBytes(16).toString("hex");
    const timestamp = Date.now().toString();

    // 1. Sort Query Params
    const queryKeys = Object.keys(queryParams).sort();
    const queryStr = queryKeys.map((key) => `${key}=${queryParams[key]}`).join("&");

    // 2. Build Signature String
    let sigStr = "";
    if (body) {
      const bodyStr = JSON.stringify(body);
      sigStr = `${nonce}${timestamp}${cleanApiKey}${bodyStr}`;
    } else {
      sigStr = `${nonce}${timestamp}${cleanApiKey}${queryStr}`;
    }

    // 3. Double SHA-256 Hashing
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
      bodyStr: body ? JSON.stringify(body) : undefined,
    };
}

async function test() {
    const apiKey = "dc75458adfbfea0c20c96e76bada0613";
    const secretKey = "c4a3501a3debb0f33dfdaea9ed07d8d2"; // assuming this is a test or we can just send whatever and get an auth error to know the endpoint exists

    // Let's use the actual api key from the image, but we don't have the secret key fully. We can just test the signature logic. Wait, we don't have the secret key.
    // But we saw the /api/bitunix/account response in the proxy! 
    // The server already has the API key and secret in the process or from the request.
    // I can modify server.ts temporarily to print out what /api/v1/futures/account returns if I add marginCoin.
}
test();
