# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Diti AI is an event-driven **personal operating system** — not a runnable application but an orchestration architecture. It integrates n8n (self-hosted), Google Workspace, Notion, Obsidian, and Telegram into a unified personal productivity system.

No build step, no package manager, no test runner. The "code" is n8n workflow JSON, embedded JavaScript in Code nodes, Markdown schema specs, and shell scripts.

## Stack and System-of-Record Rules

Every data type has exactly one authoritative system (see [config/sor-matrix.md](config/sor-matrix.md)):

| Data Type | System of Record | Mirrors (read-only) |
|-----------|-----------------|---------------------|
| Calendar events | Google Calendar | Notion, Obsidian |
| Tasks | Google Tasks | Notion task-mirror DB |
| Projects | Notion | Obsidian (notes/links) |
| Knowledge / SOPs / Decisions | Obsidian | Notion (optional index) |
| Health data | Garmin / Strava | Notion health DB |

**Never** write to a mirror system directly — all writes go to the SoR and sync downstream.

## Event Model

All workflows must emit events conforming to the canonical envelope in [config/event-envelope.md](config/event-envelope.md):

- `event_id`: ULID (use the generator in `n8n/api/command-parser.js`)
- Deduplication: `{source_system, source_id}` pair must be idempotent
- Event types follow `noun.verb` pattern: `task.create`, `knowledge.draft`, `workout.log`, etc.

## Telegram Command DSL

The primary input interface. Parsed by [n8n/api/command-parser.js](n8n/api/command-parser.js):

| Prefix | Routes to | Target system |
|--------|-----------|---------------|
| `t:` | Task create | Google Tasks (NEXT list) |
| `f:` | Follow-up | Google Tasks (WAITING list) |
| `k:` | Knowledge | Obsidian `00_INBOX/` |
| `q:` | Calendar query | Google Calendar freebusy |
| `w:` | Workout log | Notion Health DB |
| `m:` | Meeting note | Obsidian `00_INBOX/` |
| `h:` | Health data | Notion Health DB |

Parameters use `/key=value` syntax, e.g. `t: Buy milk /p=high /due=2026-04-03`.

## n8n Workflows

Workflow JSON files live in [n8n/workflows/](n8n/workflows/). Naming convention: `P{phase}-{name}-v{version}.json`.

Current Phase 1 workflows:
- `P1-telegram-intake-v1.json` — Telegram → parse DSL → route to SoR
- `P1-gmail-label-task-v1.json` — Gmail "AI/TODO" label → Google Task
- `P1-daily-briefing-v1.json` — Cron → top-3 tasks → Telegram

To deploy workflows: run `n8n/api/deploy.sh` (requires `N8N_URL` and `N8N_API_KEY` in `.env`).

## Agent Roles

Eight named agents are defined in [docs/agent-roles.md](docs/agent-roles.md). When implementing or modifying automation, identify which agent is responsible. Key constraint: **human-in-the-loop gates** are mandatory for:

- Sending (not drafting) emails
- Deleting or shifting calendar events
- Sharing PII or health data
- Finalizing knowledge without review
- Escalating to third parties

## Obsidian Vault Structure

[obsidian-vault/](obsidian-vault/) follows a Zettelkasten-inspired layout:

```
00_INBOX/       ← auto-populated by n8n (never manually write here)
10_PROJECTS/    ← active project notes (linked to Notion SoR)
20_AREAS/       ← life areas (work, health, learning)
30_KNOWLEDGE/   ← finalized knowledge base
40_SOPS/        ← standard operating procedures
50_DECISIONS/   ← ADRs
60_REVIEWS/     ← daily/weekly review notes
70_HEALTH_REPORTS/
80_DEV_LOG/     ← development journal entries
90_ARCHIVE/
_meta/agent-journal/  ← automated agent execution logs
_meta/templates/      ← Markdown templates
```

Notes entering the system always land in `00_INBOX/` and are promoted manually.

## Environment Setup

Copy `config/.env.example` → `config/.env` and fill all variables. Required groups:

- `N8N_*` — n8n instance URL, API key, encryption key, credential IDs
- `TELEGRAM_*` — bot token + your chat ID
- `NOTION_*` — integration token + all database IDs
- `GOOGLE_*` — OAuth2 client credentials

Notion DB IDs are documented in [memory/project_diti_ai.md](../../.claude/projects/c--Users-endri/memory/project_diti_ai.md) (Claude memory).

## Rollout Phase

Current phase: **Phase 0 → Phase 1 transition**. See [docs/NEXT_STEPS_PHASE_1.md](docs/NEXT_STEPS_PHASE_1.md) for the concrete checklist to reach MVP. Phases 2–6 are specced in [docs/rollout-phases.md](docs/rollout-phases.md).

## Security Model

Data tiers are defined in [docs/security-model.md](docs/security-model.md):
- **Tier 0 (High):** Health, finances, private emails — local or primary system only, never in Telegram
- **Tier 1 (Sensitive):** Project info — Notion metadata only
- **Tier 2 (Low):** Status updates, reminders — safe for Telegram

Secrets: managed via n8n credential store (encrypted with `N8N_ENCRYPTION_KEY`). The `.env` file is gitignored and must never be committed.
