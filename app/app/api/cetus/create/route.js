import Decimal from "decimal.js";
import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { getAdminAddress, adminExecute } from "../../../../lib/admin-signer";
import { SUI_NETWORK, SUI_RPC_URL, USDC_TYPE, getToken } from "../../../../lib/constants";

const COIN_DECIMALS = 6;
const FULL_RANGE_PARAMS = { is_full_range: true };

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Get the dynamic symbol from the frontend
    const symbol = body.symbol;
    if (!symbol) {
      return Response.json({ error: "No token symbol provided." }, { status: 400 });
    }

    // 2. Look up the token's fully qualified CoinType from constants
    const token = getToken(symbol);
    if (!token || !token.type) {
      return Response.json(
        { error: `Could not find coinType configuration for ${symbol}` },
        { status: 400 },
      );
    }
    const COMMODITY_TYPE = token.type;

// Accept custom amounts from the frontend, fallback to 10 if missing
    const usdcAmount = Number(body.usdcAmount) || 10;
    const commodityAmount = Number(body.commodityAmount) || 10;

    const admin = getAdminAddress();
    const network = SUI_NETWORK === "mainnet" ? "mainnet" : "testnet";

    // Cetus v2 expects coin A to be the lexicographically larger fully-qualified type.
    const coin_type_a = USDC_TYPE > COMMODITY_TYPE ? USDC_TYPE : COMMODITY_TYPE;
    const coin_type_b = coin_type_a === USDC_TYPE ? COMMODITY_TYPE : USDC_TYPE;
    const fix_amount_a = coin_type_a === USDC_TYPE;

    const currentPrice = fix_amount_a
      ? new Decimal(commodityAmount).div(usdcAmount)
      : new Decimal(usdcAmount).div(commodityAmount);
    const fixedCoinAmount = fix_amount_a ? usdcAmount : commodityAmount;

    const sdk = CetusClmmSDK.createSDK({
      env: network,
      full_rpc_url: process.env.SUI_RPC_URL || SUI_RPC_URL || getJsonRpcFullnodeUrl(network),
    });

    if (typeof sdk.setSenderAddress === "function") {
      sdk.setSenderAddress(admin);
    } else {
      sdk.senderAddress = admin;
    }

    console.log(`Using Cetus V2 SDK to deploy AMM for ${symbol}...`);

    const calculate_result = await sdk.Pool.calculateCreatePoolWithPrice({
      tick_spacing: 60,
      current_price: currentPrice.toString(),
      coin_amount: new Decimal(fixedCoinAmount).mul(10 ** COIN_DECIMALS).toFixed(0),
      fix_amount_a,
      add_mode_params: FULL_RANGE_PARAMS,
      coin_decimals_a: COIN_DECIMALS,
      coin_decimals_b: COIN_DECIMALS,
      price_base_coin: "coin_a",
      slippage: 0.01,
    });

    const txb = await sdk.Pool.createPoolWithPricePayload({
      tick_spacing: 60,
      calculate_result,
      add_mode_params: FULL_RANGE_PARAMS,
      coin_type_a,
      coin_type_b,
      uri: "",
    });

    txb.setGasBudget(100_000_000n);

    // 3. Execute as Admin
    const result = await adminExecute(txb);

    // 4. Extract the newly created Pool ID from the transaction changes
    let poolId = null;
    if (result.objectChanges) {
      const poolChange = result.objectChanges.find(
        (change) => change.type === "created" && change.objectType?.includes("::pool::Pool"),
      );
      if (poolChange) {
        poolId = poolChange.objectId;
      }
    }

    return Response.json({
      success: true,
      digest: result.digest,
      poolId: poolId || "Pool created, but ID not found in response.",
      message: `Cetus V2 CLMM pool for ${symbol} successfully deployed!`,
    });
  } catch (error) {
    console.error("Cetus V2 Deployment Error:", error);
    return Response.json(
      {
        error: error.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
