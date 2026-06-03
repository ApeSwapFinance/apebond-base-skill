# API endpoints

## Realtime API (read)

```
GET https://realtime-api.ape.bond/bonds?chainId=8453
GET https://realtime-api.ape.bond/bonds?chainId=8453&bond=<bondContract>
```

Returns live bond economics: `trueBillPrice`, `trueBondPrices`, `lpToken`, `earnToken`, `soldOut`, vesting fields, `billVersion`, `minTier`.

**Fallback:** If Base MCP `web_request` rejects this host, use the harness shell:

```bash
cd <skill-repo>/cli && node dist/cli.js list-bonds
```

Or `curl` the URL and paste JSON into chat.

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
