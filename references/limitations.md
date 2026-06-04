# Limitations

## Host capability tiers

Not every AI host can run the full buy flow in chat. See [host-setup.md](host-setup.md):

| Tier | Hosts | In-chat CLI | Full buy without local handoff |
|------|-------|-------------|----------------------------------|
| A | Cursor, Claude Code, Codex | Yes | Yes |
| B | ChatGPT, Claude web/Desktop | No | No — user runs prepare + track-widget locally |
| C | Hermes | Varies | Depends on shell |

Agents must identify the tier before promising `prepare-buy` or `track-widget` in chat.

## web_request allowlist

`realtime-api.ape.bond`, `api.ape.bond`, and `zap-api.ape.bond` may **not** be on Base MCP's `web_request` allowlist. Use:

- This skill's **CLI** (shell), or
- Harness HTTP / `curl`, or
- User-pasted JSON

## Consumer chat apps (ChatGPT / Claude web) — Tier B

- **POST** endpoints (`tier-signature`, Soul Zap, `/bills/widget`) require shell or local CLI.
- User must run `prepare-buy` locally and paste `transactions[]` before `send_calls`.
- After approval, user must run `track-widget` or `curl` locally unless allowlisted — see [widget-tracking.md](widget-tracking.md).
- Zap buys are **Tier A** in-agent unless the user runs `prepare-zap-buy` locally.

For a smoother experience on Tier B, use **Cursor**, **Claude Code**, or **Codex** (Tier A).

## Base MCP approval mode

There is no setting to spend the full wallet without per-transaction approval. Every `send_calls` returns an approval link. See [base-mcp-approval.md](base-mcp-approval.md).

## Scope

- **Base mainnet only** (8453) in v1.
- No Solana / Aptos / Sui / Pre-TGE flows.

## Future

- Request Base allowlist for `GET realtime-api.ape.bond` on `web_request` for consumer chat apps.
- Optional hosted `GET /prepare/*` tx-builder if consumer UX needs it.
