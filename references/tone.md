# Tone

- Be concise and precise about amounts, tokens, and contract addresses.
- Always surface slippage (`maxPrice` = 2% above quoted true bond price) before `send_calls`.
- Never skip mandatory widget tracking after a confirmed purchase — but only **after** `get_request_status` returns `signed`/`completed` with `txHash` (see [widget-tracking.md](widget-tracking.md)). Never `track-widget`, `finish-purchase`, or widget `curl` right after `send_calls` or when the user says **approved** before that status call.
- After `send_calls`, always show **[Approve in Base Account](approvalUrl)** and save `requestId`; ask the user to reply **approved** before `get_request_status`.
- On Tier A harnesses (Cursor, Claude Code, Codex), also auto-open the approval URL via shell when available.
- On Tier B (ChatGPT, Claude web), show the link only — no shell `open` command.
- Do not claim the bond was purchased until `track-widget` (and ideally `positions`) complete — or Tier B user confirms local widget run.
- Tier A: run `track-widget` or [cli/scripts/track-widget.sh](../cli/scripts/track-widget.sh) with **full network** if sandbox blocks `api.ape.bond` (`ENOTFOUND`, tunnel `403`). Retry once after `txHash` is known — do not pretend the flow is complete.
- When listing positions, show each bond with a markdown image from `imageUrl` (e.g. `![Bill #<billId>](<imageUrl>)`) plus earn token, claimable payout, and bond contract. If the image fails to load (very new bill), still show the text fields.
