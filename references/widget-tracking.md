# Widget tracking (mandatory)

After every **confirmed purchase** (principal `deposit` or zap), you **must** record the transaction with `GET https://api.ape.bond/bills/widget/register`. The purchase flow is **not complete** until this GET succeeds (2xx). This is required protocol analytics — not optional, not "nice to have," and not separate from "the buy succeeded on-chain."

**Not required** for `redeem`, `batchRedeem`, or NFT transfers.

---

## Endpoint (use this only)

Register purchases via **GET** with query parameters:

```
GET https://api.ape.bond/bills/widget/register?chainId=8453&transactionHash=<0x...>&billContract=<0x...>&referenceId=base-mcp
```

Optional query param: `reason` (string).

**Deprecated — do not use:**

| Forbidden | Why |
| --- | --- |
| `POST https://api.ape.bond/bills/widget` | Legacy path; blocked in many agent sandboxes |
| Bare `GET https://api.ape.bond/bills/widget` | Wrong path — use `/bills/widget/register` |
| Widget tracking before `txHash` is known | Use `get_request_status` for tx status first |

**Allowed** ways to run widget tracking (after `txHash` from `get_request_status`):

1. `node <skill-root>/cli/dist/cli.js track-widget --hash … --bond …`
2. `<skill-root>/cli/scripts/track-widget.sh …` (`curl -G …`)
3. Base MCP `web_request` GET to the full register URL
4. Explicit shell `curl -G` with query params from [Query parameters](#query-parameters) below

On **Cursor / Tier A**, the default sandbox can reach this GET endpoint — **no** `full_network` permission is required for widget register unless a retry still fails.

---

## Hard gate (agents must follow in order)

Do **not** run widget tracking until **all** of steps 1–2 are complete.

| Step | Required | Forbidden |
|------|----------|-----------|
| 1 | User replied **approved** in Base Account (or agent polled `get_request_status` with user consent) | — |
| 2 | `get_request_status(requestId)` → status `signed` or `completed` **and** `txHash` present | `track-widget`, `finish-purchase`, widget `curl`, `web_request` GET to register URL |
| 3 | Widget register GET using **`txHash` from step 2 only** (never `requestId`, never a guessed hash) | Register before step 2 |
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
- If there is no `txHash`, stop and ask the user to finish approval or reject the stale request — do not widget register.

---

## Query parameters

| Param | Required | Value |
| --- | --- | --- |
| `chainId` | yes | `8453` |
| `transactionHash` | yes | Confirmed hash from `get_request_status` |
| `billContract` | yes | Bond contract address |
| `referenceId` | yes | `base-mcp` |
| `reason` | no | Optional string |

Example URL:

```
https://api.ape.bond/bills/widget/register?chainId=8453&transactionHash=0x2ea849ba136211037fca6334b21c56026020171d5e39288c24dce2922722a6be&billContract=0x4075b614e75cb4aed6c8de4b0180e3d2bede4308&referenceId=base-mcp
```

---

## Tier A — Cursor, Claude Code, Codex (shell)

**Preferred** (after step 2):

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

### If widget register still fails (inline handoff — do not skip ahead)

**Stop the flow in the same turn.** Do **not** yet send the final purchase summary or positions table.

Tell the user immediately, in chat:

1. On-chain buy **is** confirmed (`txHash` + BaseScan link).
2. Widget register GET failed (network or API error).
3. Ask them to choose **one** path **now** (still in this thread):
   - **A)** Retry the same command (CLI or script).
   - **B)** Run locally and paste the result:

```bash
<skill-root>/cli/scripts/track-widget.sh <txHash> <bondContract>
```

4. **Wait** for success (`{"ok":true,...}` from CLI or empty/2xx from curl) or user confirmation before step 4 (`positions`) and before saying the purchase flow is complete.

**Forbidden pattern:** Returning a full "Purchase confirmed" + positions summary and only adding "widget tracking failed, run this curl at the end" as a footnote.

See [host-setup.md](host-setup.md) (Tier A sandbox).

---

## Shell script fallback (all tiers, after step 2)

Canonical one-liner — same params as [cli/src/apis.ts](../cli/src/apis.ts):

```bash
<skill-root>/cli/scripts/track-widget.sh <txHash> <bondContract> [reason]
```

Example:

```bash
./cli/scripts/track-widget.sh \
  0x2ea849ba136211037fca6334b21c56026020171d5e39288c24dce2922722a6be \
  0x4075b614e75cb4aed6c8de4b0180e3d2bede4308
```

Uses `curl -fsS -G` (fails on HTTP errors). Success is any **2xx** response.

---

## Tier B — ChatGPT / Claude web

After the agent runs step 2 via `get_request_status`:

1. Give the user the exact `track-widget.sh` or CLI command with real `txHash` and bond address.
2. Or use Base MCP `web_request` GET to the full register URL.
3. User runs locally and pastes output, or confirms HTTP success.
4. Agent must not mark the purchase flow complete until widget tracking succeeds.

---

## Agent retry

If the register GET fails **after** step 2:

1. Retry **once** in the **same turn**.
2. If still failing → **inline handoff** (section above); pause until resolved.
3. On-chain purchase may still have succeeded — state that **when you pause**, not only in a closing footnote.

**Do not** tell the user the purchase **flow** is complete until widget tracking succeeds (or Tier B user confirms a local run in chat).
