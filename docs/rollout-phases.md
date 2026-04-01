---
tags:
  - docs
  - rollout
---

# Rollout-Phasen

## Phase 0: Entscheidungen & Architektur (aktuell)

- **Ziel:** SoR, Datenmodell, Namenskonventionen, Sicherheitsbasis
- **Deliverables:** SoR-Matrix, Vault-Struktur, Notion DB Schemas, n8n Projektstruktur
- **Abnahme:** Kein Datentyp ohne SoR, kein Workflow ohne Logging
- **NICHT bauen:** Agents, Health-Automation

## Phase 1: MVP minimal funktionsfaehig (0-30 Tage)

- **Ziel:** Ein Capture-Kanal -> Tasks/Notes + Feedback
- **Deliverables:**
  - Telegram Bot -> n8n Webhook Intake -> Google Task oder Obsidian Draft
  - Gmail Label `AI/TODO` -> Task erzeugen
  - Daily Briefing (Tasks heute + Top-Prioritaet)
- **Abnahme:** 7 Tage Nutzung ohne manuelle Nacharbeit >10 min/Tag

## Phase 2: Stabile Alltagsnutzung (31-60 Tage)

- **Ziel:** Weekly Review + Projektlandkarte
- **Deliverables:**
  - Notion Projects DB + Dashboard
  - Weekly Report in Obsidian + automatische Task-Erzeugung
  - Automation Registry + Error Queue
- **Abnahme:** Weekly Review in <45 min

## Phase 3: E-Mail-, Task- und Kalenderintelligenz

- **Ziel:** Inbox Zero-ish ohne Selbstbetrug
- **Deliverables:**
  - Gmail Triage Workflow (Summary + Action Vorschlaege)
  - Kalenderabfrage per Freebusy API
  - Follow-up Engine (WAITING Liste, Eskalationen)
- **Abnahme:** 0 ueberfaellige WAITING >7 Tage

## Phase 4: Health-, Trainings- und Feedback-Layer (61-90 Tage)

- **Ziel:** Training/Erholung/Ernaehrung in Weekly Feedback
- **Deliverables:**
  - Garmin -> Strava Hub oder Garmin-only Entscheidung
  - Manuelles Workout Command `w:` + Weekly Aggregates
  - Nutrition: optional Garmin Connect+ oder Cronometer
- **Abnahme:** 4 Wochen Health Reviews mit 3 Anpassungen/Woche

## Phase 5: Agentisierung und Automatisierung

- **Ziel:** Rollen sauber trennen, MCP optional
- **Deliverables:**
  - MCP-Anbindung n8n (optional)
  - Agent SOPs + Permissions Matrix
- **Abnahme:** Keine unerklaerten Writes, vollstaendige Audit Trails

## Phase 6: Optimierung, Metriken, Review-Schleifen

- **Ziel:** System wird besser, nicht groesser
- **Deliverables:** SLOs, Error Budget, Workflow TCO Review, Refactoring
- **Abnahme:** Reduzierte Komplexitaet bei gleicher Leistung
