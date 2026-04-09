import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import Decimal from "decimal.js";
import { SUI_NETWORK, COMPLIANCE_ID } from "../../../../lib/constants";

const POOL_ID = process.env.NEXT_PUBLIC_CETUS_NUTMEG_POOL_ID;
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
    const { direction, amount, senderAddress } = await req.json();

    if (!direction || !amount || !senderAddress) {
      return Response.json({ error: "Missing params" }, { status: 400 });
    }

    const sdk = getCetusSDK(senderAddress);
    const suiClient = getSuiClient();

    const pool = await sdk.Pool.getPool(POOL_ID);
    if (!pool) {
      return Response.json({ error: "Pool not found" }, { status: 404 });
    }

    // Compliance check — query registry directly
    try {
      const regObj = await suiClient.getObject({
        id: COMPLIANCE_ID,
        options: { showContent: true },
      });
      const fields = regObj.data?.content?.fields || {};
      if (fields.enforcement_enabled === true) {
        // Check if user is in the verified_users table
        // We query UserVerified events for this address
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::compliance::UserVerified`,
          },
          limit: 100,
          order: "descending",
        });
        const verified = events.data.some((e) => e.parsedJson?.user === senderAddress);
        if (!verified) {
          return Response.json(
            { error: "KYC verification required before trading." },
            { status: 403 },
          );
        }

        // Check frozen
        const frozenEvents = await suiClient.queryEvents({
          query: { MoveEventType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::compliance::UserFrozen` },
          limit: 100,
        });
        const unfrozenEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::compliance::UserUnfrozen`,
          },
          limit: 100,
        });
        const frozenSet = new Set();
        for (const e of frozenEvents.data) frozenSet.add(e.parsedJson?.user);
        for (const e of unfrozenEvents.data) frozenSet.delete(e.parsedJson?.user);
        if (frozenSet.has(senderAddress)) {
          return Response.json(
            { error: "Your account is frozen. Contact the platform admin." },
            { status: 403 },
          );
        }
      }
    } catch (err) {
      console.warn("Compliance check skipped:", err.message);
    }

    // coin_type_a = NUTMEG, coin_type_b = USDC
    // sell NUTMEG = a2b = true (price goes DOWN → use MIN limit)
    // buy NUTMEG  = a2b = false (price goes UP → use MAX limit)
    const a2b = direction === "sell";
    const amountRaw = new Decimal(amount).mul(10 ** DECIMALS).toFixed(0);

    // Get quote from SDK (this works reliably)
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
    console.log("Pre-swap:", { direction, amountIn: amountRaw, amountOut: estimatedOut });

    if (estimatedOut === "0") {
      return Response.json({ error: "Insufficient liquidity" }, { status: 400 });
    }

    const amountLimit = new Decimal(estimatedOut).mul(0.99).toFixed(0);

    // Build swap payload using Cetus SDK (now uses same @mysten/sui version)
    const swapPayload = await sdk.Swap.createSwapPayload({
      pool_id: pool.id,
      coin_type_a: pool.coin_type_a,
      coin_type_b: pool.coin_type_b,
      a2b,
      by_amount_in: true,
      amount: amountRaw,
      amount_limit: amountLimit,
    });

    // Build transaction bytes — SDK and our code now share the same Transaction class
    swapPayload.setSender(senderAddress);
    const txBytes = await swapPayload.build({ client: suiClient });
    const txBase64 = Buffer.from(txBytes).toString("base64");

    return Response.json({
      txBytes: txBase64,
      quote: {
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
