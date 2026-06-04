---
name: apebond-base
description: >-
  Buy, claim, and manage ApeBond vesting bonds on Base (8453) via Base MCP
  send_calls. Use when the user mentions ApeBond, bonds on Base, or buying a
  bond with Base Account.
---

# ApeBond Base Skill

> Teach assistants to buy, claim, and manage **ApeBond** positions on **Base (8453)** using **Base MCP** (`https://mcp.base.org`) for signing and this skill for protocol orchestration.

## Prerequisites

1. **Base MCP** must be connected. If no Base MCP tools are available, send the user to [Base MCP quickstart](https://docs.base.org/ai-agents/quickstart) and stop.
2. Load [references/tone.md](references/tone.md) rules for the session (short, safety-first).
3. Load [references/host-setup.md](references/host-setup.md), identify **Tier A** (shell) vs **Tier B** (chat-only), and install the skill CLI if needed.
4. Before any `send_calls`, load [references/base-mcp-approval.md](references/base-mcp-approval.md).
5. Before any purchase flow, load [references/widget-tracking.md](references/widget-tracking.md). After a confirmed buy, **POST** `/bills/widget` (never GET that URL; never `WebFetch` it). Tier A: first widget attempt with **full network** shell permissions.

## Onboarding (every session)

Before bond actions:

1. Call Base MCP `get_wallets` when a wallet address is needed.
2. Show the Base MCP disclaimer verbatim (from [Base SKILL.md](https://docs.base.org/ai-agents/skills/SKILL.md) onboarding).
3. Do not dump balances unless the user asks.

## Plugin

| Topic | File |
| --- | --- |
| Buy, zap, claim, transfer on Base | [plugins/apebond-base.md](plugins/apebond-base.md) |

Load `plugins/apebond-base.md` when the user mentions ApeBond, bonds, vesting, or buying on Base.

## Bundled CLI

**Tier A** (Cursor, Claude Code, Codex): run the CLI from the agent shell.

**Tier B** (ChatGPT, Claude web/Desktop): user runs CLI locally and pastes JSON; see [references/host-setup.md](references/host-setup.md).

Invocation (skill-relative — preferred):

```bash
node <skill-root>/cli/dist/cli.js list-bonds
```

One-time build if `cli/dist` is missing:

```bash
cd <skill-root>/cli && npm install && npm run build
```

Commands: `list-bonds`, `positions`, `prepare-buy`, `prepare-zap-buy`, `prepare-redeem`, `prepare-batch-redeem`, `prepare-transfer`, `track-widget`, `finish-purchase`.

Output `transactions[]` maps 1:1 to Base MCP `send_calls` with `chain: "base"`.

## References

| File | Purpose |
| --- | --- |
| [references/host-setup.md](references/host-setup.md) | Install Base MCP + skill on all hosts; Tier A/B |
| [references/base-mcp-approval.md](references/base-mcp-approval.md) | Approval link, user-first wait, post-buy steps |
| [references/example-prompts.md](references/example-prompts.md) | Copy-paste prompts by tier |
| [references/api-endpoints.md](references/api-endpoints.md) | realtime-api, api v2, Soul Zap |
| [references/calldata-encoding.md](references/calldata-encoding.md) | deposit, maxPrice, tiers |
| [references/chain-base.md](references/chain-base.md) | Base constants |
| [references/widget-tracking.md](references/widget-tracking.md) | Mandatory `POST /bills/widget` |
| [references/limitations.md](references/limitations.md) | allowlist, POST, harness fallbacks |

## Installation (end users)

**Base MCP:** `https://mcp.base.org` — [quickstart](https://docs.base.org/ai-agents/quickstart) and [references/host-setup.md](references/host-setup.md).

**Skill:**

```bash
# Tier A
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a cursor -y
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a claude-code -y
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a codex -y

# Tier B: upload apebond-base-skill.zip in ChatGPT or Claude Skills (see PUBLISHING.md)
```

Then build CLI once: `cd <skill-dir>/cli && npm install && npm run build` (Tier A; Tier B on user's machine).

Example prompts: [references/example-prompts.md](references/example-prompts.md).
