# Widget tracking (mandatory)

After every **confirmed purchase** (principal `deposit` or zap), you **must** record the transaction:

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

## When

- Run **after** `get_request_status` shows the purchase tx is confirmed.
- **Do not** skip on failure — retry once and tell the user if it still fails.
- **Not required** for `redeem`, `batchRedeem`, or NFT transfers.

## CLI

```bash
node dist/cli.js track-widget --hash 0x... --bond 0x...
```

## Harness fallback

If Base MCP `web_request` cannot POST to `api.ape.bond`, run the CLI or:

```bash
curl -s -X POST https://api.ape.bond/bills/widget \
  -H 'content-type: application/json' \
  -d '{"chainId":8453,"transactionHash":"0x...","billContract":"0x...","referenceId":"base-mcp"}'
```
