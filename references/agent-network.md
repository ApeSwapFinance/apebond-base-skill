# Agent network paths (Cursor / Base MCP)

ApeBond agents touch two HTTP hosts:

| Host | Typical use |
| --- | --- |
| `realtime-api.ape.bond` | Bond discovery (`GET /bonds`, `GET /utils/bonds`) |
| `api.ape.bond` | Widget register (`GET /bills/widget/register`), tier signature (`POST /tier-signature`), bill images |

These are **not** the same network path as “can I open the URL in a browser?” Agents use **three different stacks**, each with its own allowlist.

---

## Three paths (do not confuse them)

| Path | What it is | `realtime-api.ape.bond` | `api.ape.bond` |
| --- | --- | --- | --- |
| **A — Harness fetch** | Cursor **WebFetch** / similar read-only URL tools | Usually **works** | Usually **works** (register GET, bond JSON) |
| **B — Agent shell** | `curl`, CLI, `track-widget.sh` in Cursor **sandbox** | Often **403** `CONNECT tunnel failed` | Often **403** (same proxy) |
| **C — Base MCP `web_request`** | Hosted MCP at `mcp.base.org` | Usually **not allowlisted** | Usually **not allowlisted** |

**Symptom:** Bond prices load (path A) but `track-widget.sh` fails (path B). That does **not** mean `api.ape.bond` is down or GET register is wrong.

---

## Cursor Tier A — what agents must do

Load this file with [widget-tracking.md](widget-tracking.md) on every purchase flow.

### Bond discovery

Prefer, in order:

1. **WebFetch** (or harness fetch) — `GET https://realtime-api.ape.bond/bonds?chainId=8453&bond=<contract>`
2. CLI `list-bonds` with `required_permissions: ["full_network"]` if shell is required
3. User-pasted bond JSON (Tier B)

Do **not** assume shell `curl` to `realtime-api.ape.bond` works in the default sandbox.

### Widget register (after `txHash`)

Prefer, in order:

1. **WebFetch** — full register URL from [widget-tracking.md](widget-tracking.md) (confirm JSON body includes `chainId`, `transactionHash`, `billContract`, `createdAt` or 2xx)
2. CLI `track-widget` or `track-widget.sh` with `required_permissions: ["full_network"]` or `["all"]`
3. User runs script locally and pastes output

Do **not** rely on default sandbox `curl` to `api.ape.bond`. Do **not** use legacy `POST /bills/widget`.

### Positions

Prefer **Base MCP `chain_rpc_request`** (on-chain Bill NFT + per-bond `claimablePayout`). CLI `positions` needs shell network for catalog labels only.

---

## Fix Cursor shell access (`sandbox.json`)

So `curl` / CLI work without WebFetch-only workarounds, add ApeBond hosts to the agent sandbox allowlist.

**Docs:** [Cursor sandbox.json reference](https://cursor.com/docs/reference/sandbox) · [Terminal / network modes](https://cursor.com/docs/agent/tools/terminal)

### Per-project (recommended)

Create or merge `.cursor/sandbox.json` in the repo where the agent runs (or copy from [sandbox.json.example](../sandbox.json.example) in this skill repo):

```json
{
  "networkPolicy": {
    "default": "deny",
    "allow": [
      "api.ape.bond",
      "realtime-api.ape.bond",
      "zap-api.ape.bond"
    ]
  }
}
```

### User-wide (all projects)

`~/.cursor/sandbox.json` — same `networkPolicy.allow` entries.

### Settings UI

**Cursor Settings → Agents → Auto Run → Network access**

- **Allow All** — simplest; all sandboxed commands get outbound network.
- **sandbox.json + Defaults** — merge your allowlist with Cursor’s built-in package-registry defaults (default mode).
- **sandbox.json Only** — only your allowlist (strictest).

After changing policy, **restart the agent chat** or re-run the command.

### Escalation per command

If you cannot edit `sandbox.json`, the agent may pass `required_permissions: ["full_network"]` or `["all"]` on a **single** shell invocation (when the harness supports it). Prefer fixing `sandbox.json` so `track-widget.sh` works without repeated prompts.

---

## Request Base MCP `web_request` allowlist

Base MCP only allows `web_request` to **curated partner hostnames**. ApeBond hosts are **not** on the default list today (both `realtime-api.ape.bond` and `api.ape.bond` return “not in the allowed hosts list”).

**Docs:** [Native plugins overview](https://docs.base.org/ai-agents/plugins/native) · [Custom plugins](https://docs.base.org/ai-agents/plugins/custom-plugins) (allowlist + CLI fallback)

### What to request

Ask the Base team to add these hostnames to the **hosted** `web_request` allowlist (GET and POST as needed):

| Hostname | Methods | Purpose |
| --- | --- | --- |
| `realtime-api.ape.bond` | GET | `/bonds`, `/utils/bonds` |
| `api.ape.bond` | GET, POST | `/bills/widget/register`, `/tier-signature`, `/bills/single/.../image` |
| `zap-api.ape.bond` | POST | Soul Zap `/zap` (zap buys) |

### How to ask

1. **GitHub** — Open an issue or discussion on [base/skills](https://github.com/base/skills) or the Base MCP repo linked from [quickstart](https://docs.base.org/ai-agents/quickstart), title e.g. “Allowlist ApeBond API hosts for web_request”.
2. **Discord / X** — Base developer channels (see [docs.base.org](https://docs.base.org)).
3. **Partner / native plugin track** — Reference [Bankr](https://docs.base.org/ai-agents/plugins/native/bankr) / [Avantis](https://docs.base.org/ai-agents/plugins/native/avantis) as examples of allowlisted DeFi APIs; propose **apebond-base** as a native or partner plugin with the hosts above.

**Copy-paste template:**

```text
Product: Base MCP (mcp.base.org) — web_request allowlist expansion

Hosts to allowlist:
- realtime-api.ape.bond (GET: bond discovery)
- api.ape.bond (GET: /bills/widget/register; POST: /tier-signature; GET: bill images)
- zap-api.ape.bond (POST: zap quotes for bond purchases)

Use case: ApeBond vesting bonds on Base (8453) via the apebond-base skill and send_calls.
Skill repo: https://github.com/ApeSwapFinance/apebond-base-skill

Today agents fall back to WebFetch or local CLI because web_request rejects *.ape.bond.
```

Until allowlisted, use **WebFetch** (Cursor) or **CLI + sandbox.json** — not `web_request`.

---

## Enterprise Cursor teams

Team admins can set a **default network allowlist** on the Cloud Agents / Security dashboard; it merges with per-user `sandbox.json`. See [Security & network](https://cursor.com/docs/cloud-agent/security-network).

Add the same three `*.ape.bond` hostnames there for org-wide agent egress.
