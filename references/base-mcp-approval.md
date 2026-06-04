# Base MCP approval and purchase completion

Aligned with [Base approval-mode](https://docs.base.org/ai-agents/skills/references/approval-mode.md).

**Load this file before any `send_calls` for purchases, claims, or transfers.**

Today Base MCP uses **approval mode only**: every write returns an `approvalUrl` and `requestId`. The user must approve in Base Account before funds move.

---

## After `send_calls` (all tiers)

1. Read `approvalUrl` and `requestId` from the MCP response.
2. Tell the user to open **Approve in Base Account** (use that label, not the raw hostname).
3. Include the link in markdown: `[Approve in Base Account](<approvalUrl>)`.
4. Store `requestId` in your reply so the session can resume.
5. **Do not** report success until post-approval steps below are done (for purchases).

### Forbidden before approval (purchases)

Until `get_request_status` returns `signed` or `completed` **with** `txHash`, do **not** run:

- `track-widget` or `finish-purchase` (CLI)
- [cli/scripts/track-widget.sh](../cli/scripts/track-widget.sh) or any widget register `curl`
- Base MCP `web_request` GET to `https://api.ape.bond/bills/widget/register?...`

Saying **approved** is not enough — you must read `txHash` from `get_request_status` first. See [widget-tracking.md](widget-tracking.md).

### Tier A harness (Cursor, Claude Code, Codex)

When a shell is available, **also** open the link automatically (print the link anyway as fallback):

| OS | Command |
|----|---------|
| macOS | `open "<approvalUrl>"` |
| Linux | `xdg-open "<approvalUrl>"` |
| Windows | `start "" "<approvalUrl>"` |

### Tier B chat (ChatGPT, Claude web/Desktop)

**Link only** — do not run shell `open` commands (no shell / will error).

---

## Wait for approval (user-first)

**Default:** Do not poll in a tight loop.

Ask the user:

> Reply **approved** when you have confirmed the transaction in Base Account.

Only after the user confirms (or explicitly asks you to wait and poll), call `get_request_status` with the saved `requestId`.

### Optional polling (Tier A or on user request)

- Interval: **5 seconds**
- Max duration: **~2 minutes** (about 24 attempts)
- Stop when status is terminal or `txHash` is present
- If still `pending` after max duration: tell the user to open the approval link again or reject the stale request

---

## `get_request_status` terminal states

| Status / field | Action |
|----------------|--------|
| `pending` | User has not approved yet; do not claim success |
| `completed` | Success — extract `txHash` if present |
| `signed` | Success — extract `txHash` (common on Base MCP) |
| Any response with `txHash` | Treat as success for on-chain purchase |
| `failed` | Stop; explain rejection or expiry; do not run `track-widget` |

Never tell the user the bond was purchased until status is success **and** mandatory post-steps below finish (for buys).

---

## Post-success: purchases only

After a confirmed **purchase** (`deposit` or zap):

### Tier A (shell + CLI)

**Only after** `get_request_status` returns `txHash` (not while status is `pending`):

1. **Widget register (required)** — GET `/bills/widget/register` with query params. **Cursor:** WebFetch the full URL first ([widget-tracking.md](widget-tracking.md)). **Else:** `track-widget` or [cli/scripts/track-widget.sh](../cli/scripts/track-widget.sh) with shell network ([agent-network.md](agent-network.md)).  
   If it fails: **stop here** — retry WebFetch, fix `sandbox.json`, or user runs script locally. Do **not** jump to step 2–3 or a final summary yet. See [widget-tracking.md](widget-tracking.md) (“inline handoff”).
2. `node <skill-root>/cli/dist/cli.js positions <wallet>` (after widget succeeds)
3. Or combined: `finish-purchase --hash … --bond … --wallet …` (after widget succeeds)

Purchase may still be on-chain if widget fails — say that **when pausing**, not only in a footnote after positions.

### Tier B (chat-only)

1. Agent: `get_request_status` → `txHash`
2. User runs locally (give exact commands):

```bash
node <skill-root>/cli/dist/cli.js track-widget --hash <txHash> --bond <bondContract>
node <skill-root>/cli/dist/cli.js finish-purchase --hash <txHash> --bond <bondContract> --wallet <wallet>
```

Or `curl -G` from [widget-tracking.md](widget-tracking.md).

3. User pastes CLI output, or agent confirms widget `ok` from paste.

**Do not** mark the flow complete if `track-widget` was skipped for a purchase.

---

## Claims and transfers

Same approval link flow (`send_calls` → link → user **approved** → `get_request_status`).

**No** `track-widget` for `redeem`, `batchRedeem`, or NFT `safeTransferFrom`.

---

## Guardrails

- Call `send_calls` only when the user is ready to approve immediately (avoid long-lived `pending` batches).
- For purchases, complete [plugins/apebond-base.md](../plugins/apebond-base.md) orchestration through positions (or Tier B handoff).
- Refer approval destination as **Base Account**, not Coinbase Keys hostname in user-facing text.
