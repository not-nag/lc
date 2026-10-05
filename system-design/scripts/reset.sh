#!/usr/bin/env bash
# Safely clear the Next build cache: stop THIS project's dev server first, then delete .next.
# Deleting .next under a running server leaves it 500-ing on routes-manifest.json.
# Only port 3200 is touched, so the LeetCode decks on 3100 keep running.
set -e
cd "$(dirname "$0")/.."
pids=$(lsof -ti tcp:3200 2>/dev/null || true)
[ -n "$pids" ] && kill $pids 2>/dev/null || true
sleep 1
rm -rf .next
echo "cache cleared. start again with: npm run dev"
