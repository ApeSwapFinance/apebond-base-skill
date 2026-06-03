# ApeBond Base Plugin

> [!IMPORTANT]
> ## STOP — COMPLETE BASE MCP ONBOARDING FIRST
>
> Before any ApeBond action:
> 1. Confirm Base MCP is connected (tools like `get_wallets`, `send_calls` available). If not → [Base MCP quickstart](https://docs.base.org/ai-agents/quickstart).
> 2. Run onboarding from the parent [SKILL.md](../SKILL.md) (`get_wallets`, disclaimer).
>
> The user wallet address is required for prepare steps and on-chain reads.

ApeBond sells **vesting bonds** on **Base (8453)**. This plugin discovers bonds via the realtime API, builds unsigned calldata (CLI recommended), executes with Base MCP `send_calls`, and **must** report purchases to `POST /bills/widget` with `referenceId: "base-mcp"`.

**Supported chain:** Base mainnet only. Use `chain: "base"` in `send_calls`.

**CLI (recommended):** From this skill repo, `cd cli && npm install && npm run build`. See [references/api-endpoints.md](../references/api-endpoints.md).

---

## Read endpoints

```
GET https://realtime-api.ape.bond/bonds?chainId=8453
GET https://realtime-api.ape.bond/bonds?chainId=8453&bond=<bondContract>
```

CLI: `node dist/cli.js list-bonds` · `node dist/cli.js positions <wallet>`

Validate: `soldOut !== true`, sufficient `tokensRemaining` / capacity for the intended size.

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

---

## Mandatory widget tracking

After a **confirmed** purchase (not claim/transfer):

```
POST https://api.ape.bond/bills/widget
{ "chainId": 8453, "transactionHash": "0x...", "billContract": "0x...", "referenceId": "base-mcp" }
```

CLI: `track-widget --hash 0x... --bond 0x...`

Full rules: [references/widget-tracking.md](../references/widget-tracking.md).

---

## Orchestration: buy with principal token

```
1. get_wallets → from address
2. GET /bonds?chainId=8453&bond=<bond>  (or CLI list-bonds)
3. CLI: prepare-buy --bond ... --amount ... --from ... [--with-tiers]
4. send_calls(chain="base", calls from transactions[])
5. User approves → get_request_status(requestId) until confirmed
6. CLI: track-widget --hash <tx> --bond <bond>   # MANDATORY
7. Confirm success to user (include tx hash + widget recorded)
```

## Orchestration: buy via zap

```
1–2. Same discovery
3. CLI: prepare-zap-buy (requires shell; Soul Zap is POST)
4–7. Same as principal buy (single or approve+zap batch; track-widget mandatory)
```

Native ETH input: `--from-token 0x0000000000000000000000000000000000000000`

## Orchestration: claim

```
1. positions <wallet> → billId + bondContract
2. prepare-redeem OR prepare-batch-redeem
3. send_calls → get_request_status
(No widget POST)
```

## Orchestration: transfer bond NFT

```
1. Resolve billNnftAddress for the bond (bond list / bond detail metadata)
2. prepare-transfer --nft <billNnft> ...
3. send_calls → get_request_status
```

---

## Protocol notes

- **maxPrice** uses 2% above quoted true bond price (same as the web app).
- **minTier**: if bond requires a tier the wallet does not meet, `deposit` may revert — check bond payload before preparing.
- **Zap** approves SoulZap TokenManager on Base (`0x0B750790dCa8f289fAB5eFd1a48EfAb969e51D16`), not the bond contract.
- **Fees** are reflected in `trueBillPriceWithFee` / `trueBondPrices` from realtime-api.

## Limitations

[references/limitations.md](../references/limitations.md)
