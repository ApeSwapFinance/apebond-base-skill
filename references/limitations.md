# Limitations

## web_request allowlist

`realtime-api.ape.bond`, `api.ape.bond`, and `zap-api.ape.bond` may **not** be on Base MCP's `web_request` allowlist. Use:

- This repo's **CLI** (shell), or
- Harness HTTP / `curl`, or
- User-pasted JSON

## Consumer chat apps (Claude.ai / ChatGPT)

- **POST** endpoints (`tier-signature`, Soul Zap, `/bills/widget`) may require shell access.
- Zap buys are **harness-only** unless the user can run `prepare-zap-buy` locally.

## Scope

- **Base mainnet only** (8453) in v1.
- No Solana / Aptos / Sui / Pre-TGE flows.

## Future

- Request Base allowlist for `GET realtime-api.ape.bond/bonds`.
- Optional hosted `GET /prepare/*` tx-builder if consumer UX needs it.
