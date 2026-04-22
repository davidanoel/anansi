import { Transaction } from "@mysten/sui/transactions";
import { executeTransaction } from "./transactions";
import { MODULES, PACKAGE_ID, VESTING_CONFIG_ID } from "./constants";

function requireVestingConfig() {
  if (!VESTING_CONFIG_ID || VESTING_CONFIG_ID === "0x0") {
    throw new Error("Vesting config not configured");
  }
}

export async function claimVestedTokens(scheduleId) {
  requireVestingConfig();
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.VESTING}::claim`,
    arguments: [tx.object(VESTING_CONFIG_ID), tx.object(scheduleId), tx.object("0x6")],
  });
  return executeTransaction(tx);
}

export async function transferVestingSchedule(scheduleId, newBeneficiary) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.VESTING}::transfer_schedule`,
    arguments: [tx.object(scheduleId), tx.pure.address(newBeneficiary)],
  });
  return executeTransaction(tx);
}

export async function revokeVestingSchedule(scheduleId) {
  requireVestingConfig();
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.VESTING}::revoke`,
    arguments: [tx.object(VESTING_CONFIG_ID), tx.object(scheduleId), tx.object("0x6")],
  });
  return executeTransaction(tx);
}
