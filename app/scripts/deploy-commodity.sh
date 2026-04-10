#!/bin/bash
# ============================================================
# deploy-commodity.sh — Deploy a commodity package and register it
#
# Publishes the commodity, then registers it in the CommodityRegistry.
#
# Prerequisites:
#   - Core package already deployed
#   - COMMODITY_REGISTRY_ID env var set (or pass as arg)
#   - COMMODITY_REGISTRY_ADMIN_ID env var set (or pass as arg)
#
# Usage:
#   ./deploy-commodity.sh nutmeg
#   ./deploy-commodity.sh coffee
#   ./deploy-commodity.sh cocoa
#
# With explicit IDs:
#   COMMODITY_REGISTRY_ID=0x... COMMODITY_REGISTRY_ADMIN_ID=0x... ./deploy-commodity.sh nutmeg
# ============================================================

set -e

COMMODITY="$1"

if [ -z "$COMMODITY" ]; then
  echo ""
  echo "  Usage: $0 <commodity_name>"
  echo ""
  echo "  Examples:"
  echo "    $0 nutmeg"
  echo "    $0 coffee"
  echo "    $0 cocoa"
  echo ""
  echo "  Set these env vars first:"
  echo "    COMMODITY_REGISTRY_ID=0x..."
  echo "    COMMODITY_REGISTRY_ADMIN_ID=0x..."
  echo "    CORE_PACKAGE_ID=0x..."
  echo ""
  exit 1
fi

COMMODITY_DIR="../contracts/commodities/${COMMODITY}"

if [ ! -d "$COMMODITY_DIR" ]; then
  echo "  ✗ Package directory not found: ${COMMODITY_DIR}"
  echo "  Run ./generate-commodity.sh first"
  exit 1
fi

# Read symbol and name from the source file
SYMBOL=$(echo "$COMMODITY" | tr '[:lower:]' '[:upper:]')
SOURCE_FILE="${COMMODITY_DIR}/sources/${COMMODITY}.move"

echo ""
echo "  ┌─────────────────────────────────────┐"
echo "  │  Deploying ${SYMBOL}                  "
echo "  └─────────────────────────────────────┘"
echo ""

cd "$COMMODITY_DIR"

# Clean build
rm -f move.lock
echo "  Building..."
sui move build 2>&1 | tail -3

echo ""
echo "  Publishing..."
sui client publish --gas-budget 200000000 --json > /tmp/${COMMODITY}-deploy.json 2>&1

# Extract package ID
PACKAGE_ID=$(cat /tmp/${COMMODITY}-deploy.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'published':
        print(change['packageId'])
        break
" 2>/dev/null || echo "PARSE_FAILED")

# Extract MintVault ID
MINT_VAULT_ID=$(cat /tmp/${COMMODITY}-deploy.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and 'MintVault' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null || echo "NOT_FOUND")

echo ""
echo "  ✓ ${SYMBOL} package published"
echo "    Package ID:  ${PACKAGE_ID}"
echo "    MintVault:   ${MINT_VAULT_ID}"
echo ""

# Register in commodity registry (if env vars are set)
if [ -n "$COMMODITY_REGISTRY_ID" ] && [ -n "$COMMODITY_REGISTRY_ADMIN_ID" ] && [ -n "$CORE_PACKAGE_ID" ]; then
  echo "  Registering ${SYMBOL} in CommodityRegistry..."

  # Extract name from source file (line with b"Name")
  FULL_NAME=$(grep -oP 'b"\K[^"]+' "$SOURCE_FILE" | sed -n '3p') # 3rd b"..." is the name

  sui client call \
    --package "$CORE_PACKAGE_ID" \
    --module commodity_registry \
    --function register \
    --args \
      "$COMMODITY_REGISTRY_ADMIN_ID" \
      "$COMMODITY_REGISTRY_ID" \
      "$SYMBOL" \
      "${FULL_NAME:-$SYMBOL}" \
      "$PACKAGE_ID" \
    --gas-budget 10000000 2>&1 | tail -3

  echo ""
  echo "  ✓ ${SYMBOL} registered in CommodityRegistry"
else
  echo "  ⚠ Skipping registry — set COMMODITY_REGISTRY_ID, COMMODITY_REGISTRY_ADMIN_ID, and CORE_PACKAGE_ID env vars"
  echo ""
  echo "  Manual registration:"
  echo "    sui client call \\"
  echo "      --package <CORE_PACKAGE_ID> \\"
  echo "      --module commodity_registry \\"
  echo "      --function register \\"
  echo "      --args <REGISTRY_ADMIN_ID> <REGISTRY_ID> \"${SYMBOL}\" \"${SYMBOL}\" \"${PACKAGE_ID}\" \\"
  echo "      --gas-budget 10000000"
fi

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │  Update your environment                 │"
echo "  └─────────────────────────────────────────┘"
echo ""
echo "  1. Add ${SYMBOL} to NEXT_PUBLIC_REGISTERED_TOKENS"
echo ""
echo "  2. Add to NEXT_PUBLIC_TOKEN_CONFIG:"
echo "     \"${SYMBOL}\":{\"mintVault\":\"${MINT_VAULT_ID}\",\"pool\":\"\"}"
echo ""
echo "  3. Create asset type from /platform dashboard"
echo ""
echo "  4. (Optional) Create Cetus pool, then update pool in TOKEN_CONFIG"
echo ""
echo "  Full deploy output: /tmp/${COMMODITY}-deploy.json"
echo ""
