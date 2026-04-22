# Vesting Module — Integration Guide

## What It Is

`anansi::vesting` locks CARIB tokens on a time-based release schedule with an optional cliff. It supports three use cases in one module:

- **Foundation self-lock** — public proof of Charter commitments (non-revocable)
- **SAFT investors** — token commitments from funding rounds (non-revocable)
- **Team & contributors** — grants that claw back unvested portion on departure (revocable)

## Core Concepts

### VestingSchedule (shared object)

Each schedule is its own shared object. Anyone can look it up by ID and inspect its state. Only the beneficiary can claim; only the creator can revoke (and only if revocable=true).

### VestingConfig (shared object)

Single global config. Holds aggregate stats and the emergency pause flag.

### VestingAdmin (owned cap)

Held by the Foundation. Can toggle the global pause. Cannot alter or seize individual schedules.

## Schedule Math

```
vested(t) = 0                              if t < cliff_ms
vested(t) = total * (t - start) / (end - start)  if cliff_ms <= t < end_ms
vested(t) = total                          if t >= end_ms
```

All timestamps are in milliseconds (Sui clock convention).

## Common Schedule Templates

| Use case | start | cliff | end | revocable |
|---|---|---|---|---|
| **Team grant** (standard) | now | now + 1yr | now + 4yr | `true` |
| **SAFT investor** (typical) | now | now + 6mo | now + 2yr | `false` |
| **SAFT investor** (retroactive) | SAFT date | SAFT + 6mo | SAFT + 2yr | `false` |
| **Foundation self-lock** | now | now + 1yr | now + 4yr | `false` |
| **Advisor grant** (short) | now | now + 3mo | now + 18mo | `true` |
| **Cliff-only** (all at once) | now | now + 1yr | now + 1yr | varies |
| **No cliff** (pure linear) | now | now | now + 1yr | varies |

## Creating a Schedule

### From an admin signer (backend, for batch or scripted creation)

```typescript
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();

// Split the exact amount from the admin wallet's CARIB
const [coin] = tx.splitCoins(tx.object(ADMIN_CARIB_COIN_ID), [tx.pure.u64(AMOUNT)]);

tx.moveCall({
  target: `${PACKAGE_ID}::vesting::create_schedule`,
  arguments: [
    tx.object(VESTING_CONFIG_ID),
    coin,
    tx.pure.address(BENEFICIARY),
    tx.pure.u64(START_MS),
    tx.pure.u64(CLIFF_MS),
    tx.pure.u64(END_MS),
    tx.pure.bool(REVOCABLE),
  ],
});

// IMPORTANT: capture schedule_id from objectChanges or the ScheduleCreated event
const result = await client.signAndExecuteTransaction({
  transaction: tx,
  signer: adminKeypair,
  options: { showEffects: true, showEvents: true, showObjectChanges: true },
});
```

After creation, persist the `schedule_id` to your DB — you'll need it for claim URLs, revocation tracking, and the beneficiary dashboard.

### From a user wallet (self-serve, e.g. Foundation locking its own tokens)

Same pattern, but the user signs and the coin comes from their own wallet. Build the transaction client-side using `@mysten/dapp-kit`.

## Claiming

Pull-based: the beneficiary signs the transaction themselves. This is the entire flow.

```typescript
const tx = new Transaction();

tx.moveCall({
  target: `${PACKAGE_ID}::vesting::claim`,
  arguments: [
    tx.object(VESTING_CONFIG_ID),
    tx.object(SCHEDULE_ID),
    tx.object('0x6'),  // Clock shared object
  ],
});

await signAndExecute(tx);
```

**UI note:** before offering a claim button, call `vesting::claimable(schedule, clock)` as a read-only call. If it returns 0, grey out the button. Otherwise show the claimable amount.

## Revoking

Only the creator can revoke, and only if the schedule was created with `revocable=true`.

```typescript
const tx = new Transaction();

tx.moveCall({
  target: `${PACKAGE_ID}::vesting::revoke`,
  arguments: [
    tx.object(VESTING_CONFIG_ID),
    tx.object(SCHEDULE_ID),
    tx.object('0x6'),
  ],
});

await signAndExecute(tx);  // signer must be the creator
```

After revocation:
- The unvested portion is transferred to the creator in the same tx
- The beneficiary can still claim the already-vested portion
- Vested amount freezes — clock advancing further does NOT unlock more

## Transferring a Schedule

The current beneficiary can reassign claim rights to another address. Useful for wallet rotation, M&A events, or estate planning. Does not reset any vesting state.

```typescript
tx.moveCall({
  target: `${PACKAGE_ID}::vesting::transfer_schedule`,
  arguments: [
    tx.object(SCHEDULE_ID),
    tx.pure.address(NEW_BENEFICIARY),
  ],
});
```

Signer must be the current beneficiary.

## Reading Schedule State

All view functions are read-only and can be called via `devInspectTransactionBlock`:

- `vested_amount(schedule, clock) → u64` — total vested as of now (or frozen at revoked_at_ms if revoked)
- `claimable(schedule, clock) → u64` — vested minus already-released
- `cliff_reached(schedule, clock) → bool`
- `is_fully_vested(schedule, clock) → bool`
- Static fields: `beneficiary`, `creator`, `total`, `released`, `remaining`, `start_ms`, `cliff_ms`, `end_ms`, `is_revocable`, `is_revoked`, `revoked_at_ms`

## Events (for the indexer)

Emit pattern for each state transition — subscribe to these in `indexer/` for dashboards.

| Event | Fired by | Key fields |
|---|---|---|
| `ScheduleCreated` | `create_schedule` | `schedule_id`, `beneficiary`, `creator`, `total`, times, `revocable` |
| `TokensClaimed` | `claim` | `schedule_id`, `beneficiary`, `amount`, `new_released_total` |
| `ScheduleRevoked` | `revoke` | `schedule_id`, `creator`, `returned_to_creator`, `already_vested`, `revoked_at_ms` |
| `ScheduleTransferred` | `transfer_schedule` | `schedule_id`, `old_beneficiary`, `new_beneficiary` |
| `PauseToggled` | `set_paused` | `paused` |

## Emergency Pause

```typescript
tx.moveCall({
  target: `${PACKAGE_ID}::vesting::set_paused`,
  arguments: [
    tx.object(VESTING_ADMIN_CAP_ID),
    tx.object(VESTING_CONFIG_ID),
    tx.pure.bool(true),  // or false to unpause
  ],
});
```

Pause blocks `create_schedule` and `claim`. It intentionally does NOT block `revoke` — creators can always claw back their own funds, so a compromised pause key cannot hold allocations hostage.

## Deployment Checklist

After the next fresh publish, capture and set these env vars:

```
NEXT_PUBLIC_VESTING_CONFIG_ID=0x...    # shared, from publish tx objectChanges
VESTING_ADMIN_CAP_ID=0x...             # owned by deployer, safekeep
```

The Package ID is shared with all other anansi modules — no separate package needed.

## Design Constraints (Do Not Violate)

1. **Revocability is immutable.** You cannot change `revocable` after creation. If you get this wrong, the only recovery path is: revoke (if revocable), create a new schedule with correct flag, beneficiary accepts new schedule.

2. **Beneficiary transfer does not reset vesting.** Clock continues running. The new beneficiary inherits the exact same schedule state.

3. **Revoked schedules freeze vesting.** This is NOT a pause — it's a hard cap. Do not try to "un-revoke."

4. **All time values are absolute timestamps, not durations.** `start_ms`, `cliff_ms`, `end_ms` are wall-clock values. Compute them as `Date.now() + duration_ms` on the frontend.

5. **u64 total.** A single schedule can hold up to ~1.8e19 raw CARIB units. At 9 decimals that's 1.8e10 = 18 billion CARIB — larger than total supply. Not a practical concern.

## First Recommended Deployment

To prove the module works on mainnet before any real allocations:

1. Deploy the module
2. Create a Foundation self-lock: 100M CARIB → founder wallet, 1-year cliff, 4-year vest, non-revocable
3. Publish the schedule_id on the marketing site as "proof of commitment"
4. Wait, then use claim() at cliff to verify the full flow end-to-end

This gives you: a live demo, a Charter proof-point, and zero risk to funds you weren't going to touch for a year anyway.
