# apebond-base-skill

Custom **Base MCP** skill so users can discover and trade **ApeBond** bonds on **Base (chainId 8453)** from Claude, Cursor, ChatGPT, etc.

## What users install

1. **Base MCP** — remote server `https://mcp.base.org` ([docs](https://docs.base.org/ai-agents/quickstart))
2. **This skill** — orchestration + optional CLI for unsigned calldata

## Quick start (skill maintainers)

```bash
cd cli
npm install
npm run build
./dist/cli.js list-bonds
```

## User install

```bash
npx skills add <your-github-org>/apebond-base-skill --skill apebond-base -a cursor
```

Or upload a zip of this repo (with `SKILL.md` at the root) in Claude **Settings → Skills**.

Then connect Base MCP in the host app.

## Example prompts

- "List active ApeBond bonds on Base"
- "Prepare buying 100 USDC of bond `0x…` for my wallet"
- "Show my ApeBond positions on Base and prepare a claim"

## Architecture

- **Read**: `GET https://realtime-api.ape.bond/bonds?chainId=8453`
- **Prepare**: local CLI (`cli/`) → `{ transactions: [{ to, data, value, chainId }] }`
- **Execute**: Base MCP `send_calls` with `chain: "base"`
- **Track**: mandatory `POST https://api.ape.bond/bills/widget` with `referenceId: "base-mcp"` after confirmed purchases

See [plugins/apebond-base.md](plugins/apebond-base.md) for full orchestration.

Maintainers: see [PUBLISHING.md](PUBLISHING.md) for zip / `npx skills` release steps.

## License

MIT
