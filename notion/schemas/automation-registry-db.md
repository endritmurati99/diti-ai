---
tags:
  - notion
  - schema
---

# Automation Registry DB — Schema

## Zweck
Uebersicht aller n8n Workflows mit Status, SLO und Fehler-Tracking.

## Properties

| Property | Typ | Werte | Beschreibung |
|----------|-----|-------|-------------|
| Name | Title | — | Workflow-Name |
| n8n Workflow ID | Rich Text | — | ID in n8n |
| Phase | Select | P0, P1, P2, P3, P4, P5, P6 | Rollout-Phase |
| Trigger Type | Select | Webhook, Cron, Poll, Manual | Trigger-Art |
| Status | Select | Active, Error, Disabled, Planned | Aktueller Status |
| Last Run | Date | — | Letzte Ausfuehrung |
| Error Count (7d) | Number | — | Fehler in den letzten 7 Tagen |
| SLO | Rich Text | — | z.B. "99% success in 7d" |
| Notes | Rich Text | — | Anmerkungen, Known Issues |
