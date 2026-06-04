# API endpoints

## Realtime API (read)

```
GET https://realtime-api.ape.bond/bonds?chainId=8453
GET https://realtime-api.ape.bond/bonds?chainId=8453&bond=<bondContract>
GET https://realtime-api.ape.bond/utils/bonds
```

- **`/bonds`:** live / active bond economics for buying (`trueBillPrice`, `soldOut`, vesting, tiers). Bonds with `hide: true` are excluded by the CLI and should be ignored when agents parse this response.
- **`/utils/bonds`:** full catalog (SDK bonds list). CLI uses this only to attach `earnToken` symbols to **positions**; discovery is on-chain via Base Bill NFT `0xD8C7fe06E24A2862d78D0F1BF040bA79463d9351` (`allTokensDataOfOwner` + per-bond `claimablePayout`).

**Agent access (Cursor):** Prefer **WebFetch** to the URLs above. Default sandbox `curl` often returns `403` for `*.ape.bond` — see [agent-network.md](agent-network.md).

**Fallback:** CLI `list-bonds` with shell network, user-pasted JSON (Tier B), or Base MCP `web_request` once allowlisted:

```bash
node <skill-root>/cli/dist/cli.js list-bonds
```

## API v2 (write-side helpers)

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/tier-signature` | POST | V4 tier proof bytes for `deposit` |
| `/bills/widget/register` | GET | **Mandatory** purchase analytics (`referenceId: base-mcp`) — see [widget-tracking.md](widget-tracking.md) |

Base URL: `https://api.ape.bond`

**Deprecated:** legacy `POST /bills/widget`. Register via **WebFetch** (Cursor), CLI `track-widget`, `track-widget.sh`, or `curl -G` — see [widget-tracking.md](widget-tracking.md) and [agent-network.md](agent-network.md).

### Bill NFT image (positions display)

```
GET https://api.ape.bond/bills/single/:chainId/:contract/:billId/image
```

- **`:chainId`:** `8453` on Base.
- **`:contract`:** Base Bill NFT `0xD8C7fe06E24A2862d78D0F1BF040bA79463d9351`.
- **`:billId`:** Bill NFT `tokenId` (same as `billId` in `positions` CLI output).

Responds with **302** to the bond art URL (IPFS/CDN) when metadata exists; **404** if no image yet. The CLI adds a deterministic `imageUrl` per position (no fetch required). Agents should render markdown images from `imageUrl` when summarizing holdings.

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
