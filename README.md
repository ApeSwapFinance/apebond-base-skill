# apebond-base-skill

Custom **Base MCP** skill so users can discover and trade **ApeBond** bonds on **Base (chainId 8453)** from Cursor, Claude Code, Codex, ChatGPT, Claude, and other Base MCP hosts.

## What users install

1. **Base MCP** — remote server `https://mcp.base.org` ([docs](https://docs.base.org/ai-agents/quickstart))
2. **This skill** — orchestration + bundled CLI for unsigned calldata and widget tracking

Host-specific setup and capability tiers: [references/host-setup.md](references/host-setup.md).

**Cursor users:** If bond discovery works but `track-widget.sh` fails with `403`, copy [sandbox.json.example](sandbox.json.example) to `.cursor/sandbox.json` or use WebFetch — [references/agent-network.md](references/agent-network.md).

## Quick start (skill maintainers)

```bash
cd cli
npm install
npm run build
node dist/cli.js list-bonds
```

## User install

**Tier A** (full in-agent CLI):

```bash
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a cursor -y
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a claude-code -y
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a codex -y
```

Then: `cd <skill-dir>/cli && npm install && npm run build` (see [host-setup.md](references/host-setup.md) for default dirs).

**Tier B** (ChatGPT / Claude web): upload `apebond-base-skill.zip` in Skills + connect Base MCP per [host-setup.md](references/host-setup.md).

Or upload a zip of this repo (with `SKILL.md` at the root) in Claude **Settings → Skills**.

## Example prompts

See [references/example-prompts.md](references/example-prompts.md).

- "List active ApeBond bonds on Base"
- "Buy `<AMOUNT>` USDC of bond `0x…` with Base Account" (full Tier A flow through approval → track-widget → positions)
- "Show my ApeBond positions on Base and prepare a claim"

## Architecture

- **Read**: `GET https://realtime-api.ape.bond/bonds?chainId=8453`
- **Prepare**: bundled CLI → `{ transactions: [{ to, data, value, chainId }] }`
- **Execute**: Base MCP `send_calls` with `chain: "base"` → user approves in Base Account ([base-mcp-approval.md](references/base-mcp-approval.md))
- **Track**: mandatory `GET https://api.ape.bond/bills/widget/register` with `referenceId: "base-mcp"` after confirmed purchases (Cursor: WebFetch first)
- **Network**: [references/agent-network.md](references/agent-network.md) — WebFetch vs sandbox `curl` vs Base MCP allowlist

See [plugins/apebond-base.md](plugins/apebond-base.md) for full orchestration.

Maintainers: see [PUBLISHING.md](PUBLISHING.md) for zip / `npx skills` release steps.

## License

MIT
