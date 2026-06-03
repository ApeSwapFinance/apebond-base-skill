# Publishing the skill

## Prerequisites

- CLI builds: `cd cli && npm install && npm run build`
- Git remote configured for your org repo

## Zip for Claude Skills upload

From repo root:

```bash
zip -r apebond-base-skill.zip SKILL.md README.md plugins references -x "*.DS_Store"
```

Upload `apebond-base-skill.zip` in Claude **Settings → Skills**.

## npx skills (Cursor / Claude Code / Codex)

After pushing to GitHub:

```bash
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -a cursor
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -a claude-code
```

## End-user checklist

1. Connect Base MCP: `https://mcp.base.org` — [quickstart](https://docs.base.org/ai-agents/quickstart)
2. Install this skill (zip or `npx skills add`)
3. Clone skill repo locally if the assistant needs the CLI (`cd cli && npm run build`)

## Manual verification

```bash
cd cli
node dist/cli.js list-bonds
node dist/cli.js prepare-buy --bond <contract> --amount 1 --from <wallet> --skip-approve
# After a real purchase on Base:
node dist/cli.js track-widget --hash 0x... --bond <contract>
```

Confirm widget row: `GET https://api.ape.bond/bills/widget?referenceId=base-mcp` (if exposed in your environment).

## Request Base allowlist (optional)

Ask Base to allowlist `GET https://realtime-api.ape.bond` on `web_request` for consumer chat apps.
