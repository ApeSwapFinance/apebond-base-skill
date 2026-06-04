#!/usr/bin/env bash
# GET register purchase at api.ape.bond/bills/widget/register (referenceId: base-mcp).
# Run ONLY after get_request_status returns signed/completed with txHash.
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

CURL_ARGS=(
  -fsS -G "https://api.ape.bond/bills/widget/register"
  --data-urlencode "chainId=8453"
  --data-urlencode "transactionHash=$TX_HASH"
  --data-urlencode "billContract=$BOND"
  --data-urlencode "referenceId=base-mcp"
)

if [[ -n "$REASON" ]]; then
  CURL_ARGS+=(--data-urlencode "reason=$REASON")
fi

curl "${CURL_ARGS[@]}"

echo ""
