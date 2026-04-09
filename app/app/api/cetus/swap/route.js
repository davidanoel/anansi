import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import Decimal from "decimal.js";
import { SUI_NETWORK, TOKEN_REGISTRY, USDC_TYPE } from "../../../../lib/constants";

const DECIMALS = 6;

function getCetusSDK(senderAddress) {
  const sdk = CetusClmmSDK.createSDK({
    env: SUI_NETWORK === "mainnet" ? "mainnet" : "testnet",
    full_rpc_url: process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io/",
  });
  sdk.setSenderAddress(senderAddress);
  return sdk;
}

function getSuiClient() {
  return new SuiJsonRpcClient({
    network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
    url: process.env.SUI_RPC_URL || getJsonRpcFullnodeUrl("testnet"),
  });
}

export async function POST(req) {
  try {
    const { direction, amount, senderAddress, token } = await req.json();

    if (!direction || !amount || !senderAddress) {
      return Response.json({ error: "Missing direction, amount, or senderAddress" }, { status: 400 });
    }

    // Look up token from registry (default to NUTMEG for backward compatibility)
    const tokenSymbol = token || "NUTMEG";
    const tokenConfig = TOKEN_REGISTRY[tokenSymbol];

    if (!tokenConfig) {
      return Response.json({ error: `Unknown token: ${tokenSymbol}` }, { status: 400 });
    }

    if (!tokenConfig.poolId) {
      return Response.json({ error: `No DEX pool configured for ${tokenSymbol}. Set NEXT_PUBLIC_TOKEN_${tokenSymbol}_POOL.` }, { status: 400 });
    }

    const sdk = getCetusSDK(senderAddress);
    const suiClient = getSuiClient();

    // Compliance check (when enforcement is enabled)
    try {
      const complianceId = process.env.NEXT_PUBLIC_COMPLIANCE_ID;
      if (complianceId && complianceId !== '0x0') {
        const regObj = await suiClient.getObject({ id: complianceId, options: { showContent: true } });
        const fields = regObj.data?.content?.fields || {};
        if (fields.enforcement_enabled === true) {
          const pkgId = process.env.NEXT_PUBLIC_PACKAGE_ID;
          const events = await suiClient.queryEvents({
            query: { MoveEventType: `${pkgId}::compliance::UserVerified` }, limit: 100, order: 'descending',
          });
          const verified = events.data.some(e => e.parsedJson?.user === senderAddress);
          if (!verified) {
            return Response.json({ error: "KYC verification required before trading." }, { status: 403 });
          }
          const frozenEvents = await suiClient.queryEvents({ query: { MoveEventType: `${pkgId}::compliance::UserFrozen` }, limit: 100 });
          const unfrozenEvents = await suiClient.queryEvents({ query: { MoveEventType: `${pkgId}::compliance::UserUnfrozen` }, limit: 100 });
          const frozenSet = new Set();
          for (const e of frozenEvents.data) frozenSet.add(e.parsedJson?.user);
          for (const e of unfrozenEvents.data) frozenSet.delete(e.parsedJson?.user);
          if (frozenSet.has(senderAddress)) {
            return Response.json({ error: "Your account is frozen. Contact the platform admin." }, { status: 403 });
          }
        }
      }
    } catch (err) {
      console.warn("Compliance check skipped:", err.message);
    }

    const pool = await sdk.Pool.getPool(tokenConfig.poolId);
    if (!pool) {
      return Response.json({ error: `Pool not found for ${tokenSymbol}` }, { status: 404 });
    }

    // Determine swap direction based on pool coin ordering
    // Pool coin_type_a and coin_type_b are set at pool creation
    // "sell" = swap token → USDC, "buy" = swap USDC → token
    const tokenIsA = pool.coin_type_a === tokenConfig.type;
    const a2b = direction === "sell" ? tokenIsA : !tokenIsA;

    const amountRaw = new Decimal(amount).mul(10 ** DECIMALS).toFixed(0);

    console.log("Swap:", { token: tokenSymbol, direction, a2b, amount: amountRaw, pool: tokenConfig.poolId.slice(0, 12) });

    const res = await sdk.Swap.preSwap({
      pool: pool,
      current_sqrt_price: pool.current_sqrt_price,
      coin_type_a: pool.coin_type_a,
      coin_type_b: pool.coin_type_b,
      decimals_a: DECIMALS,
      decimals_b: DECIMALS,
      a2b,
      by_amount_in: true,
      amount: amountRaw,
    });

    const estimatedOut = res.estimated_amount_out?.toString() || "0";
    console.log("Quote:", { amountIn: amountRaw, amountOut: estimatedOut });

    if (estimatedOut === "0") {
      return Response.json({ error: "Insufficient liquidity in pool" }, { status: 400 });
    }

    const amountLimit = new Decimal(estimatedOut).mul(0.99).toFixed(0);

    const swapPayload = await sdk.Swap.createSwapPayload({
      pool_id: pool.id,
      coin_type_a: pool.coin_type_a,
      coin_type_b: pool.coin_type_b,
      a2b,
      by_amount_in: true,
      amount: amountRaw,
      amount_limit: amountLimit,
    });

    swapPayload.setSender(senderAddress);
    const txBytes = await swapPayload.build({ client: suiClient });
    const txBase64 = Buffer.from(txBytes).toString("base64");

    return Response.json({
      txBytes: txBase64,
      quote: {
        token: tokenSymbol,
        amountIn: new Decimal(amountRaw).div(10 ** DECIMALS).toFixed(DECIMALS),
        estimatedOut: new Decimal(estimatedOut).div(10 ** DECIMALS).toFixed(DECIMALS),
        direction,
      },
    });
  } catch (error) {
    console.error("Swap error:", error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
