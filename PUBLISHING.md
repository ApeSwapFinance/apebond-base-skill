# Publishing the skill

## Prerequisites

- CLI builds: `cd cli && npm install && npm run build`
- Git remote configured for your org repo
- Commit `cli/dist/` for installs without a local build (recommended)

## Zip for ChatGPT / Claude Skills upload

From repo root (includes CLI source; users build locally on Tier B):

```bash
cd cli && npm install && npm run build && cd ..
zip -r apebond-base-skill.zip \
  SKILL.md README.md plugins references cli \
  -x "*.DS_Store" -x "cli/node_modules/*"
```

Upload `apebond-base-skill.zip` in ChatGPT **Settings → Skills** or Claude **Settings → Skills**.

Also connect Base MCP per [references/host-setup.md](references/host-setup.md).

## npx skills (Tier A)

After pushing to GitHub:

```bash
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -a cursor
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -a claude-code
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -a codex
```

## End-user checklist

1. Connect Base MCP: `https://mcp.base.org` — [quickstart](https://docs.base.org/ai-agents/quickstart)
2. Install this skill (`npx skills add` or zip upload)
3. One-time CLI build: `cd <skill-dir>/cli && npm install && npm run build` (skipped if `cli/dist` is present in the install)
4. Read [references/host-setup.md](references/host-setup.md) for your host tier

## Manual verification

```bash
cd cli
node dist/cli.js list-bonds
node dist/cli.js prepare-buy --bond <contract> --amount 0.01 --from <wallet> --with-tiers
# After a real purchase on Base:
node dist/cli.js finish-purchase --hash 0x... --bond <contract> --wallet <wallet>
```

## Request Base allowlist (optional)

Ask Base to allowlist `GET https://realtime-api.ape.bond` on `web_request` for Tier B chat apps.
