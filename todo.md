# Fee conversion failure

About the recovery route fix
The old recover-fees route (from earlier) called adminRecoverStuckFees() — which was the "scan wallet for any USDC/CARIB and flush everything" function. That's the exact dangerous behavior we just eliminated.
You have two options:
Option A (simplest) — delete it. Remove:

app/app/api/platform/recover-fees/route.js
The cron entry from vercel.json

The new v2 design tracks specific coin IDs per fee event. If a TX2 fails, the response includes feeCoinId and recoverable: true. You recover manually by calling adminConvertSpecificUsdcCoin(feeCoinId). No cron needed.
Option B — keep it but make it safe. Only works if you add a DB table to persist failed feeCoinIds from TX2 partial failures. Cron iterates the table and calls adminConvertSpecificUsdcCoin per entry. More work, not needed for testnet.
Go with A for now. Add B later if fee failures actually become a pattern in production.

# On fee reduction

Park it as Phase 2, as the proposal suggests.
If/when you add it, use a shared discount module.
Implement it with separate discounted entrypoints, not Option<&StakePosition>.
Abort on invalid stake input instead of silently charging full fee.
Only apply it to flows where the fee payer identity is actually meaningful on-chain.
