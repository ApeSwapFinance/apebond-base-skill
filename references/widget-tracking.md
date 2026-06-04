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
| 3 | Widget POST using **`txHash` from step 2 only** (never `requestId`, never a guessed hash); Cursor: **`full_network` on first try** | POST before step 2; default sandbox only |
| 4 | `positions` or `finish-purchase` | Final purchase summary **before** step 3 succeeds |
| 5 | Final success message | Widget failure only as a footnote after positions summary |

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

### Cursor: run widget POST outside sandbox on the first try

The default agent shell **cannot** reach `api.ape.bond` (`ENOTFOUND`, `CONNECT tunnel failed`, `403`). That is a **Cursor harness limitation**, not a bad transaction.

**On step 3, always** invoke the shell with network from the start:

- Cursor: `required_permissions: ["full_network"]` on the tool call
- If it still fails: retry once with `required_permissions: ["all"]`

Do **not** run `track-widget` / `track-widget.sh` in the default sandbox first and only mention network at the end of the chat.

**Preferred** (after step 2, **with full network**):

```bash
node <skill-root>/cli/dist/cli.js track-widget --hash <txHash> --bond <bondContract>
```

Or:

```bash
<skill-root>/cli/scripts/track-widget.sh <txHash> <bondContract>
```

**Combined** with positions (after widget succeeds):

```bash
node <skill-root>/cli/dist/cli.js finish-purchase \
  --hash <txHash> --bond <bondContract> --wallet <wallet>
```

### If widget POST still fails (inline handoff — do not skip ahead)

**Stop the flow in the same turn.** Do **not** yet send the final purchase summary or positions table.

Tell the user immediately, in chat:

1. On-chain buy **is** confirmed (`txHash` + BaseScan link).
2. Widget analytics POST failed because this environment blocks outbound HTTP to `api.ape.bond`.
3. Ask them to choose **one** path **now** (still in this thread):
   - **A)** Approve you to re-run the same command with full network / outside sandbox (Cursor permission prompt).
   - **B)** Run locally and paste the result:

```bash
<skill-root>/cli/scripts/track-widget.sh <txHash> <bondContract>
```

4. **Wait** for success (`{"ok":true,...}` from CLI or empty/2xx from curl) or user confirmation before step 4 (`positions`) and before saying the purchase flow is complete.

**Forbidden pattern:** Returning a full “Purchase confirmed” + positions summary and only adding “widget tracking failed, run this curl at the end” as a footnote.

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

1. Retry **once** in the **same turn** with `full_network` / `all` (Tier A).
2. If still failing → **inline handoff** (section above); pause until resolved.
3. On-chain purchase may still have succeeded — state that **when you pause**, not only in a closing footnote.

**Do not** tell the user the purchase **flow** is complete until widget tracking succeeds (or Tier B user confirms a local run in chat).
