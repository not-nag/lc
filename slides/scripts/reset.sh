#!/usr/bin/env bash
# Safely clear the Next build cache: stop the dev server first, then restart it.
# Deleting .next under a running server leaves it 500-ing on routes-manifest.json.
set -e
cd "$(dirname "$0")/.."
pkill -f "next dev -p 3100" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 1
rm -rf .next
echo "cache cleared. start again with: npm run dev"
