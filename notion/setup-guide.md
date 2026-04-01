---
tags:
  - notion
  - setup
---

# Notion Setup Guide

## 1. Integration erstellen

1. Gehe zu: Settings -> Integrations -> "New Integration"
2. Name: `Diti AI`
3. Capabilities: Read content, Update content, Insert content
4. Token kopieren -> in `.env` als `NOTION_TOKEN`

## 2. Datenbanken erstellen

Die Datenbanken werden per Notion MCP oder manuell erstellt.
Schemas: siehe `notion/schemas/`

Reihenfolge:
1. Projects DB (wird von anderen DBs referenziert)
2. Habits & Weekly Goals DB
3. Health Weekly DB
4. Task Mirror DB (Relation auf Projects DB)
5. Automation Registry DB
6. Ops Dashboard (Page mit eingebetteten Views)

## 3. Integration mit Seiten verbinden

**Fuer jede erstellte DB:**
1. Seite oeffnen
2. "..." -> "Connections" -> "Diti AI" hinzufuegen

## 4. Database IDs notieren

Nach Erstellung jede DB-ID in `.env` eintragen:
- `NOTION_PROJECTS_DB_ID`
- `NOTION_HABITS_DB_ID`
- `NOTION_HEALTH_DB_ID`
- `NOTION_TASK_MIRROR_DB_ID`
- `NOTION_AUTOMATION_DB_ID`
