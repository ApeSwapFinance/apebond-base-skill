# Limitations

## Host capability tiers

Not every AI host can run the full buy flow in chat. See [host-setup.md](host-setup.md):

| Tier | Hosts | In-chat CLI | Full buy without local handoff |
|------|-------|-------------|----------------------------------|
| A | Cursor, Claude Code, Codex | Yes | Yes |
| B | ChatGPT, Claude web/Desktop | No | No — user runs prepare + track-widget locally |
| C | Hermes | Varies | Depends on shell |

Agents must identify the tier before promising `prepare-buy` or `track-widget` in chat.

## Agent HTTP (Cursor vs Base MCP)

See [agent-network.md](agent-network.md) for the full matrix.

**Cursor:** WebFetch usually reaches both `realtime-api.ape.bond` and `api.ape.bond`; default sandbox **`curl` often does not** (403). Agents must prefer **WebFetch** for bond discovery and widget register, or add hosts via [sandbox.json.example](../sandbox.json.example).

## web_request allowlist (Base MCP)

`realtime-api.ape.bond`, `api.ape.bond`, and `zap-api.ape.bond` are **not** on Base MCP's `web_request` allowlist today. Use:

- **WebFetch** (Cursor) for GET bond discovery and widget register, or
- This skill's **CLI** (shell with network / `sandbox.json`), or
- User-pasted JSON

How to request Base allowlist: [agent-network.md](agent-network.md#request-base-mcp-web_request-allowlist).

## Consumer chat apps (ChatGPT / Claude web) — Tier B

- **POST** endpoints (`tier-signature`, Soul Zap) require shell or local CLI.
- User must run `prepare-buy` locally and paste `transactions[]` before `send_calls`.
- After approval and `get_request_status` → `txHash`, user must run `track-widget` or [cli/scripts/track-widget.sh](../cli/scripts/track-widget.sh) locally unless the agent shell has network — see [widget-tracking.md](widget-tracking.md).

## Cursor / Tier A sandbox

Default agent sandbox **`curl`** to `*.ape.bond` often fails (`CONNECT tunnel failed`, `403`) for **both** `api.ape.bond` and `realtime-api.ape.bond`. Bond discovery that "worked" was likely **WebFetch**, not shell.

Widget register: **GET** `/bills/widget/register` via **WebFetch first**; CLI/script second with [sandbox.json](../sandbox.json.example) or `full_network`. If register still fails, **pause in chat** — [widget-tracking.md](widget-tracking.md). Do not register before `get_request_status` returns `txHash`.
- Zap buys are **Tier A** in-agent unless the user runs `prepare-zap-buy` locally.

For a smoother experience on Tier B, use **Cursor**, **Claude Code**, or **Codex** (Tier A).

## Base MCP approval mode

There is no setting to spend the full wallet without per-transaction approval. Every `send_calls` returns an approval link. See [base-mcp-approval.md](base-mcp-approval.md).

## Position bond images

`imageUrl` in `positions` output points at `GET api.ape.bond/bills/single/.../image` (302 to IPFS/CDN). Very new bills may return **404** until metadata/image is generated — show `billId`, earn token, and claimable text even if the image does not load.

## Scope

- **Base mainnet only** (8453) in v1.
- No Solana / Aptos / Sui / Pre-TGE flows.

## Future

- Base allowlist for `api.ape.bond`, `realtime-api.ape.bond`, `zap-api.ape.bond` on `web_request` — request template in [agent-network.md](agent-network.md).
- Optional hosted `GET /prepare/*` tx-builder if consumer UX needs it.
