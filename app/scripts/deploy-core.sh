#!/bin/bash
# ============================================================
# deploy-core.sh — Publish the core Anansi platform package
#
# Run this ONCE. All commodity packages depend on core.
# Env vars will be automatically extracted and saved to .env.local.
# Deployments are logged to a timestamped JSON file in the deployments/ folder.
#
# Usage: ./deploy-core.sh
# ============================================================

set -e

# 1. Resolve absolute paths automatically so 'cd' never breaks them
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
CORE_DIR="$SCRIPT_DIR/../../contracts/core"
ENV_FILE="$SCRIPT_DIR/../.env.local"

# Create a permanent deployments folder at the root of the project
DEPLOY_DIR="$SCRIPT_DIR/../../deployments"
mkdir -p "$DEPLOY_DIR"

# Generate a timestamp (e.g., 20260410_162230)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_JSON="$DEPLOY_DIR/core-deploy-${TIMESTAMP}.json"

echo "============================================================"
echo "  Deploying Anansi Core Platform"
echo "============================================================"
echo "  Script Dir : $SCRIPT_DIR"
echo "  Core Dir   : $CORE_DIR"
echo "  Env File   : $ENV_FILE"
echo "============================================================"
echo ""

# Ensure Core directory exists
if [ ! -d "$CORE_DIR" ]; then
    echo "❌ Error: Core directory not found at $CORE_DIR"
    exit 1
fi

cd "$CORE_DIR"
echo "👉 Changed directory to: $(pwd)"

# Clean build
rm -f Move.lock Published.toml
echo "👉 Building Move package..."
sui move build 2>&1 | tail -3

echo ""
echo "👉 Publishing to testnet (this may take a few seconds)..."
sui client publish --gas-budget 200000000 --json > "$OUTPUT_JSON"

if [ ! -s "$OUTPUT_JSON" ]; then
    echo "❌ Error: Deployment failed or output is empty. Check Sui CLI."
    cat "$OUTPUT_JSON"
    exit 1
fi

echo "👉 Extraction & Environment Update starting..."

# We capture the package ID from Python's standard output (stdout),
# while printing all the debug logs to standard error (stderr) so you can see them!
PACKAGE_ID=$(python3 -c "
import json, sys, os

env_file = '''$ENV_FILE'''
json_file = '''$OUTPUT_JSON'''

try:
    with open(json_file, 'r') as f:
        data = json.load(f)
        
    pkg_id = None
    objects = {}

    for change in data.get('objectChanges', []):
        if change.get('type') == 'published':
            pkg_id = change['packageId']
        elif change.get('type') == 'created':
            obj_type = change.get('objectType', '')
            obj_id = change.get('objectId', '')
            
            if '::asset_pool::Registry' in obj_type: objects['NEXT_PUBLIC_REGISTRY_ID'] = obj_id
            elif '::yield_engine::YieldEngine' in obj_type: objects['NEXT_PUBLIC_YIELD_ENGINE_ID'] = obj_id
            elif '::compliance::ComplianceRegistry' in obj_type: objects['NEXT_PUBLIC_COMPLIANCE_ID'] = obj_id
            elif '::platform::Platform' in obj_type: objects['NEXT_PUBLIC_PLATFORM_ID'] = obj_id
            elif '::carib_coin::Treasury' in obj_type: objects['NEXT_PUBLIC_CARIB_TREASURY_ID'] = obj_id
            elif '::commodity_registry::CommodityRegistry' in obj_type and 'Admin' not in obj_type: 
                objects['NEXT_PUBLIC_COMMODITY_REGISTRY_ID'] = obj_id
            elif '::commodity_registry::CommodityRegistryAdmin' in obj_type: 
                objects['COMMODITY_REGISTRY_ADMIN_ID'] = obj_id

    if not pkg_id:
        print('❌ ERROR: Could not find packageId in the deployment JSON.', file=sys.stderr)
        sys.exit(1)

    objects['NEXT_PUBLIC_PACKAGE_ID'] = pkg_id
    objects['NEXT_PUBLIC_ORIGINAL_PACKAGE_ID'] = pkg_id
    
    print(f'\n✅ Extracted Package ID: {pkg_id}', file=sys.stderr)
    for k, v in objects.items():
        print(f'   - {k} = {v}', file=sys.stderr)

    # Environment file updating
    lines = []
    if os.path.exists(env_file):
        print(f'\n✅ Found existing env file at: {env_file}', file=sys.stderr)
        with open(env_file, 'r') as f:
            lines = f.readlines()
    else:
        print(f'\n⚠️ Env file not found. Creating a new one at: {env_file}', file=sys.stderr)
        
    # Replace existing keys
    for i, line in enumerate(lines):
        for k in list(objects.keys()):
            if line.startswith(k + '='):
                lines[i] = k + '=' + objects.pop(k) + '\n'
                break
                
    # Append new keys
    for k, v in objects.items():
        if lines and not lines[-1].endswith('\n'):
            lines[-1] += '\n'
        lines.append(k + '=' + v + '\n')

    with open(env_file, 'w') as f:
        f.writelines(lines)
        
    print(f'✅ Successfully wrote updates to .env.local!\n', file=sys.stderr)
        
    # Print only the pkg_id to stdout so bash can capture it
    print(pkg_id)

except Exception as e:
    print(f'❌ PARSE_FAILED: {str(e)}', file=sys.stderr)
    sys.exit(1)
")

if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Script aborted due to Python extraction error."
    exit 1
fi

echo "============================================================"
echo "  🎉 DEPLOYMENT COMPLETE"
echo "============================================================"
echo "  Package ID : ${PACKAGE_ID}"
echo "  Log File   : $OUTPUT_JSON"
echo "============================================================"