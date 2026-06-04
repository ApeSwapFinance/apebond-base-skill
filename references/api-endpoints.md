# API endpoints

## Realtime API (read)

```
GET https://realtime-api.ape.bond/bonds?chainId=8453
GET https://realtime-api.ape.bond/bonds?chainId=8453&bond=<bondContract>
GET https://realtime-api.ape.bond/utils/bonds
```

- **`/bonds`:** live / active bond economics for buying (`trueBillPrice`, `soldOut`, vesting, tiers).
- **`/utils/bonds`:** full catalog (SDK bonds list). CLI uses this only to attach `earnToken` symbols to **positions**; discovery is on-chain via Base Bill NFT `0xD8C7fe06E24A2862d78D0F1BF040bA79463d9351` (`allTokensDataOfOwner` + per-bond `claimablePayout`).

**Fallback:** If Base MCP `web_request` rejects this host, use the harness shell (Tier A) or ask the user to run locally (Tier B):

```bash
node <skill-root>/cli/dist/cli.js list-bonds
```

Or `curl` the URL and paste JSON into chat. See [host-setup.md](host-setup.md).

## API v2 (write-side helpers)

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/tier-signature` | POST | V4 tier proof bytes for `deposit` |
| `/bills/widget` | POST | **Mandatory** purchase analytics (`referenceId: base-mcp`) |

Base URL: `https://api.ape.bond`

## Soul Zap (zap buy)

```
POST https://zap-api.ape.bond/zap
```

JSON body built by CLI `prepare-zap-buy` (chain `bas`, `protocolData.protocol: ApeBond`). Returns `txData.to` / `txData.data` for a single `send_calls` entry (plus optional approve to SoulZap TokenManager on Base).

## Price API (optional)

```
GET https://price-api.ape.bond/realtime/price?token=<address>&chain=8453
```

Used for USD display only; not required for calldata.
