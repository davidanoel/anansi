#!/bin/bash
# ============================================================
# deploy-commodity.sh — Deploy a commodity package and register it
#
# Publishes the commodity, then registers it in the CommodityRegistry.
#
# Prerequisites:
#   - Core package already deployed
#   - COMMODITY_REGISTRY_ID env var set (or pass as inline var)
#   - COMMODITY_REGISTRY_ADMIN_ID env var set (or pass as inline var)
#   - CORE_PACKAGE_ID env var set (or pass as inline var)
#
# Usage:
#   ./deploy-commodity.sh nutmeg
#   ./deploy-commodity.sh coffee
#   ./deploy-commodity.sh cocoa
#
# With explicit IDs:
#   COMMODITY_REGISTRY_ID=0x... COMMODITY_REGISTRY_ADMIN_ID=0x... CORE_PACKAGE_ID=0x... ./deploy-commodity.sh nutmeg
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

# 1. Resolve absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
COMMODITY_DIR="$SCRIPT_DIR/../../contracts/commodities/${COMMODITY}"
ENV_FILE="$SCRIPT_DIR/../.env.local"
DEPLOY_DIR="$SCRIPT_DIR/../../deployments"

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
echo "  │  Deploying ${SYMBOL}"
echo "  └─────────────────────────────────────┘"
echo ""

cd "$COMMODITY_DIR"

# Clean build
rm -f Move.lock Published.toml
echo "👉 Building Move package..."
sui move build 2>&1 | tail -3

# Setup logging
mkdir -p "$DEPLOY_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_JSON="$DEPLOY_DIR/${COMMODITY}-deploy-${TIMESTAMP}.json"

echo ""
echo "👉 Publishing to testnet..."
# Disable exit-on-error temporarily to catch failures
set +e
sui client publish --gas-budget 200000000 --json > "$OUTPUT_JSON"
PUBLISH_STATUS=$?
set -e

if [ $PUBLISH_STATUS -ne 0 ] || [ ! -s "$OUTPUT_JSON" ]; then
    echo "❌ ERROR: Sui Deployment Failed!"
    echo "------------------------------------------------------------"
    cat "$OUTPUT_JSON"
    echo "------------------------------------------------------------"
    exit 1
fi

echo "👉 Extracting IDs and updating frontend .env.local..."

# Python script to extract IDs and update the JSON config in .env.local
PYTHON_OUT=$(python3 -c "
import json, sys, os

env_file = '''$ENV_FILE'''
json_file = '''$OUTPUT_JSON'''
symbol = '''$SYMBOL'''
module_name = '''$COMMODITY'''.lower()

try:
    with open(json_file, 'r') as f:
        data = json.load(f)
        
    pkg_id = None
    mint_vault_id = None

    for change in data.get('objectChanges', []):
        if change.get('type') == 'published':
            pkg_id = change['packageId']
        elif change.get('type') == 'created':
            obj_type = change.get('objectType', '')
            if f'::{module_name}::MintVault' in obj_type:
                mint_vault_id = change['objectId']

    if not pkg_id:
        print('❌ ERROR: Could not find packageId.', file=sys.stderr)
        sys.exit(1)
        
    print(f'✅ Package ID: {pkg_id}', file=sys.stderr)
    print(f'✅ MintVault:  {mint_vault_id}', file=sys.stderr)

    # Read and update .env.local
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            lines = f.readlines()
            
        token_config_str = '{}'
        registered_tokens_str = ''
        config_idx = -1
        tokens_idx = -1

        for i, line in enumerate(lines):
            if line.startswith('NEXT_PUBLIC_TOKEN_CONFIG='):
                token_config_str = line.split('=', 1)[1].strip()
                config_idx = i
            elif line.startswith('NEXT_PUBLIC_REGISTERED_TOKENS='):
                registered_tokens_str = line.split('=', 1)[1].strip()
                tokens_idx = i

        try:
            token_config = json.loads(token_config_str)
        except:
            token_config = {}

        if symbol not in token_config:
            token_config[symbol] = {}
            
        token_config[symbol]['packageId'] = pkg_id
        token_config[symbol]['mintVault'] = mint_vault_id
        
        if 'pool' not in token_config[symbol]:
            token_config[symbol]['pool'] = ''

        new_config_str = json.dumps(token_config, separators=(',', ':'))

        tokens_list = [t.strip() for t in registered_tokens_str.split(',') if t.strip()]
        if symbol not in tokens_list:
            tokens_list.append(symbol)
        new_tokens_str = ','.join(tokens_list)

        if config_idx != -1:
            lines[config_idx] = f'NEXT_PUBLIC_TOKEN_CONFIG={new_config_str}\n'
        else:
            lines.append(f'NEXT_PUBLIC_TOKEN_CONFIG={new_config_str}\n')

        if tokens_idx != -1:
            lines[tokens_idx] = f'NEXT_PUBLIC_REGISTERED_TOKENS={new_tokens_str}\n'
        else:
            lines.append(f'NEXT_PUBLIC_REGISTERED_TOKENS={new_tokens_str}\n')

        with open(env_file, 'w') as f:
            f.writelines(lines)
            
        print(f'✅ Successfully updated NEXT_PUBLIC_TOKEN_CONFIG inside frontend .env.local!', file=sys.stderr)
        print(pkg_id)
except Exception as e:
    print(f'❌ PARSE_FAILED: {str(e)}', file=sys.stderr)
    sys.exit(1)
")

if [ -z "$PYTHON_OUT" ]; then
    echo "❌ Script aborted due to Python extraction error."
    exit 1
fi
PACKAGE_ID=$PYTHON_OUT

# ---------------------------------------------------------
# REGISTRY LOGIC: Prefer CLI Env Vars, fallback to .env.local
# ---------------------------------------------------------
if [ -z "$CORE_PACKAGE_ID" ] && [ -f "$ENV_FILE" ]; then
  CORE_PACKAGE_ID=$(grep "^NEXT_PUBLIC_PACKAGE_ID=" "$ENV_FILE" | cut -d '=' -f 2 || echo "")
fi
if [ -z "$COMMODITY_REGISTRY_ID" ] && [ -f "$ENV_FILE" ]; then
  COMMODITY_REGISTRY_ID=$(grep "^NEXT_PUBLIC_COMMODITY_REGISTRY_ID=" "$ENV_FILE" | cut -d '=' -f 2 || echo "")
fi

echo ""
# Register in commodity registry (if we found all 3 vars)
if [ -n "$COMMODITY_REGISTRY_ID" ] && [ -n "$COMMODITY_REGISTRY_ADMIN_ID" ] && [ -n "$CORE_PACKAGE_ID" ]; then
  echo "👉 Registering ${SYMBOL} in CommodityRegistry..."

  FULL_NAME=$(grep -oP 'b"\K[^"]+' "$SOURCE_FILE" | sed -n '3p')

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

  echo "  ✓ ${SYMBOL} registered in CommodityRegistry"
else
  echo "  ⚠ Skipping auto-registry."
  echo "    Could not find COMMODITY_REGISTRY_ADMIN_ID (or others) in CLI variables."
  echo ""
  echo "  Manual registration:"
  echo "    sui client call \\"
  echo "      --package ${CORE_PACKAGE_ID:-<CORE_PACKAGE_ID>} \\"
  echo "      --module commodity_registry \\"
  echo "      --function register \\"
  echo "      --args <REGISTRY_ADMIN_ID> ${COMMODITY_REGISTRY_ID:-<REGISTRY_ID>} \"${SYMBOL}\" \"${SYMBOL}\" \"${PACKAGE_ID}\" \\"
  echo "      --gas-budget 10000000"
fi

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │  Update your environment                │"
echo "  └─────────────────────────────────────────┘"
echo ""
echo "  1. Add ${SYMBOL} to NEXT_PUBLIC_REGISTERED_TOKENS (Auto-updated!)"
echo ""
echo "  2. Add to NEXT_PUBLIC_TOKEN_CONFIG (Auto-updated!)"
echo ""
echo "  3. Create asset type from /platform dashboard"
echo ""
echo "  4. (Optional) Create Cetus pool, then manually update pool in TOKEN_CONFIG"
echo ""
echo "  Full deploy output: $OUTPUT_JSON"
echo ""