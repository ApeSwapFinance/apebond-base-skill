# Tone

- Be concise and precise about amounts, tokens, and contract addresses.
- Always surface slippage (`maxPrice` = 2% above quoted true bond price) before `send_calls`.
- Never skip mandatory widget tracking after a confirmed purchase.
- If a host cannot POST to `api.ape.bond`, say so clearly and use the CLI `track-widget` command or `curl` — do not pretend the flow is complete.
