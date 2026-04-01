---
tags:
  - notion
  - schema
---

# Task Mirror DB — Schema

## Zweck
Read-only Spiegel von Google Tasks. Wird per n8n Sync befuellt. Notion ist NICHT SoR fuer Tasks.

## Properties

| Property | Typ | Werte | Beschreibung |
|----------|-----|-------|-------------|
| Name | Title | — | Task-Titel |
| Google Task ID | Rich Text | — | ID aus Google Tasks API |
| Task List | Select | INBOX, NEXT, WAITING, SOMEDAY, SHOPPING | Google Tasks Liste |
| Due Date | Date | — | Faelligkeitsdatum |
| Status | Select | needsAction, completed | Google Tasks Status |
| Project Link | Relation | -> Projects DB | Verknuepfung zum Projekt |
| Last Synced | Date | — | Letzter Sync-Zeitpunkt |
| Notes | Rich Text | — | Task-Notizen |
