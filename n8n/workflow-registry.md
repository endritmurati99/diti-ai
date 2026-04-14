---
tags:
  - n8n
  - workflows
---

# Workflow Registry

## Geplante Workflows

| # | Workflow | Phase | Trigger | Beschreibung | Status |
|---|---------|-------|---------|-------------|--------|
| 1 | Telegram Intake v1 | 1 | Telegram Message | Command parsen, Event erzeugen, Routing (monolith) | Deployed (inaktiv) |
| 2 | Gmail Label -> Task | 1 | Gmail Poll (AI/TODO Label) | E-Mail -> Google Task erstellen | Deployed (inaktiv) |
| 3 | Daily Briefing | 1 | Cron (morgens) | Top-3 Tasks + Prioritaet + Risiko via Telegram | Deployed (inaktiv) |
| 4 | Gmail Triage | 3 | Gmail Poll (AI/TRIAGE Label) | Summary + Classification + Next Action | Geplant |
| 5 | Follow-up Check | 3 | Cron (taeglich) | WAITING Tasks pruefen, Eskalation bei Ueberfaellig | Geplant |
| 6 | Weekly Review | 2 | Cron (Sonntag) | Abweichungsanalyse, Report, Task-Pakete | Geplant |
| 7 | Task -> Notion Mirror | 2 | Cron (alle 30 min) | Google Tasks -> Notion Task Mirror DB sync | Geplant |
| 8 | Strava Import | 4 | Cron (taeglich) | Strava Activities -> Notion Health DB | Geplant |
| 9 | Health Aggregation | 4 | Cron (woechentlich) | Weekly Health Summary erstellen | Geplant |

## Phase 1 v2: Deterministische Telegram Intake

| # | Workflow | n8n ID | Trigger | Beschreibung | Status |
|---|---------|--------|---------|-------------|--------|
| 10 | P1-telegram-intake-v2 | kqCxomzy3TWYSllH | Telegram Message | Canonical event, Allowlist, Dedup, Switch -> Sub-WFs | Deployed (inaktiv) |
| 11 | P1-telegram-task-next-v1 | pzYSe2gnvbXLedvG | Execute Sub-WF | Validate + Google Task NEXT erstellen | Deployed (inaktiv) |
| 12 | P1-telegram-task-waiting-v1 | 6d1fV8surkco100H | Execute Sub-WF | Validate + Google Task WAITING erstellen | Deployed (inaktiv) |
| 13 | P1-telegram-knowledge-draft-v1 | Jm3AB26MzUlxauV6 | Execute Sub-WF | Markdown aufbauen + Obsidian 00_INBOX schreiben | Deployed (inaktiv) |
| 14 | P1-telegram-calendar-query-v1 | FLsNZCEhoqtwCbPG | Execute Sub-WF | Google Calendar abfragen + Frei/Belegt Antwort | Deployed (inaktiv) |
| 15 | P1-error-handler-v1 | ezKkyglJhrTwPi8n | Error Trigger | Admin-Telegram-Nachricht bei Workflow-Fehlern | Deployed (inaktiv) |

## Konventionen

- Jeder Workflow hat eine eindeutige ID (n8n generiert)
- Workflow-Name: `[Phase]-[Kurzname]-v[Version]` (z.B. `P1-telegram-intake-v2`)
- JSON-Export liegt unter `n8n/workflows/`
- Jeder Workflow muss Logging haben (mindestens `event_id` + `timestamp`)
- Fehler landen in Dead-letter Queue (Notion Ops/Errors)
- Error Handler: `P1-error-handler-v1` (ID `ezKkyglJhrTwPi8n`) assigned to all v2 workflows
- Contract/Schema: `n8n/contracts/telegram-intake-event.json`
