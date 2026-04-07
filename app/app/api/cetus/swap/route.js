import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import Decimal from "decimal.js";
import { SUI_NETWORK, NUTMEG_TYPE, USDC_TYPE } from "../../../../lib/constants";

const POOL_ID = process.env.NEXT_PUBLIC_CETUS_NUTMEG_POOL_ID;
const DECIMALS = 6;

function getSDK() {
  const sdk = CetusClmmSDK.createSDK({
    env: SUI_NETWORK === "mainnet" ? "mainnet" : "testnet",
    full_rpc_url:
      process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io/",
  });
  return sdk;
}

export async function POST(req) {
  try {
    const { direction, amount, senderAddress } = await req.json();

    if (!direction || !amount || !senderAddress) {
      return Response.json(
        { error: "Missing direction, amount, or senderAddress" },
        { status: 400 }
      );
    }

    if (!POOL_ID || POOL_ID === "0x0") {
      return Response.json(
        { error: "Cetus pool not configured. Set NEXT_PUBLIC_CETUS_NUTMEG_POOL_ID." },
        { status: 500 }
      );
    }

    const sdk = getSDK();

    // Set sender for the SDK
    if (typeof sdk.setSenderAddress === "function") {
      sdk.setSenderAddress(senderAddress);
    } else {
      sdk.senderAddress = senderAddress;
    }

    // Fetch pool
    const pool = await sdk.Pool.getPool(POOL_ID);
    if (!pool) {
      return Response.json({ error: "Pool not found" }, { status: 404 });
    }

    console.log("Pool fetched:", {
      address: pool.poolAddress,
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
      currentSqrtPrice: pool.current_sqrt_price,
    });

    // Determine swap direction
    // Pool: coin_a = USDC, coin_b = NUTMEG
    // sell NUTMEG → USDC = b2a (a2b = false)
    // buy NUTMEG with USDC = a2b (a2b = true)
    const a2b = direction === "buy"; // buy NUTMEG = swap USDC(A) → NUTMEG(B)
    const byAmountIn = true;

    // Amount in smallest units
    const amountInSmallest = new Decimal(amount)
      .mul(10 ** DECIMALS)
      .toFixed(0);

    console.log("Pre-swap params:", {
      direction,
      a2b,
      amount: amountInSmallest,
      sender: senderAddress,
    });

    // Pre-compute swap to get expected output
    const preSwapResult = await sdk.Swap.preSwap({
      pool,
      currentSqrtPrice: pool.current_sqrt_price,
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
      decimalsA: DECIMALS,
      decimalsB: DECIMALS,
      a2b,
      byAmountIn,
      amount: amountInSmallest,
    });

    console.log("Pre-swap result:", {
      estimatedAmountIn: preSwapResult.estimatedAmountIn?.toString(),
      estimatedAmountOut: preSwapResult.estimatedAmountOut?.toString(),
      estimatedFeeAmount: preSwapResult.estimatedFeeAmount?.toString(),
    });

    // Calculate minimum output with slippage tolerance (1%)
    const slippage = 0.01;
    const estimatedOut = new Decimal(
      preSwapResult.estimatedAmountOut?.toString() || "0"
    );
    const minOutput = estimatedOut.mul(1 - slippage).toFixed(0);

    // Build swap transaction
    const swapPayload = await sdk.Swap.createSwapTransactionPayload({
      pool_id: pool.poolAddress,
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
      a2b,
      by_amount_in: byAmountIn,
      amount: amountInSmallest,
      amount_limit: minOutput,
    });

    // Serialize the Transaction object (not built bytes) so client can sign
    const serialized = swapPayload.serialize();
    const txBase64 = Buffer.from(serialized).toString("base64");

    // Return serialized transaction + quote info
    return Response.json({
      txBytes: txBase64,
      quote: {
        amountIn: new Decimal(amountInSmallest).div(10 ** DECIMALS).toFixed(DECIMALS),
        estimatedOut: estimatedOut.div(10 ** DECIMALS).toFixed(DECIMALS),
        minOut: new Decimal(minOutput).div(10 ** DECIMALS).toFixed(DECIMALS),
        direction,
      },
    });
  } catch (error) {
    console.error("Swap build error:", error);
    return Response.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}
