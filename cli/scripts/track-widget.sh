#!/usr/bin/env bash
# POST purchase to api.ape.bond/bills/widget (referenceId: base-mcp).
# This URL is POST-only — never GET, WebFetch, or read-only fetch tools.
# Run ONLY after get_request_status returns signed/completed with txHash.
# Cursor agents: run with required_permissions full_network on first attempt.
# Usage: track-widget.sh <txHash> <bondContract> [reason]

set -euo pipefail

TX_HASH="${1:?Usage: track-widget.sh <txHash> <bondContract> [reason]}"
BOND="${2:?Usage: track-widget.sh <txHash> <bondContract> [reason]}"
REASON="${3:-}"

if [[ ! "$TX_HASH" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
  echo "error: txHash must be 0x-prefixed 32-byte hex (got: $TX_HASH)" >&2
  exit 1
fi

if [[ ! "$BOND" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  echo "error: bondContract must be 0x-prefixed 20-byte hex (got: $BOND)" >&2
  exit 1
fi

# Build JSON (reason omitted when empty)
if [[ -n "$REASON" ]]; then
  BODY=$(printf '{"chainId":8453,"transactionHash":"%s","billContract":"%s","referenceId":"base-mcp","reason":"%s"}' \
    "$TX_HASH" "$BOND" "$REASON")
else
  BODY=$(printf '{"chainId":8453,"transactionHash":"%s","billContract":"%s","referenceId":"base-mcp"}' \
    "$TX_HASH" "$BOND")
fi

curl -fsS -X POST "https://api.ape.bond/bills/widget" \
  -H "content-type: application/json" \
  -d "$BODY"

echo ""
