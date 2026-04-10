#!/bin/bash
# ============================================================
# deploy-core.sh — Publish the core Anansi platform package
#
# Run this ONCE. All commodity packages depend on core.
# Save the output — you'll need the object IDs for env vars.
#
# Usage: ./deploy-core.sh
# ============================================================

set -e

CORE_DIR="../contracts/core"

echo ""
echo "  ┌─────────────────────────────────────┐"
echo "  │  Deploying Anansi Core Platform     │"
echo "  └─────────────────────────────────────┘"
echo ""

cd "$CORE_DIR"

# Clean build
rm -f move.lock
echo "  Building..."
sui move build 2>&1 | tail -3

echo ""
echo "  Publishing..."
sui client publish --gas-budget 200000000 --json > /tmp/core-deploy.json 2>&1

# Extract key IDs
PACKAGE_ID=$(cat /tmp/core-deploy.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'published':
        print(change['packageId'])
        break
" 2>/dev/null || echo "PARSE_FAILED")

echo ""
echo "  ✓ Core package published"
echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │  SAVE THESE VALUES                       │"
echo "  └─────────────────────────────────────────┘"
echo ""
echo "  Package ID: ${PACKAGE_ID}"
echo ""
echo "  Now find these shared objects in the output:"
echo "    - asset_pool::Registry"
echo "    - yield_engine::YieldEngine"
echo "    - compliance::ComplianceRegistry"
echo "    - platform::Platform"
echo "    - carib_coin::Treasury"
echo "    - commodity_registry::CommodityRegistry"
echo "    - commodity_registry::CommodityRegistryAdmin"
echo "    - package::UpgradeCap"
echo ""
echo "  Full deploy output: /tmp/core-deploy.json"
echo ""
echo "  Next steps:"
echo "    1. Update .env.local with all object IDs"
echo "    2. Deploy commodities: ./deploy-commodity.sh nutmeg"
echo ""
