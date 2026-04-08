import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import Decimal from "decimal.js";
import { SUI_NETWORK } from "../../../../lib/constants";

const POOL_ID = process.env.NEXT_PUBLIC_CETUS_NUTMEG_POOL_ID;
const CETUS_PKG = "0x5372d555ac734e272659136c2a0cd3227f9b92de67c80dc11250307268af2db8";
const GLOBAL_CONFIG = "0xc6273f844b4bc258952c4e477697aa12c918c8e08106fac6b934811298c9820a";
const DECIMALS = 6;

// Standard CLMM sqrt price bounds
const MIN_SQRT_PRICE = "4295048016";
const MAX_SQRT_PRICE = "79226673515401279992447579055";

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

    // Build flash swap transaction with our own Transaction class
    const tx = new Transaction();
    tx.setSender(senderAddress);

    const inputCoinType = a2b ? pool.coin_type_a : pool.coin_type_b;
    const outputCoinType = a2b ? pool.coin_type_b : pool.coin_type_a;

    // a2b: price decreases → MIN limit; b2a: price increases → MAX limit
    const sqrtPriceLimit = a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE;

    // Get user's input coins
    const { data: coins } = await suiClient.getCoins({
      owner: senderAddress,
      coinType: inputCoinType,
    });
    if (!coins || coins.length === 0) {
      return Response.json({ error: `No ${a2b ? "NUTMEG" : "USDC"} in wallet` }, { status: 400 });
    }

    if (coins.length > 1) {
      const others = coins.slice(1).map((c) => tx.object(c.coinObjectId));
      tx.mergeCoins(tx.object(coins[0].coinObjectId), others);
    }

    // Split exact input amount from user's coin
    const [inputCoin] = tx.splitCoins(tx.object(coins[0].coinObjectId), [tx.pure.u64(amountRaw)]);

    // Convert input coin to Balance for repayment
    const [inputBalance] = tx.moveCall({
      target: "0x2::coin::into_balance",
      typeArguments: [inputCoinType],
      arguments: [inputCoin],
    });

    // Step 1: flash_swap — pool gives output balances + receipt
    const [balanceA, balanceB, receipt] = tx.moveCall({
      target: `${CETUS_PKG}::pool::flash_swap`,
      typeArguments: [pool.coin_type_a, pool.coin_type_b],
      arguments: [
        tx.object(GLOBAL_CONFIG),
        tx.object(POOL_ID),
        tx.pure.bool(a2b),
        tx.pure.bool(true),
        tx.pure.u64(amountRaw),
        tx.pure.u128(sqrtPriceLimit),
        tx.object("0x6"),
      ],
    });

    // Create zero balance for the side we don't owe
    const [zeroBalance] = tx.moveCall({
      target: "0x2::balance::zero",
      typeArguments: [outputCoinType],
      arguments: [],
    });

    // Step 2: repay_flash_swap
    // a2b: owe NUTMEG (A), got USDC (B) → repay(inputBalance, zeroBalance)
    // b2a: owe USDC (B), got NUTMEG (A) → repay(zeroBalance, inputBalance)
    tx.moveCall({
      target: `${CETUS_PKG}::pool::repay_flash_swap`,
      typeArguments: [pool.coin_type_a, pool.coin_type_b],
      arguments: [
        tx.object(GLOBAL_CONFIG),
        tx.object(POOL_ID),
        a2b ? inputBalance : zeroBalance,
        a2b ? zeroBalance : inputBalance,
        receipt,
      ],
    });

    // Step 3: Convert output balance to coin and send to user
    // a2b: balanceB is output (USDC), balanceA is empty
    // b2a: balanceA is output (NUTMEG), balanceB is empty
    const outputBalance = a2b ? balanceB : balanceA;
    const emptyBalance = a2b ? balanceA : balanceB;

    const [outputCoin] = tx.moveCall({
      target: "0x2::coin::from_balance",
      typeArguments: [outputCoinType],
      arguments: [outputBalance],
    });
    tx.transferObjects([outputCoin], tx.pure.address(senderAddress));

    // Destroy the empty balance
    tx.moveCall({
      target: "0x2::balance::destroy_zero",
      typeArguments: [a2b ? pool.coin_type_a : pool.coin_type_b],
      arguments: [emptyBalance],
    });

    // Build with our compatible client
    const txBytes = await tx.build({ client: suiClient });
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
