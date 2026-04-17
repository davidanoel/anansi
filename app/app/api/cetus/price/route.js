import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import Decimal from "decimal.js";
import { SUI_NETWORK, TOKEN_REGISTRY } from "../../../../lib/constants";

const DECIMALS = 6;
const ONE_TOKEN = new Decimal(10).pow(DECIMALS).toString(); // 1 token in smallest units

// Simple in-memory cache (prices don't change drastically second-to-second)
let priceCache = {};
let cacheTimestamp = 0;
const CACHE_TTL_MS = 15_000; // 15 seconds

function getSDK() {
  return CetusClmmSDK.createSDK({
    env: SUI_NETWORK === "mainnet" ? "mainnet" : "testnet",
    full_rpc_url: process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io/",
  });
}

async function fetchPrice(sdk, tokenConfig) {
  if (!tokenConfig.poolId) return null;

  try {
    const pool = await sdk.Pool.getPool(tokenConfig.poolId);
    if (!pool) return null;

    // Determine direction: selling 1 token → how much USDC do we get?
    const tokenIsA = pool.coin_type_a === tokenConfig.type;
    const a2b = tokenIsA; // sell token = swap toward USDC

    const res = await sdk.Swap.preSwap({
      pool: pool,
      current_sqrt_price: pool.current_sqrt_price,
      coin_type_a: pool.coin_type_a,
      coin_type_b: pool.coin_type_b,
      decimals_a: DECIMALS,
      decimals_b: DECIMALS,
      a2b,
      by_amount_in: true,
      amount: ONE_TOKEN,
    });

    const amountOut = res.estimated_amount_out?.toString() || "0";
    const price = new Decimal(amountOut).div(10 ** DECIMALS).toNumber();

    return {
      symbol: tokenConfig.symbol,
      priceUsdc: price,
      poolId: tokenConfig.poolId,
      liquidityA: pool.coin_amount_a || "0",
      liquidityB: pool.coin_amount_b || "0",
    };
  } catch (err) {
    console.warn(`Price fetch failed for ${tokenConfig.symbol}:`, err.message);
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedToken = searchParams.get("token"); // optional: single token

    const now = Date.now();

    // Return cache if fresh
    if (now - cacheTimestamp < CACHE_TTL_MS && Object.keys(priceCache).length > 0) {
      if (requestedToken) {
        return Response.json({ prices: { [requestedToken]: priceCache[requestedToken] || null } });
      }
      return Response.json({ prices: priceCache });
    }

    const sdk = getSDK();
    const tradableTokens = Object.values(TOKEN_REGISTRY).filter((t) => t.poolId);

    // Fetch all prices in parallel
    const results = await Promise.all(
      tradableTokens.map((token) => fetchPrice(sdk, token))
    );

    // Build price map
    const prices = {};
    for (const result of results) {
      if (result) {
        prices[result.symbol] = result;
      }
    }

    // Update cache
    priceCache = prices;
    cacheTimestamp = now;

    if (requestedToken) {
      return Response.json({ prices: { [requestedToken]: prices[requestedToken] || null } });
    }

    return Response.json({ prices });
  } catch (error) {
    console.error("Price fetch error:", error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
