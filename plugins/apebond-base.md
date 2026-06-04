# ApeBond Base Plugin

> [!IMPORTANT]
> ## STOP — COMPLETE BASE MCP ONBOARDING FIRST
>
> Before any ApeBond action:
> 1. Confirm Base MCP is connected (tools like `get_wallets`, `send_calls` available). If not → [Base MCP quickstart](https://docs.base.org/ai-agents/quickstart).
> 2. Run onboarding from the parent [SKILL.md](../SKILL.md) (`get_wallets`, disclaimer).
> 3. Load [references/host-setup.md](../references/host-setup.md) and identify **Tier A** vs **Tier B**.
> 4. Load [references/base-mcp-approval.md](../references/base-mcp-approval.md) before any `send_calls`.
>
> The user wallet address is required for prepare steps and on-chain reads.

ApeBond sells **vesting bonds** on **Base (8453)**. This plugin discovers bonds via the realtime API, builds unsigned calldata (CLI recommended), executes with Base MCP `send_calls`, and **must** report purchases to `POST /bills/widget` with `referenceId: "base-mcp"`.

**Supported chain:** Base mainnet only. Use `chain: "base"` in `send_calls`.

**CLI:** `node <skill-root>/cli/dist/cli.js …` — see [references/host-setup.md](../references/host-setup.md). Tier A: agent runs CLI. Tier B: user runs locally and pastes JSON.

---

## Read endpoints

```
GET https://realtime-api.ape.bond/bonds?chainId=8453
GET https://realtime-api.ape.bond/bonds?chainId=8453&bond=<bondContract>
```

CLI: `list-bonds` · `positions <wallet>` (on-chain Bill NFT `0xD8C7fe06E24A2862d78D0F1BF040bA79463d9351`, not active `/bonds` list). Each position row includes `imageUrl` — render bond art when presenting holdings (see [references/tone.md](../references/tone.md)).

Validate: `hide !== true`, `soldOut !== true`, sufficient `tokensRemaining` / capacity for the intended size.

---

## Prepare (CLI → send_calls)

All prepare commands print:

```json
{
  "transactions": [
    { "step": "approve", "to": "0x...", "data": "0x...", "value": "0x0", "chainId": 8453 }
  ]
}
```

Map each item to `send_calls`:

```json
{
  "chain": "base",
  "calls": [
    { "to": "<tx.to>", "value": "<tx.value>", "data": "<tx.data>" }
  ]
}
```

Execute the **full** `transactions` array in **one** `send_calls` when multiple steps are present.

| Action | CLI |
| --- | --- |
| Buy (principal token) | `prepare-buy --bond 0x... --amount <human> --from 0x... [--with-tiers]` |
| Buy (zap) | `prepare-zap-buy --bond 0x... --amount <human> --from 0x... --from-token 0x... [--with-tiers]` |
| Claim | `prepare-redeem --bond 0x... --bill-id <id>` |
| Claim many | `prepare-batch-redeem --bond 0x... --ids 1,2,3` |
| Transfer NFT | `prepare-transfer --nft <billNnft> --from 0x... --to 0x... --token-id <id>` |

Encoding details: [references/calldata-encoding.md](../references/calldata-encoding.md).

**Amount:** `--amount` is **human units** (e.g. `0.01` = 0.01 USDC, `10` = 10 USDC).

---

## Mandatory widget tracking

After a **confirmed** purchase (not claim/transfer), the flow is **incomplete** until widget POST succeeds:

```
POST https://api.ape.bond/bills/widget
{ "chainId": 8453, "transactionHash": "0x...", "billContract": "0x...", "referenceId": "base-mcp" }
```

**Forbidden:** GET or `WebFetch` on `/bills/widget` (POST only). **Required:** CLI `track-widget`, `track-widget.sh`, or `curl -X POST` — Tier A first try with **full network** permissions.

CLI: `track-widget --hash 0x... --bond 0x...` or `finish-purchase --hash … --bond … --wallet …`

Full rules: [references/widget-tracking.md](../references/widget-tracking.md).

---

## Orchestration: buy with principal token

### Tier A (Cursor, Claude Code, Codex)

```
1. get_wallets → from address
2. list-bonds or GET /bonds?chainId=8453&bond=<bond>
3. CLI: prepare-buy --bond … --amount … --from … [--with-tiers]
   - V4 bonds: prefer --with-tiers when api.ape.bond is reachable
4. send_calls(chain="base", calls from transactions[])
5. Post-send_calls — see references/base-mcp-approval.md:
   - Show Approve in Base Account link (+ open URL in shell harness)
   - Ask user to reply approved
   - Do NOT track-widget / widget curl / finish-purchase yet
6. get_request_status(requestId) → txHash (completed / signed)
   - If pending or no txHash: STOP — do not widget POST
7. Widget POST: track-widget or track-widget.sh — **first shell call uses full_network** (Cursor)
   - If POST fails: STOP — inline handoff in chat (approve retry or user runs script); do NOT send final summary yet
8. CLI: positions <wallet> (only after step 7 succeeds)
9. Confirm success (tx hash + widget recorded + position summary)
```

### Tier B (ChatGPT, Claude web/Desktop)

```
1. get_wallets → from address
2. Bond discovery: web_request GET if allowlisted, else user pastes bond info or runs list-bonds locally
3. User runs prepare-buy locally → pastes transactions[] JSON into chat
4. send_calls(chain="base", mapped calls)
5. base-mcp-approval.md (link only, user replies approved)
6. get_request_status → txHash
7. User runs track-widget and/or finish-purchase locally (give exact commands)
8. User pastes positions output OR runs positions locally and shares result
```

---

## Orchestration: buy via zap

**Tier A only** in-agent (Soul Zap is POST). Tier B: user runs `prepare-zap-buy` locally and pastes `transactions[]`.

```
1–2. Same discovery as principal buy
3. CLI: prepare-zap-buy (Tier A) or user-pasted JSON (Tier B)
4–9. Same post-send_calls as principal buy (track-widget mandatory)
```

Native ETH input: `--from-token 0x0000000000000000000000000000000000000000`

---

## Orchestration: claim

```
1. positions <wallet> → billId, bondContract, imageUrl (show bond images when summarizing)
2. prepare-redeem OR prepare-batch-redeem (Tier A) or pasted JSON (Tier B)
3. send_calls → base-mcp-approval.md → get_request_status
(No widget POST)
```

---

## Orchestration: transfer bond NFT

```
1. Resolve billNnftAddress for the bond (bond list / bond detail metadata)
2. prepare-transfer --nft <billNnft> …
3. send_calls → base-mcp-approval.md → get_request_status
```

---

## Protocol notes

- **maxPrice** uses 2% above quoted true bond price (same as the web app).
- **minTier**: if bond requires a tier the wallet does not meet, `deposit` may revert — check bond payload before preparing.
- **Zap** approves SoulZap TokenManager on Base (`0x0B750790dCa8f289fAB5eFd1a48EfAb969e51D16`), not the bond contract.
- **Fees** are reflected in `trueBillPriceWithFee` / `trueBondPrices` from realtime-api.
- Call `send_calls` only when the user can approve soon — stale `pending` requests block a clean flow.

## Limitations

[references/limitations.md](../references/limitations.md)
