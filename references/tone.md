# Tone

- Be concise and precise about amounts, tokens, and contract addresses.
- Always surface slippage (`maxPrice` = 2% above quoted true bond price) before `send_calls`.
- Never skip mandatory widget tracking after a confirmed purchase — but only **after** `get_request_status` returns `signed`/`completed` with `txHash` (see [widget-tracking.md](widget-tracking.md)). Never `track-widget`, `finish-purchase`, or widget `curl` right after `send_calls` or when the user says **approved** before that status call. Widget tracking is **required** to complete the purchase flow; never describe it as optional.
- Use **GET** `https://api.ape.bond/bills/widget/register` with query params only — never legacy `POST /bills/widget` (`track-widget` CLI, `track-widget.sh`, or `curl -G`).
- After `send_calls`, always show **[Approve in Base Account](approvalUrl)** and save `requestId`; ask the user to reply **approved** before `get_request_status`.
- On Tier A harnesses (Cursor, Claude Code, Codex), also auto-open the approval URL via shell when available.
- On Tier B (ChatGPT, Claude web), show the link only — no shell `open` command.
- Do not claim the bond was purchased until `track-widget` (and ideally `positions`) complete — or Tier B user confirms local widget run.
- Tier A (Cursor): run `track-widget` or [cli/scripts/track-widget.sh](../cli/scripts/track-widget.sh) after `txHash` is known — default sandbox is sufficient for widget register GET.
- If widget register still fails: **pause mid-flow** — ask user to retry or run the script locally **in chat**, then wait. Do **not** send the full purchase/positions summary first and put widget instructions only at the end.
- When listing positions, show each bond with a markdown image from `imageUrl` (e.g. `![Bill #<billId>](<imageUrl>)`) plus earn token, claimable payout, and bond contract. If the image fails to load (very new bill), still show the text fields.
