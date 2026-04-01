---
tags:
  - notion
  - schema
---

# Projects DB — Schema

## Zweck
SoR fuer Projekte. Enthalt alle aktiven und abgeschlossenen Projekte mit Status und Metadaten.

## Properties

| Property | Typ | Werte | Beschreibung |
|----------|-----|-------|-------------|
| Name | Title | — | Projektname |
| Project ID | Rich Text | P1, P2, ... | Eindeutige Projekt-ID (referenziert in Tasks/Notes) |
| Status | Select | Not Started, Active, On Hold, Done, Cancelled | Aktueller Status |
| Priority | Select | P1, P2, P3, P4 | Prioritaet |
| Start Date | Date | — | Projektstart |
| Target Date | Date | — | Zieldatum |
| Owner | Rich Text | — | Verantwortlich |
| Tags | Multi-Select | — | Freitext-Tags |
| Notes | Rich Text | — | Kurze Beschreibung |
| Obsidian Link | URL | — | Link zur Obsidian Project Note |
