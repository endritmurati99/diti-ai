---
tags:
  - docs
  - architecture
---

# Diti AI — Architektur-Uebersicht

## 7 Layer

```
┌─────────────────────────────────────────────────┐
│  1. Capture & Command Layer (Input)             │
│     Telegram Bot, Gmail Labels, Calendar Events │
├─────────────────────────────────────────────────┤
│  2. Orchestrierung (n8n)                        │
│     Trigger, Routing, Pipelines, Sync, Gates    │
├─────────────────────────────────────────────────┤
│  3. Agentic Tooling                             │
│     Claude Code, Codex CLI                      │
├─────────────────────────────────────────────────┤
│  4. Operations Layer (Notion)                   │
│     Projekte, Dashboards, Metriken, Habits      │
├─────────────────────────────────────────────────┤
│  5. Knowledge Layer (Obsidian)                  │
│     Wissen, SOPs, Entscheidungen, Reviews       │
├─────────────────────────────────────────────────┤
│  6. Work Execution (Google)                     │
│     Gmail, Tasks, Calendar                      │
├─────────────────────────────────────────────────┤
│  7. Health/Training Layer                       │
│     Garmin, Strava, Ernaehrung                  │
└─────────────────────────────────────────────────┘
```

## Datenfluss

```
Telegram/Gmail/Calendar
        │
        ▼
   n8n (Intake + Routing)
        │
   ┌────┼────┬────────┐
   ▼    ▼    ▼        ▼
 Tasks Notes Notion  Health
(Google)(Obsidian)(Ops) (Notion)
        │
        ▼
  Feedback (Telegram)
  Daily/Weekly Briefings
```

## Kernprinzipien

1. **SoR-first**: Jeder Datentyp hat genau ein Primaersystem
2. **Rules > LLM**: Deterministische Regeln haben Vorrang
3. **Event-driven**: Alles wird zum Event mit kanonischem Envelope
4. **Human-in-the-loop**: Riskante Aktionen brauchen Bestaetigung
5. **Observability**: Keine Automation ohne Logging + Dead-letter Queue
6. **Idempotenz**: Duplikate werden erkannt und ignoriert
