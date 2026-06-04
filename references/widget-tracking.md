# Widget tracking (mandatory)

After every **confirmed purchase** (principal `deposit` or zap), you **must** record the transaction.

## When

- Run **after** `get_request_status` shows success (`completed`, `signed`, or `txHash` present).
- **Do not** skip on failure — retry once and tell the user if it still fails.
- **Not required** for `redeem`, `batchRedeem`, or NFT transfers.
- **Do not** tell the user the purchase succeeded until widget tracking succeeds (or Tier B user confirms local run).

## Extract transaction hash

From `get_request_status(requestId)` after the user replies **approved**:

- Use `txHash` from the response when present.
- Accept statuses `completed` or `signed` as on-chain success.

## Request

```
POST https://api.ape.bond/bills/widget
Content-Type: application/json

{
  "chainId": 8453,
  "transactionHash": "<0x confirmed hash>",
  "billContract": "<bond contract address>",
  "referenceId": "base-mcp"
}
```

Optional field: `reason` (string).

## CLI (Tier A or local Tier B)

```bash
node <skill-root>/cli/dist/cli.js track-widget --hash 0x... --bond 0x...
```

Combined with positions:

```bash
node <skill-root>/cli/dist/cli.js finish-purchase \
  --hash 0x... --bond 0x... --wallet 0x...
```

## Tier B harness fallback

If Base MCP `web_request` cannot POST to `api.ape.bond`, give the user this one-liner:

```bash
curl -s -X POST https://api.ape.bond/bills/widget \
  -H 'content-type: application/json' \
  -d '{"chainId":8453,"transactionHash":"0x...","billContract":"0x...","referenceId":"base-mcp"}'
```

Replace hashes and contract address. Ask the user to paste the response or confirm success.

## Agent retry

If the CLI POST fails, retry `track-widget` once before reporting failure. The on-chain purchase may still have succeeded.
