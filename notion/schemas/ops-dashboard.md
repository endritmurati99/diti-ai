---
tags:
  - notion
  - schema
---

# Ops Dashboard — Schema

## Zweck
Zentrale Rollup-Seite mit Verweisen auf alle Datenbanken. Kein eigenes Schema, sondern eine Page mit eingebetteten Database Views.

## Aufbau

### System Status
- Eingebettete View: Automation Registry (Filter: Status != Disabled, Sort: Last Run desc)
- Fehler-Zaehler: Anzahl Workflows mit Status = Error

### Projekte
- Eingebettete View: Projects DB (Filter: Status = Active, Sort: Priority)

### Tasks Uebersicht
- Eingebettete View: Task Mirror DB (Filter: Status = needsAction, Sort: Due Date)

### Weekly Goals
- Eingebettete View: Habits & Goals (Filter: aktuelle Woche)

### Health
- Eingebettete View: Health Weekly (letzte 4 Wochen)
