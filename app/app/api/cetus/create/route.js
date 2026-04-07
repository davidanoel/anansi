import Decimal from "decimal.js";
import { initCetusSDK, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { adminExecute, getAdminAddress } from "../../../../lib/admin-signer";
import {
  USDC_TYPE,
  NUTMEG_TYPE,
  SUI_NETWORK,
  USDC_DECIMALS,
  NUTMEG_DECIMALS,
} from "../../../../lib/constants";

const CETUS_TESTNET_FALLBACK = {
  // Latest CLMM config IDs from Cetus dev docs (testnet).
  // Can be overridden via env if Cetus rotates again.
  globalConfigId: "0xc6273f844b4bc258952c4e477697aa12c918c8e08106fac6b934811298c9820a",
  poolsId: "0x20a086e6fa0741b3ca77d033a65faf0871349b986ddbdde6fa1d85d78a5f4222",
};

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const usdcAmount = Number(body.usdcAmount) || 10;
    const nutmegAmount = Number(body.nutmegAmount) || 10;

    if (usdcAmount <= 0 || nutmegAmount <= 0) {
      return Response.json({ error: "Amounts must be greater than zero." }, { status: 400 });
    }

    // 1️⃣ Sort coins lexicographically (Cetus requires ordered pair)
    let coinTypeA = USDC_TYPE;
    let coinTypeB = NUTMEG_TYPE;
    if (coinTypeA > coinTypeB) [coinTypeA, coinTypeB] = [coinTypeB, coinTypeA];
    const fixAmountA = coinTypeA === USDC_TYPE;

    // 2️⃣ Decimals and initial price
    const decimalsA = coinTypeA === USDC_TYPE ? USDC_DECIMALS : NUTMEG_DECIMALS;
    const decimalsB = coinTypeA === USDC_TYPE ? NUTMEG_DECIMALS : USDC_DECIMALS;

    // Price is coinB per coinA (for sorted pair)
    const initialPrice = fixAmountA
      ? new Decimal(nutmegAmount).div(usdcAmount)
      : new Decimal(usdcAmount).div(nutmegAmount);
    const sqrtPriceX64 = TickMath.priceToSqrtPriceX64(initialPrice, decimalsA, decimalsB);

    // 4️⃣ Ticks
    const sqrtPriceBN = BigInt(sqrtPriceX64.toString());
    const currentTick =
      TickMath.sqrtPriceX64ToTickIndex(sqrtPriceBN).toNumber?.() ??
      Number(TickMath.sqrtPriceX64ToTickIndex(sqrtPriceBN));
    const tickSpacing = 60;
    const tickLower = TickMath.getPrevInitializableTickIndex(currentTick, tickSpacing);
    const tickUpper = TickMath.getNextInitializableTickIndex(currentTick, tickSpacing);

    // 5️⃣ Amounts (human → raw)
    const rawAmountA = fixAmountA
      ? BigInt(Math.floor(usdcAmount * 10 ** decimalsA))
      : BigInt(Math.floor(nutmegAmount * 10 ** decimalsB));
    const rawAmountB = fixAmountA
      ? BigInt(Math.floor(nutmegAmount * 10 ** decimalsB))
      : BigInt(Math.floor(usdcAmount * 10 ** decimalsA));

    // 6️⃣ Fetch real metadata object IDs (required by Cetus create_pool_v2 wrappers)
    const sdk = initCetusSDK({
      network: SUI_NETWORK,
      fullNodeUrl: process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io",
      wallet: getAdminAddress(),
    });

    // Cetus testnet config IDs rotate; allow runtime override to avoid stale SDK defaults.
    const clmmGlobalConfigId =
      process.env.CETUS_CLMM_GLOBAL_CONFIG_ID ||
      (SUI_NETWORK === "testnet" ? CETUS_TESTNET_FALLBACK.globalConfigId : undefined);
    const clmmPoolsId =
      process.env.CETUS_CLMM_POOLS_ID ||
      (SUI_NETWORK === "testnet" ? CETUS_TESTNET_FALLBACK.poolsId : undefined);

    if (clmmGlobalConfigId) sdk.sdkOptions.clmm_pool.config.global_config_id = clmmGlobalConfigId;
    if (clmmPoolsId) sdk.sdkOptions.clmm_pool.config.pools_id = clmmPoolsId;

    const [metaA, metaB] = await Promise.all([
      sdk.fullClient.getCoinMetadata({ coinType: coinTypeA }),
      sdk.fullClient.getCoinMetadata({ coinType: coinTypeB }),
    ]);

    if (!metaA?.id || !metaB?.id) {
      throw new Error("Failed to fetch coin metadata object IDs for pool creation.");
    }

    // 7️⃣ Build pool-create tx via Cetus SDK helper (correct function signature)
    const tx = await sdk.Pool.createPoolTransactionPayload({
      coinTypeA,
      coinTypeB,
      tick_spacing: tickSpacing,
      initialize_sqrt_price: sqrtPriceBN.toString(),
      uri: "",
      amount_a: rawAmountA.toString(),
      amount_b: rawAmountB.toString(),
      fix_amount_a: fixAmountA,
      tick_lower: tickLower,
      tick_upper: tickUpper,
      metadata_a: metaA.id,
      metadata_b: metaB.id,
      slippage: 0.01,
    });

    // 8️⃣ Sign & execute with server-side admin key
    tx.setGasBudget(100_000_000n); // 0.1 SUI
    const result = await adminExecute(tx);

    return Response.json({
      success: true,
      digest: result.digest,
      effects: result.effects,
    });
  } catch (error) {
    console.error("Cetus Create Pool Error:", error);
    return Response.json(
      {
        error: error.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
