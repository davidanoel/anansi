// ============================================================
// CaribCoin Staking — Client-side transactions
// Uses zkLogin + sponsored tx pattern (matches lib/transactions.js)
// ============================================================

import { Transaction } from "@mysten/sui/transactions";
import { getSuiClient } from "./sui";
import {
  PACKAGE_ID,
  CARIB_TYPE,
  MODULES,
} from "./constants";

// The staking module and shared config object ID.
// Add STAKING_CONFIG_ID to constants.js after publishing staking.move.
const STAKING_CONFIG_ID =
  process.env.NEXT_PUBLIC_STAKING_CONFIG_ID || "0x0";
const STAKING_MODULE = "staking";

// Reuses `executeTransaction` from ./transactions.
// Import it here (avoids duplicating zkLogin + sponsor logic).
import { executeTransaction } from "./transactions";

// ============================================================
// Stake CARIB
// ============================================================

/**
 * Stake a specific amount of CARIB. Splits the exact amount off the user's
 * largest CARIB coin. Creates a new StakePosition owned by the user.
 *
 * @param {number} amountHuman - amount to stake in human CARIB (e.g., 1000)
 * @param {string} userAddress - user's zkLogin address
 */
export async function stakeCarib(amountHuman, userAddress) {
  const client = getSuiClient();
  const amountRaw = Math.floor(amountHuman * 1e9); // 9 decimals

  // Find user's CARIB coins
  const { data: caribCoins } = await client.getCoins({
    owner: userAddress,
    coinType: CARIB_TYPE,
  });
  if (caribCoins.length === 0) throw new Error("No CARIB in wallet");

  const totalBalance = caribCoins.reduce(
    (sum, c) => sum + BigInt(c.balance),
    0n,
  );
  if (totalBalance < BigInt(amountRaw)) {
    throw new Error(
      `Insufficient CARIB: need ${amountHuman}, have ${Number(totalBalance) / 1e9}`,
    );
  }

  const tx = new Transaction();

  // Merge if multiple CARIB coins
  if (caribCoins.length > 1) {
    const others = caribCoins.slice(1).map((c) => tx.object(c.coinObjectId));
    tx.mergeCoins(tx.object(caribCoins[0].coinObjectId), others);
  }

  // Split the exact stake amount from the merged coin
  const [stakeCoin] = tx.splitCoins(
    tx.object(caribCoins[0].coinObjectId),
    [tx.pure.u64(amountRaw)],
  );

  tx.moveCall({
    target: `${PACKAGE_ID}::${STAKING_MODULE}::stake`,
    arguments: [
      tx.object(STAKING_CONFIG_ID),
      stakeCoin,
      tx.object("0x6"), // Clock
    ],
  });

  return executeTransaction(tx);
}

/**
 * Add more CARIB to an existing position.
 * Fails if the position has a pending unstake (must cancel or withdraw first).
 *
 * @param {string} positionId - objectId of the user's StakePosition
 * @param {number} amountHuman
 * @param {string} userAddress
 */
export async function stakeIntoPosition(positionId, amountHuman, userAddress) {
  const client = getSuiClient();
  const amountRaw = Math.floor(amountHuman * 1e9);

  const { data: caribCoins } = await client.getCoins({
    owner: userAddress,
    coinType: CARIB_TYPE,
  });
  if (caribCoins.length === 0) throw new Error("No CARIB in wallet");

  const totalBalance = caribCoins.reduce(
    (sum, c) => sum + BigInt(c.balance),
    0n,
  );
  if (totalBalance < BigInt(amountRaw)) {
    throw new Error(
      `Insufficient CARIB: need ${amountHuman}, have ${Number(totalBalance) / 1e9}`,
    );
  }

  const tx = new Transaction();

  if (caribCoins.length > 1) {
    const others = caribCoins.slice(1).map((c) => tx.object(c.coinObjectId));
    tx.mergeCoins(tx.object(caribCoins[0].coinObjectId), others);
  }

  const [stakeCoin] = tx.splitCoins(
    tx.object(caribCoins[0].coinObjectId),
    [tx.pure.u64(amountRaw)],
  );

  tx.moveCall({
    target: `${PACKAGE_ID}::${STAKING_MODULE}::stake_into`,
    arguments: [
      tx.object(STAKING_CONFIG_ID),
      tx.object(positionId),
      stakeCoin,
      tx.object("0x6"),
    ],
  });

  return executeTransaction(tx);
}

// ============================================================
// Unstake (request cooldown)
// ============================================================

/**
 * Request to unstake a specific amount. Starts the 24h cooldown.
 */
export async function requestUnstake(positionId, amountHuman) {
  const amountRaw = Math.floor(amountHuman * 1e9);

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${STAKING_MODULE}::request_unstake`,
    arguments: [
      tx.object(positionId),
      tx.pure.u64(amountRaw),
      tx.object(STAKING_CONFIG_ID),
      tx.object("0x6"),
    ],
  });

  return executeTransaction(tx);
}

/**
 * Cancel a pending unstake. Benefits re-activate immediately.
 */
export async function cancelUnstake(positionId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${STAKING_MODULE}::cancel_unstake`,
    arguments: [
      tx.object(positionId),
      tx.object("0x6"),
    ],
  });

  return executeTransaction(tx);
}

/**
 * Withdraw unstaked CARIB after cooldown elapsed.
 * Returns the coins to the user's wallet.
 *
 * @param {string} positionId
 * @param {string} userAddress - needed for transferObjects target
 */
export async function withdrawUnstakedFor(positionId, userAddress) {
  const tx = new Transaction();

  const [coin] = tx.moveCall({
    target: `${PACKAGE_ID}::${STAKING_MODULE}::withdraw_unstaked`,
    arguments: [
      tx.object(STAKING_CONFIG_ID),
      tx.object(positionId),
      tx.object("0x6"),
    ],
  });

  tx.transferObjects([coin], tx.pure.address(userAddress));

  return executeTransaction(tx);
}

/**
 * Close (destroy) an empty position. Only works when balance is zero and
 * no pending unstake.
 */
export async function closePosition(positionId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${STAKING_MODULE}::close_position`,
    arguments: [
      tx.object(positionId),
      tx.object(STAKING_CONFIG_ID),
    ],
  });

  return executeTransaction(tx);
}
