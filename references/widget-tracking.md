# Widget tracking (mandatory)

After every **confirmed purchase** (principal `deposit` or zap), you **must** record the transaction with `POST https://api.ape.bond/bills/widget`.

**Not required** for `redeem`, `batchRedeem`, or NFT transfers.

---

## Hard gate (agents must follow in order)

Do **not** run widget tracking until **all** of steps 1–2 are complete.

| Step | Required | Forbidden |
|------|----------|-----------|
| 1 | User replied **approved** in Base Account (or agent polled `get_request_status` with user consent) | — |
| 2 | `get_request_status(requestId)` → status `signed` or `completed` **and** `txHash` present | `track-widget`, `finish-purchase`, widget `curl`, `web_request` POST to `/bills/widget` |
| 3 | Widget POST using **`txHash` from step 2 only** (never `requestId`, never a guessed hash) | POST before step 2 |
| 4 | `positions` or `finish-purchase` | Tell the user the purchase flow succeeded if step 3 failed without Tier B handoff |

**Never** call `track-widget`, `finish-purchase`, or the shell script below:

- Immediately after `send_calls` (before user approval)
- When the user says **approved** but **before** `get_request_status` returns `txHash`
- When status is still `pending` or `failed`

See [base-mcp-approval.md](base-mcp-approval.md) for the full approval flow.

---

## Extract transaction hash

From `get_request_status(requestId)` **after** step 1:

- Use `txHash` from the response when present.
- Accept statuses `completed` or `signed` as on-chain success.
- If there is no `txHash`, stop and ask the user to finish approval or reject the stale request — do not widget POST.

---

## Request body

```
POST https://api.ape.bond/bills/widget
Content-Type: application/json

{
  "chainId": 8453,
  "transactionHash": "<0x confirmed hash from get_request_status>",
  "billContract": "<bond contract address>",
  "referenceId": "base-mcp"
}
```

Optional field: `reason` (string).

---

## Tier A — Cursor, Claude Code, Codex (shell)

**Preferred** (after step 2):

```bash
node <skill-root>/cli/dist/cli.js track-widget --hash <txHash> --bond <bondContract>
```

**Combined** with positions:

```bash
node <skill-root>/cli/dist/cli.js finish-purchase \
  --hash <txHash> --bond <bondContract> --wallet <wallet>
```

### Sandbox / network (Cursor and similar harnesses)

Widget POST reaches `api.ape.bond` over the public internet. The default agent shell sandbox often blocks it (`ENOTFOUND`, `CONNECT tunnel failed`, `403`).

When `track-widget` or `curl` fails with DNS or tunnel errors:

1. **Retry once** with shell **outside the sandbox** — in Cursor, pass `required_permissions: ["full_network"]`; if still blocked, use `["all"]`.
2. Do **not** retry before step 2 (approval + `txHash`).
3. Prefer the canonical script below over ad-hoc `curl` copy/paste.

See [host-setup.md](host-setup.md) (Tier A sandbox).

---

## Shell script fallback (all tiers, after step 2)

Canonical one-liner — same payload as [cli/src/apis.ts](../cli/src/apis.ts):

```bash
<skill-root>/cli/scripts/track-widget.sh <txHash> <bondContract> [reason]
```

Example:

```bash
./cli/scripts/track-widget.sh \
  0x2ea849ba136211037fca6334b21c56026020171d5e39288c24dce2922722a6be \
  0x4075b614e75cb4aed6c8de4b0180e3d2bede4308
```

Uses `curl -fsS` (fails on HTTP errors). Success is any **2xx** response.

Tier A agents: run this script with **full network** permissions if the CLI POST fails in sandbox.

---

## Tier B — ChatGPT / Claude web

Base MCP `web_request` usually **cannot** POST to `api.ape.bond`. After the agent runs step 2 via `get_request_status`:

1. Give the user the exact `track-widget.sh` or CLI command with real `txHash` and bond address.
2. User runs locally and pastes output, or confirms HTTP success.
3. Agent must not mark the purchase flow complete until widget tracking succeeds.

---

## Agent retry

If the POST fails **after** step 2:

- Retry `track-widget` or `track-widget.sh` **once** with full network (Tier A).
- The on-chain purchase may still have succeeded; say so clearly if widget tracking still fails after retry.

**Do not** tell the user the purchase succeeded until widget tracking succeeds (or Tier B user confirms a local run).
