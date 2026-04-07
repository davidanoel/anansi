import { JsonRpcProvider, TransactionBlock } from "@mysten/sui.js";
import Decimal from "decimal.js";
import { getAdminAddress, getAdminSigner } from "../../../../lib/admin-signer";
import { USDC_TYPE, NUTMEG_TYPE, SUI_NETWORK } from "../../../../lib/constants";
import { TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const usdcAmount = Number(body.usdcAmount) || 10;
    const nutmegAmount = Number(body.nutmegAmount) || 10;

    const provider = new JsonRpcProvider({ url: SUI_NETWORK.rpcUrl });
    const signer = getAdminSigner(); // your Ed25519 signer

    // 1️⃣ Sort coins lexicographically
    let coinTypeA = USDC_TYPE;
    let coinTypeB = NUTMEG_TYPE;
    if (coinTypeA > coinTypeB) [coinTypeA, coinTypeB] = [coinTypeB, coinTypeA];
    const fixAmountA = coinTypeA === USDC_TYPE;

    // 2️⃣ Decimals
    const decimalsA = 6;
    const decimalsB = 6;

    // 3️⃣ Initial price
    const initialPrice = new Decimal(1);
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

    // 6️⃣ Build transaction manually
    const tx = new TransactionBlock();
    tx.moveCall({
      target:
        "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::clmm_pool::create_pool",
      arguments: [
        tx.pure(coinTypeA),
        tx.pure(coinTypeB),
        tx.pure(tickSpacing), // u64
        tx.pure(sqrtPriceBN), // u128
        tx.pure(""), // uri
        tx.pure(rawAmountA), // u64
        tx.pure(rawAmountB), // u64
        tx.pure(fixAmountA), // bool
        tx.pure(tickLower, "i32"), // ✅ i32
        tx.pure(tickUpper, "i32"), // ✅ i32
        tx.pure(getAdminAddress()), // metadata_a placeholder
        tx.pure(getAdminAddress()), // metadata_b placeholder
      ],
    });

    tx.setGasBudget(100_000_000); // 0.1 SUI

    // 7️⃣ Sign & execute
    const result = await signer.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: { showEffects: true },
    });

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
