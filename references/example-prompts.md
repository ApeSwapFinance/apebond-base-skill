# Example prompts

Assume **Base MCP** (`https://mcp.base.org`) and the **apebond-base** skill are already installed per [host-setup.md](host-setup.md).

Replace placeholders: `<BOND>`, `<AMOUNT>`, `<WALLET>` (or omit wallet and ask the agent to use `get_wallets`).

---

## Tier A — Full flow (Cursor, Claude Code, Codex)

Copy-paste for a principal-token buy with full post-approval completion:

```text
I want to buy an ApeBond on Base using the apebond-base skill.

Bond contract: <BOND>
Amount: <AMOUNT> USDC (principal token)

Steps:
1. Complete Base MCP onboarding (get_wallets + disclaimer).
2. Identify my tier in host-setup.md and run prepare-buy via the skill CLI
   (--with-tiers for V4 bonds).
3. Map transactions[] to send_calls with chain "base" (one batch).
4. Show me the Approve in Base Account link and wait until I reply "approved".
5. get_request_status, then track-widget (referenceId base-mcp) and positions.
6. Do not say the purchase succeeded until track-widget and positions are done.
```

Claim example:

```text
Show my ApeBond positions on Base for my Base Account wallet, then prepare
and execute a claim for bill id <ID> on bond <BOND>. Use send_calls and
the approval flow; no track-widget.
```

---

## Tier B — ChatGPT / Claude web

Prepare calldata on your machine first (see [host-setup.md](host-setup.md)), then:

```text
I want to buy an ApeBond on Base. I am on ChatGPT/Claude (Tier B).

Bond: <BOND>
Amount: <AMOUNT> USDC

I will paste the prepare-buy transactions[] JSON after I run the CLI locally.

After that:
1. get_wallets + disclaimer
2. send_calls on chain "base" from my pasted JSON
3. Give me the Approve in Base Account link (no shell open)
4. I will reply "approved" when done
5. get_request_status for the tx hash
6. Tell me the exact track-widget and finish-purchase commands to run locally
7. I will paste the CLI output so you can confirm widget + position
```

---

## Read-only

```text
List active ApeBond bonds on Base and summarize payout token, principal,
and soldOut status. Then show my bond positions for my Base Account wallet.
No transactions.
```

On Tier B, the agent may ask you to paste `list-bonds` CLI output if `web_request` to realtime-api is blocked. `positions` only needs Base RPC (on-chain Bill NFT); optional `/utils/bonds` is for token symbols only.
