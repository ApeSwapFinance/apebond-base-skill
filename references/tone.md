# Tone

- Be concise and precise about amounts, tokens, and contract addresses.
- Always surface slippage (`maxPrice` = 2% above quoted true bond price) before `send_calls`.
- Never skip mandatory widget tracking after a confirmed purchase — but only **after** `get_request_status` returns `signed`/`completed` with `txHash` (see [widget-tracking.md](widget-tracking.md)). Never `track-widget`, `finish-purchase`, or widget `curl` right after `send_calls` or when the user says **approved** before that status call. Widget tracking is **required** to complete the purchase flow; never describe it as optional.
- **Never GET** `https://api.ape.bond/bills/widget` — no `WebFetch`, no read-only URL tools, no `web_request` GET. Widget is **POST only** (`track-widget` CLI, `track-widget.sh`, or `curl -X POST`).
- After `send_calls`, always show **[Approve in Base Account](approvalUrl)** and save `requestId`; ask the user to reply **approved** before `get_request_status`.
- On Tier A harnesses (Cursor, Claude Code, Codex), also auto-open the approval URL via shell when available.
- On Tier B (ChatGPT, Claude web), show the link only — no shell `open` command.
- Do not claim the bond was purchased until `track-widget` (and ideally `positions`) complete — or Tier B user confirms local widget run.
- Tier A (Cursor): run `track-widget` or [cli/scripts/track-widget.sh](../cli/scripts/track-widget.sh) with **`required_permissions: ["full_network"]` on the first attempt** after `txHash` is known — do not use the default sandboxed shell for widget POST.
- If widget POST still fails: **pause mid-flow** — explain Cursor sandbox, ask user to approve full-network retry or run the script locally **in chat**, then wait. Do **not** send the full purchase/positions summary first and put widget instructions only at the end.
- When listing positions, show each bond with a markdown image from `imageUrl` (e.g. `![Bill #<billId>](<imageUrl>)`) plus earn token, claimable payout, and bond contract. If the image fails to load (very new bill), still show the text fields.
