import Decimal from "decimal.js";
import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { getAdminAddress, adminExecute } from "../../../../lib/admin-signer";
import { SUI_NETWORK, SUI_RPC_URL, USDC_TYPE, getToken } from "../../../../lib/constants";

const COIN_DECIMALS = 6;
const FULL_RANGE_PARAMS = { is_full_range: true };
const DECIMAL_SCALE = new Decimal(10).pow(COIN_DECIMALS);

function formatAmount(raw) {
  return new Decimal(raw).div(DECIMAL_SCALE).toFixed(COIN_DECIMALS);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const symbol = body.symbol;

    if (!symbol) {
      return Response.json({ error: "No token symbol provided." }, { status: 400 });
    }

    const token = getToken(symbol);
    if (!token || !token.type) {
      return Response.json(
        { error: `Could not find coinType configuration for ${symbol}` },
        { status: 400 },
      );
    }

    const tokenConfig = JSON.parse(process.env.NEXT_PUBLIC_TOKEN_CONFIG || "{}");
    const poolId = tokenConfig[symbol]?.pool;

    if (!poolId || poolId.trim() === "") {
      return Response.json({ error: `No active pool configured for ${symbol}` }, { status: 400 });
    }

    const usdcAmount = Number(body.usdcAmount) || 0;
    const preview = body.preview === true;

    if (usdcAmount <= 0) {
      return Response.json(
        { error: "USDC amount must be greater than zero." },
        { status: 400 },
      );
    }

    const admin = getAdminAddress();
    const network = SUI_NETWORK === "mainnet" ? "mainnet" : "testnet";

    const sdk = CetusClmmSDK.createSDK({
      env: network,
      full_rpc_url: process.env.SUI_RPC_URL || SUI_RPC_URL || getJsonRpcFullnodeUrl(network),
    });

    if (typeof sdk.setSenderAddress === "function") {
      sdk.setSenderAddress(admin);
    } else {
      sdk.senderAddress = admin;
    }

    const pool = await sdk.Pool.getPool(poolId);
    if (!pool) {
      return Response.json({ error: `Pool not found for ${symbol}` }, { status: 404 });
    }

    const fix_amount_a = pool.coin_type_a === USDC_TYPE;

    const calculate_result = await sdk.Position.calculateAddLiquidityResultWithPrice({
      pool_id: pool.id,
      slippage: 0.01,
      coin_amount: new Decimal(usdcAmount).mul(DECIMAL_SCALE).toFixed(0),
      fix_amount_a,
      add_mode_params: FULL_RANGE_PARAMS,
    });

    const estimatedUsdcRaw =
      pool.coin_type_a === USDC_TYPE
        ? calculate_result.coin_amount_a
        : calculate_result.coin_amount_b;
    const estimatedTokenRaw =
      pool.coin_type_a === token.type
        ? calculate_result.coin_amount_a
        : calculate_result.coin_amount_b;
    const maxUsdcRaw =
      pool.coin_type_a === USDC_TYPE
        ? calculate_result.coin_amount_limit_a
        : calculate_result.coin_amount_limit_b;
    const maxTokenRaw =
      pool.coin_type_a === token.type
        ? calculate_result.coin_amount_limit_a
        : calculate_result.coin_amount_limit_b;

    const quote = {
      estimatedUsdcAmount: formatAmount(estimatedUsdcRaw),
      estimatedTokenAmount: formatAmount(estimatedTokenRaw),
      maxUsdcAmount: formatAmount(maxUsdcRaw),
      maxTokenAmount: formatAmount(maxTokenRaw),
      tickLower: calculate_result.tick_lower,
      tickUpper: calculate_result.tick_upper,
    };

    if (preview) {
      return Response.json({
        success: true,
        poolId: pool.id,
        quote,
      });
    }

    const txb = await sdk.Position.createAddLiquidityFixCoinWithPricePayload({
      pool_id: pool.id,
      calculate_result,
      add_mode_params: FULL_RANGE_PARAMS,
    });

    txb.setGasBudget(100_000_000n);

    const result = await adminExecute(txb);

    let positionId = null;
    if (result.objectChanges) {
      const positionChange = result.objectChanges.find((change) => {
        const type = change.objectType || "";
        return change.type === "created" && typeof type === "string" && type.endsWith("::position::Position");
      });
      if (positionChange?.objectId) {
        positionId = positionChange.objectId;
      }
    }

    return Response.json({
      success: true,
      digest: result.digest,
      positionId,
      poolId: pool.id,
      quote,
      message: `Liquidity added to ${symbol} pool.`,
    });
  } catch (error) {
    console.error("Cetus Add Liquidity Error:", error);
    return Response.json(
      {
        error: error.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
