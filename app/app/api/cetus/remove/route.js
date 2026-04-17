import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { getAdminAddress, adminExecute } from "../../../../lib/admin-signer";
import { SUI_NETWORK, SUI_RPC_URL, USDC_TYPE, getToken } from "../../../../lib/constants";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const symbol = body.symbol;

    if (!symbol) {
      return Response.json({ error: "No token symbol provided." }, { status: 400 });
    }

    // 1. Look up the exact coin types securely from our constants
    const token = getToken(symbol);
    if (!token || !token.type) {
      return Response.json({ error: `Could not find coinType for ${symbol}` }, { status: 400 });
    }
    const COMMODITY_TYPE = token.type;

    const tokenConfig = JSON.parse(process.env.NEXT_PUBLIC_TOKEN_CONFIG || "{}");
    const poolId = tokenConfig[symbol]?.pool;

    if (!poolId || poolId.trim() === "") {
      return Response.json({ error: `No active pool configured for ${symbol}` }, { status: 400 });
    }

    const admin = getAdminAddress();
    const network = SUI_NETWORK === "mainnet" ? "mainnet" : "testnet";
    const rpcUrl = process.env.SUI_RPC_URL || SUI_RPC_URL || getJsonRpcFullnodeUrl(network);

    const sdk = CetusClmmSDK.createSDK({
      env: network,
      full_rpc_url: rpcUrl,
    });

    if (typeof sdk.setSenderAddress === "function") {
      sdk.setSenderAddress(admin);
    } else {
      sdk.senderAddress = admin;
    }

    console.log(`Bypassing Cetus SDK to manually locate Position NFT for ${symbol} pool...`);

    // 2. PAGE THROUGH OWNED OBJECTS AND MATCH THE POSITION BY SHAPE + POOL ID.
    let cursor = null;
    let positionObj = null;

    do {
      const rpcRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "suix_getOwnedObjects",
          params: [
            admin,
            { options: { showContent: true, showType: true } },
            cursor,
            50,
          ],
        }),
      });

      const rpcData = await rpcRes.json();
      if (rpcData.error) throw new Error(rpcData.error.message);

      positionObj = rpcData.result.data.find((obj) => {
        const type = obj.data?.type || "";
        const fields = obj.data?.content?.fields || {};
        return type.endsWith("::position::Position") && fields.pool === poolId;
      });

      cursor = rpcData.result.hasNextPage ? rpcData.result.nextCursor : null;
    } while (!positionObj && cursor);

    if (!positionObj) {
      return Response.json(
        {
          error:
            "No Liquidity Position NFT found in the admin wallet. It may have already been withdrawn.",
        },
        { status: 404 },
      );
    }

    const posId = positionObj.data.objectId;
    console.log(`Found Position NFT: ${posId}. Withdrawing liquidity via V2 SDK...`);

    // 4. Deterministically reconstruct coin types (No getPool network calls needed)
    const coinTypeA = USDC_TYPE > COMMODITY_TYPE ? USDC_TYPE : COMMODITY_TYPE;
    const coinTypeB = coinTypeA === USDC_TYPE ? COMMODITY_TYPE : USDC_TYPE;

    // 5. V2 Close Position Payload
    const txb = await sdk.Position.closePositionPayload({
      coin_type_a: coinTypeA,
      coin_type_b: coinTypeB,
      min_amount_a: "0",
      min_amount_b: "0",
      rewarder_coin_types: [], // New testnet pools have no rewarders
      pool_id: poolId,
      pos_id: posId,
      collect_fee: true,
    });

    txb.setGasBudget(100_000_000n);

    // 6. Execute as Admin
    const result = await adminExecute(txb);

    return Response.json({
      success: true,
      digest: result.digest,
      message: `Liquidity successfully withdrawn for ${symbol}. Tokens returned to admin wallet.`,
    });
  } catch (error) {
    console.error("Cetus Liquidity Removal Error:", error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
