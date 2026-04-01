---
tags:
  - config
  - events
---

# Event-Envelope Schema

Jedes Event im Diti AI System folgt diesem kanonischen Format.

## Felder

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `event_id` | ULID | Ja | Eindeutige ID (zeitbasiert, sortierbar) |
| `event_type` | String | Ja | z.B. `task.create`, `email.triage`, `knowledge.draft`, `workout.log` |
| `source_system` | Enum | Ja | `telegram`, `gmail`, `calendar`, `garmin`, `strava`, `manual`, `n8n` |
| `source_id` | String | Ja | ID im Quellsystem (Message-ID, Thread-ID, Activity-ID) |
| `timestamp` | ISO 8601 | Ja | Erstellungszeitpunkt |
| `actor` | Enum | Ja | `user` oder `agent` |
| `payload` | Object | Ja | Event-spezifische Daten |
| `routing_decision` | String | Nein | Wohin geroutet (`google_tasks`, `obsidian`, `notion`, etc.) |
| `audit` | Object | Nein | Workflow-ID, Execution-ID, Confidence Score |

## Event-Typen

| Event Type | Source | Target | Beschreibung |
|------------|--------|--------|-------------|
| `task.create` | telegram, gmail | Google Tasks | Neue Aufgabe erstellen |
| `task.update` | telegram, n8n | Google Tasks | Aufgabe aktualisieren |
| `followup.create` | gmail, telegram | Google Tasks (WAITING) | Follow-up mit Frist |
| `knowledge.draft` | telegram, gmail | Obsidian (00_INBOX) | Wissens-Draft erstellen |
| `knowledge.finalize` | manual | Obsidian (30_KNOWLEDGE) | Draft finalisieren nach Review |
| `email.triage` | gmail | n8n | E-Mail klassifizieren |
| `email.draft` | n8n | Gmail (Drafts) | Antwort-Entwurf |
| `calendar.query` | telegram | Google Calendar | Freebusy-Abfrage |
| `workout.log` | telegram, strava | Notion Health DB | Training erfassen |
| `health.import` | garmin, strava | Notion Health DB | Gesundheitsdaten importieren |
| `review.daily` | n8n (Cron) | Telegram | Tages-Briefing |
| `review.weekly` | n8n (Cron) | Obsidian + Telegram | Wochen-Review |

## Idempotenz

> [!warning] Pflicht
> Jeder Workflow checkt `{source_system, source_id}` gegen die Event-Registry.
> Duplikate werden ignoriert, nicht nochmals verarbeitet.

## Beispiel

```json
{
  "event_id": "01HXK5R3P0EXAMPLE",
  "event_type": "task.create",
  "source_system": "telegram",
  "source_id": "msg_123456789",
  "timestamp": "2026-03-28T14:30:00Z",
  "actor": "user",
  "payload": {
    "title": "Notion API Token einrichten",
    "due": "2026-03-29",
    "priority": "H",
    "project_id": "P1",
    "context": "deepwork"
  },
  "routing_decision": "google_tasks",
  "audit": {
    "workflow_id": "telegram-intake-v1",
    "execution_id": "exec_abc123",
    "intent_confidence": 0.95
  }
}
```
