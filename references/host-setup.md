# Host setup (Base MCP + apebond-base skill)

Canonical Base MCP install: [Base quickstart](https://docs.base.org/ai-agents/quickstart) and [install.md](https://docs.base.org/ai-agents/skills/references/install.md).

MCP server URL everywhere: `https://mcp.base.org`

Before any bond action, identify the user's **capability tier** (below). Do not promise in-chat CLI on Tier B.

---

## Capability tiers

| Tier | Hosts | Base MCP | Skill install | Shell / CLI in chat | Full buy in chat |
|------|-------|----------|---------------|---------------------|------------------|
| **A — Full** | Cursor, Claude Code, Codex | Yes | `npx skills add … -g -a <host>` | Yes | prepare-buy → send_calls → approve → track-widget → positions |
| **B — MCP + chat** | ChatGPT, Claude (web / Desktop / mobile) | Yes (connector) | Skill zip upload or URL prompt | No | Degraded — [Tier B playbook](#tier-b-playbook-chatgpt--claude-web) |
| **C** | Hermes | Yes | `hermes skills install github:…/apebond-base` | Varies | Follow harness (usually Tier A or B rules) |

---

## Tier A — Full harness

### Cursor

**Base MCP** — `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "base-mcp": {
      "url": "https://mcp.base.org"
    }
  }
}
```

Restart Cursor → **Settings → MCP** → confirm `base-mcp` is active → complete OAuth in Base Account.

The harness may label the server `user-base-mcp`; tool names are still `get_wallets`, `send_calls`, `get_request_status`, etc.

**Skill:**

```bash
# -g = global (all projects). Do not run from inside this repo's cli/ without -g.
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a cursor -y
cd ~/.cursor/skills/apebond-base/cli && npm install && npm run build
```

Default skill dir: `~/.cursor/skills/apebond-base/` (global). Verify: `npx skills ls -g`

### Cursor / Tier A — sandbox and widget register

`prepare-buy`, `track-widget`, and [cli/scripts/track-widget.sh](../cli/scripts/track-widget.sh) call `realtime-api.ape.bond` and `api.ape.bond`. Cursor’s default shell sandbox may block those hosts.

| Phase | Network in sandbox | Agent action |
|-------|-------------------|--------------|
| `prepare-buy` / `list-bonds` | Often blocked | Use `required_permissions: ["full_network"]` or Base MCP `chain_rpc_request` where applicable |
| **Widget register GET** | Usually OK in default sandbox | After `txHash`: run `track-widget` / `track-widget.sh` (GET `/bills/widget/register`) |
| **Widget register failed** | Network or API error | **Pause in chat** — ask user to retry or run script locally; do not defer to end of reply |

Never register widget between `send_calls` and confirmed `txHash`.  
Use **GET** `https://api.ape.bond/bills/widget/register` with query params — not legacy `POST /bills/widget`.  
If widget register fails, use **inline handoff** (same message thread) — see [widget-tracking.md](widget-tracking.md).

**If you accidentally installed as a project skill** (`cli/.agents/skills/…`):

```bash
cd ~/GitHub/apebond-base-skill/cli   # or wherever `skills list` shows Project Skills
npx skills remove apebond-base -y
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a cursor -y
```

### Claude Code

**Base MCP:**

```bash
claude mcp add --transport http base-mcp https://mcp.base.org
# optional global:
claude mcp add --transport http --scope user base-mcp https://mcp.base.org
claude mcp list
```

In session: `/mcp` shows server status.

**Skill:**

```bash
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a claude-code -y
cd ~/.claude/skills/apebond-base/cli && npm install && npm run build
```

Default skill dir: `~/.claude/skills/apebond-base/`

### Codex

**Base MCP:**

```bash
codex mcp add base-mcp --url https://mcp.base.org/
```

Or in `codex.toml`:

```toml
[mcp_servers.base-mcp]
url = "https://mcp.base.org/"
```

**Skill:**

```bash
npx skills add ApeSwapFinance/apebond-base-skill --skill apebond-base -g -a codex -y
cd ~/.codex/skills/apebond-base/cli && npm install && npm run build
```

Default skill dir: `~/.codex/skills/apebond-base/`

---

## Tier B — ChatGPT and Claude (web / Desktop)

### ChatGPT

1. Settings → Connectors → enable Developer Mode if prompted.
2. Create app: Name `Base MCP`, URL `https://mcp.base.org`, Authentication **OAuth**.
3. Connect Base MCP; authorize Base Account on first wallet tool use.
4. Install skill: upload `apebond-base-skill.zip` (see [PUBLISHING.md](../PUBLISHING.md)) in **Settings → Skills** (eligible plans), **or** use a one-shot prompt to load skill text — **not both**.

### Claude (web, Desktop, iOS, Android)

1. Customize → Connectors → Add custom connector → URL `https://mcp.base.org`.
2. Authorize Base Account on first use.
3. Install skill: upload zip in **Settings → Skills**, **or** one-shot prompt to fetch `SKILL.md` from GitHub — **not both**.

### Tier B playbook (ChatGPT / Claude web)

| Step | In chat | User fallback (local machine) |
|------|---------|-------------------------------|
| Discover bonds | `web_request` GET bonds **if** allowlisted; else ask for paste | `node <skill-root>/cli/dist/cli.js list-bonds` |
| Prepare calldata | Cannot run CLI | `prepare-buy` locally → paste `transactions[]` JSON |
| Execute | `send_calls` with mapped `calls` | — |
| Approve | Show **Approve in Base Account** link only | User clicks link |
| Wait | User replies **approved** | — |
| Status | `get_request_status(requestId)` | — |
| track-widget | Use CLI or `web_request` GET to register URL | After `txHash`: `track-widget` or [cli/scripts/track-widget.sh](../cli/scripts/track-widget.sh) (see [widget-tracking.md](widget-tracking.md)) |
| positions | Ask user to paste or run locally | `positions <wallet>` |

Tier B still supports **wallet + send_calls + approval + status**; be explicit when handing off to local CLI.

---

## Tier C — Hermes

**Base MCP** — `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  base-mcp:
    url: "https://mcp.base.org"
```

Reload MCP (`/reload-mcp` or new session).

**Skill:**

```bash
hermes skills install github:ApeSwapFinance/apebond-base-skill
```

Apply Tier A or B rules depending on whether the Hermes session has shell access.

---

## CLI path convention

Agents must **not** hardcode maintainer machine paths.

1. **Skill-relative (preferred):** `node <skill-root>/cli/dist/cli.js <command> …` where `<skill-root>` is the directory containing this skill's `SKILL.md`.
2. **Host fallback (Tier A):** use default dirs in the Tier A table above.
3. **Tier B:** user runs CLI on their machine and pastes JSON output.

**One-time build** (if `cli/dist` is missing):

```bash
cd <skill-root>/cli && npm install && npm run build
```

**Commands:** `list-bonds`, `positions`, `prepare-buy`, `prepare-zap-buy`, `prepare-redeem`, `prepare-batch-redeem`, `prepare-transfer`, `track-widget`, `finish-purchase`.

---

## Verify install

Ask the assistant (or user):

> Show me my wallets

If a Base Account address is returned, Base MCP is connected. If not, retry install steps or open [quickstart](https://docs.base.org/ai-agents/quickstart).

---

## Related

- [base-mcp-approval.md](base-mcp-approval.md) — after `send_calls`
- [limitations.md](limitations.md) — allowlist and chat-app constraints
- [example-prompts.md](example-prompts.md) — copy-paste prompts by tier
