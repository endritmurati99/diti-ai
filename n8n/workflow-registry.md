---
tags:
  - n8n
  - workflows
---

# Workflow Registry

## Geplante Workflows

| # | Workflow | Phase | Trigger | Beschreibung | Status |
|---|---------|-------|---------|-------------|--------|
| 1 | Telegram Intake | 1 | Telegram Message | Command parsen, Event erzeugen, Routing | Geplant |
| 2 | Gmail Label -> Task | 1 | Gmail Poll (AI/TODO Label) | E-Mail -> Google Task erstellen | Geplant |
| 3 | Daily Briefing | 1 | Cron (morgens) | Top-3 Tasks + Prioritaet + Risiko via Telegram | Geplant |
| 4 | Gmail Triage | 3 | Gmail Poll (AI/TRIAGE Label) | Summary + Classification + Next Action | Geplant |
| 5 | Follow-up Check | 3 | Cron (taeglich) | WAITING Tasks pruefen, Eskalation bei Ueberfaellig | Geplant |
| 6 | Weekly Review | 2 | Cron (Sonntag) | Abweichungsanalyse, Report, Task-Pakete | Geplant |
| 7 | Task -> Notion Mirror | 2 | Cron (alle 30 min) | Google Tasks -> Notion Task Mirror DB sync | Geplant |
| 8 | Strava Import | 4 | Cron (taeglich) | Strava Activities -> Notion Health DB | Geplant |
| 9 | Health Aggregation | 4 | Cron (woechentlich) | Weekly Health Summary erstellen | Geplant |

## Konventionen

- Jeder Workflow hat eine eindeutige ID (n8n generiert)
- Workflow-Name: `[Phase]-[Kurzname]-v[Version]` (z.B. `P1-telegram-intake-v1`)
- JSON-Export liegt unter `n8n/workflows/`
- Jeder Workflow muss Logging haben (mindestens `event_id` + `timestamp`)
- Fehler landen in Dead-letter Queue (Notion Ops/Errors)
