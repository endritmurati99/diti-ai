---
tags:
  - docs
  - agents
---

# Agenten-Rollen & Permissions

## Uebersicht

8 Rollen mit klar definierten Rechten und Verboten.

| # | Agent | Aufgabe | Darf | Darf NICHT |
|---|-------|---------|------|-----------|
| 1 | **Intake-Agent** | Commands parsen, Events erzeugen, Routing | n8n Webhooks, LLM Parser | Obsidian final schreiben, E-Mail senden |
| 2 | **Inbox-Agent** | Gmail Label Workflows: Summary, Klassifikation | Gmail Nodes, Task erstellen | E-Mails senden (nur Draft), Termine verschieben |
| 3 | **Planner-Agent** | Tages-/Wochenplanung | Calendar Freebusy, Tasks, Notion | Termine verschieben ohne Confirm |
| 4 | **Knowledge-Agent** | Wissen erfassen -> Draft in Obsidian | File-Write in Vault | Final-Status ohne Review setzen |
| 5 | **Review-Agent** | Daily/Weekly Review, Abweichungsanalyse | Notion, Tasks, Calendar | Eskalation an Dritte ohne Confirm |
| 6 | **Automation-Agent** | n8n Monitoring, Retry, Dead-letter | n8n Logs, Notion Registry | Workflows ohne Logging aktivieren |
| 7 | **Health-Review-Agent** | Training/Erholung/Gewohnheiten spiegeln | Garmin/Strava Aggregates, Habit DB | Trainingsplaene aendern ohne Confirm |
| 8 | **Coding-Agent** | Repo-Aenderungen, Workflow-as-Code | Claude Code, Codex CLI, Git | Produktions-Secrets, private Rohdaten |

## Human-in-the-loop Gates

Folgende Aktionen brauchen **immer** Bestaetigung:

- E-Mail versenden (nicht Draft)
- Termine verschieben/loeschen
- Eskalation an Dritte
- Final-Wissen ohne Review
- PII/Health Content in Messenger
- Loeschen von Daten

## Logging

Jeder Agent loggt:
- `event_id` + `intent_confidence` + `target_system`
- Execution-ID (n8n)
- Timestamp + Actor
