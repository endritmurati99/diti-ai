# Diti AI

Diti AI is a personal operating-system prototype that connects Telegram intake, n8n workflows, Notion operations data, Obsidian knowledge, and Google productivity surfaces.

## Current Status

The repository is an active automation and workflow lab. It contains n8n workflow exports, command-parser code, Telegram command references, Notion schema notes, Obsidian vault conventions, and testing runbooks for safe local and webhook-based validation.

Diti AI is not a monolithic chatbot. It is an event-driven assistant system where each integration keeps a clear role and the automation layer routes compact commands to the right source of truth.

## Key Capabilities

- Telegram command DSL for tasks, follow-ups, knowledge capture, calendar queries, workout logs, meeting notes, and health data.
- n8n workflows for intake routing, task creation, waiting tasks, knowledge drafts, calendar query handling, daily briefing, and error handling.
- Source-of-truth mapping across Google, Notion, Obsidian, Telegram, and n8n.
- Parser stress-testing and webhook proof stages before live Telegram smoke tests.
- Local OpenClaw/Claude Code helper surfaces for task creation workflows.

## Architecture

```text
Telegram / webhook / local command
  -> n8n intake workflow
  -> command parser and route selection
  -> source-specific workflow
  -> Google, Notion, Obsidian, or Telegram output
  -> logs and test reports
```

Source-of-truth documents:

- [Architecture Overview](docs/architecture-overview.md)
- [Security Model](docs/security-model.md)
- [Testing Runbook](docs/testing-runbook.md)
- [Rollout Phases](docs/rollout-phases.md)
- [System Of Record Matrix](config/sor-matrix.md)

## Command DSL

| Prefix | Purpose | Target |
| --- | --- | --- |
| `t:` | Create task | Google Tasks |
| `f:` | Create follow-up | Google Tasks waiting list |
| `k:` | Capture knowledge | Obsidian inbox |
| `q:` | Ask calendar question | Google Calendar free/busy |
| `w:` | Log workout | Notion health database |
| `m:` | Capture meeting note | Obsidian inbox |
| `h:` | Capture health data | Notion health database |

See [`telegram/command-reference.md`](telegram/command-reference.md) for details.

## Quick Start

1. Create a local environment file from the documented examples.
2. Configure n8n credentials from [`n8n/credentials-setup.md`](n8n/credentials-setup.md).
3. Create the Telegram bot from [`telegram/bot-setup.md`](telegram/bot-setup.md).
4. Connect the Notion integration from [`notion/setup-guide.md`](notion/setup-guide.md).
5. Open the Obsidian vault in [`obsidian-vault/`](obsidian-vault/).

Common local checks:

```powershell
diti-n8n.cmd --json session status
diti-n8n.cmd --json server health
diti-n8n.cmd --json test preflight
```

## Verification

Parser-only proof:

```bash
node n8n/scripts/test_parser.mjs --corpus tmp/corpus.jsonl --out tmp/parser-report.json
```

Recommended staged validation:

```powershell
diti-n8n.cmd test corpus --out tmp/corpus.jsonl --count 10000 --seed 20260414
diti-n8n.cmd test batch-send --transport webhook --count 20 --sent-log tmp/webhook-20-sent.jsonl
diti-n8n.cmd test batch-collect --sent-log tmp/webhook-20-sent.jsonl --results tmp/webhook-20-results.jsonl --wait-for-idle 30
diti-n8n.cmd test batch-report --results tmp/webhook-20-results.jsonl --out tmp/webhook-20-report.md
git diff --check
```

Live Telegram smoke tests should stay small and should run only after webhook proof stages pass.

## Privacy And Safety

- Keep production writes out of bulk tests; generated test traffic must target test lists and test inbox folders.
- Do not commit real n8n credentials, Telegram tokens, Google credentials, or Notion secrets.
- Use webhook-based proof stages before live Telegram smoke.
- Treat parser write-safety errors as blockers, not cosmetic test failures.
- Keep each source of truth explicit to avoid duplicate or conflicting state.

## Roadmap

- Stabilize Phase 1 Telegram intake and task/knowledge/calendar routing.
- Keep parser and workflow proofs reproducible before expanding live automations.
- Harden observability around n8n execution correlation and write-safety checks.
- Expand from command routing into reliable daily and weekly operating loops.
