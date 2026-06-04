# Local testing (maintainers)

End-to-end validation of **Base MCP** + **apebond-base** skill + **CLI**. User-facing install and approval flow: [references/host-setup.md](references/host-setup.md) and [references/base-mcp-approval.md](references/base-mcp-approval.md).

## 1. Prerequisites

- Base Account with **USDC on Base** for buy tests.
- Node 18+.

## 2. Build CLI

From repo root:

```bash
cd cli && npm install && npm run build
```

Use skill-relative invocations in docs:

```bash
node cli/dist/cli.js list-bonds
```

## 3. Test on Cursor (Tier A)

1. `~/.cursor/mcp.json` includes `"base-mcp": { "url": "https://mcp.base.org" }`.
2. Install skill: `npx skills add <local-or-github-path> --skill apebond-base -a cursor` or rsync repo to `~/.cursor/skills/apebond-base/`.
3. Build CLI in skill dir.
4. Agent chat — use prompt from [references/example-prompts.md](references/example-prompts.md) (Tier A).
5. Confirm: approval link shown → user **approved** → `track-widget` → `positions`.

## 4. Test on Claude Code (Tier A)

```bash
claude mcp add --transport http base-mcp https://mcp.base.org
npx skills add <path> --skill apebond-base -a claude-code
cd ~/.claude/skills/apebond-base/cli && npm install && npm run build
```

Same agent prompt as Cursor.

## 5. Test on Codex (Tier A)

```bash
codex mcp add base-mcp --url https://mcp.base.org/
npx skills add <path> --skill apebond-base -a codex
cd ~/.codex/skills/apebond-base/cli && npm install && npm run build
```

## 6. Optional: ChatGPT / Claude web (Tier B)

1. Build zip per [PUBLISHING.md](PUBLISHING.md).
2. Upload skill zip + connect Base MCP connector.
3. Run `prepare-buy` locally; paste `transactions[]` into chat.
4. Confirm: `send_calls` + approval link (no auto-open) → user **approved** → status → local `track-widget` commands provided.

## 7. Manual CLI checks

```bash
export WALLET=0xYourBaseWalletAddress

node cli/dist/cli.js list-bonds

node cli/dist/cli.js prepare-buy \
  --bond 0x4075b614e75Cb4aeD6C8DE4b0180e3D2Bede4308 \
  --amount 0.01 \
  --from "$WALLET" \
  --with-tiers

# After confirmed on-chain purchase:
node cli/dist/cli.js finish-purchase \
  --hash 0xYourConfirmedTxHash \
  --bond 0x4075b614e75Cb4aeD6C8DE4b0180e3D2Bede4308 \
  --wallet "$WALLET"
```

## 8. Troubleshooting

| Issue | Fix |
| --- | --- |
| Skill not loading | `SKILL.md` has `name` + `description` frontmatter |
| No Base MCP tools | Add `base-mcp` to host config; restart; OAuth |
| Flow stops after send_calls | Follow [base-mcp-approval.md](references/base-mcp-approval.md); user must reply **approved** |
| `deposit` reverts | Check USDC balance, `--amount` units, `minTier` |
| `tier-signature` fails | Wallet / API tier requirements on production |
| Widget POST fails (ENOTFOUND / 403) | Only after approved + `get_request_status` → `txHash`; retry `track-widget` or `cli/scripts/track-widget.sh` with full network (not in sandbox) |
