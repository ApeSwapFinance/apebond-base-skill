# ApeBond Base Skill

> Teach assistants to buy, claim, and manage **ApeBond** positions on **Base (8453)** using **Base MCP** (`https://mcp.base.org`) for signing and this skill for protocol orchestration.

## Prerequisites

1. **Base MCP** must be connected. If no Base MCP tools are available, send the user to [Base MCP quickstart](https://docs.base.org/ai-agents/quickstart) and stop.
2. Load [references/tone.md](references/tone.md) rules for the session (short, safety-first).

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

## Local CLI (recommended)

From this repo:

```bash
cd cli && npm install && npm run build
node dist/cli.js list-bonds
```

Commands: `list-bonds`, `positions`, `prepare-buy`, `prepare-zap-buy`, `prepare-redeem`, `prepare-batch-redeem`, `prepare-transfer`, `track-widget`.

The CLI prints JSON batches compatible with Base MCP `send_calls`.

## References

| File | Purpose |
| --- | --- |
| [references/api-endpoints.md](references/api-endpoints.md) | realtime-api, api v2, Soul Zap |
| [references/calldata-encoding.md](references/calldata-encoding.md) | deposit, maxPrice, tiers |
| [references/chain-base.md](references/chain-base.md) | Base constants |
| [references/widget-tracking.md](references/widget-tracking.md) | Mandatory `POST /bills/widget` |
| [references/limitations.md](references/limitations.md) | allowlist, POST, harness fallbacks |

## Installation (end users)

```bash
npx skills add <org>/apebond-base-skill --skill apebond-base -a cursor
```

Also connect Base MCP: `https://mcp.base.org` — see [quickstart](https://docs.base.org/ai-agents/quickstart).
