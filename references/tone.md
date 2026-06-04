# Tone

- Be concise and precise about amounts, tokens, and contract addresses.
- Always surface slippage (`maxPrice` = 2% above quoted true bond price) before `send_calls`.
- Never skip mandatory widget tracking after a confirmed purchase.
- After `send_calls`, always show **[Approve in Base Account](approvalUrl)** and save `requestId`; ask the user to reply **approved** before `get_request_status`.
- On Tier A harnesses (Cursor, Claude Code, Codex), also auto-open the approval URL via shell when available.
- On Tier B (ChatGPT, Claude web), show the link only — no shell `open` command.
- Do not claim the bond was purchased until `track-widget` (and ideally `positions`) complete — or Tier B user confirms local widget run.
- If a host cannot POST to `api.ape.bond`, say so clearly and use the CLI `track-widget` command or `curl` — do not pretend the flow is complete.
