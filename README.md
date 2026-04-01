# Diti AI — Personal OS

Eventgetriebenes persoenliches Assistenzsystem fuer Planung, Ausfuehrung, Wissen und Gesundheit.

## Stack

| Komponente | Rolle | SoR fuer |
|------------|-------|----------|
| **n8n** (self-hosted) | Orchestrierung, Trigger, Sync | Workflow-Logs |
| **Google** (Gmail/Tasks/Calendar) | Kommunikation, Aufgaben, Zeit | E-Mails, Tasks, Termine |
| **Notion** | Operations, Dashboards, Metriken | Projekte, Habits |
| **Obsidian** | Langzeitwissen, Second Brain | Wissen, SOPs, Entscheidungen |
| **Telegram** | Eingabe + Feedback (MVP) | — |
| **Garmin/Strava** | Health/Training Datenquelle | Gesundheitsdaten |

## Projektstruktur

```
obsidian-vault/     Obsidian Vault (Wissen, Templates, Dev Log)
n8n/                Workflow-Exports + Credentials-Doku
notion/             DB-Schemas + Setup-Guide
telegram/           Bot-Setup + Command DSL Referenz
config/             .env.example, SoR-Matrix, Event-Schema
docs/               Architektur, Agenten-Rollen, Sicherheit, Phasen
```

## Quick Start

1. `.env` aus `config/.env.example` erstellen und Werte eintragen
2. n8n Credentials einrichten (siehe `n8n/credentials-setup.md`)
3. Telegram Bot erstellen (siehe `telegram/bot-setup.md`)
4. Notion Integration verbinden (siehe `notion/setup-guide.md`)
5. Obsidian Vault oeffnen (`obsidian-vault/`)

## Command DSL (Telegram)

| Command | Funktion | Ziel |
|---------|----------|------|
| `t:` | Task erstellen | Google Tasks |
| `f:` | Follow-up | Google Tasks (WAITING) |
| `k:` | Wissen speichern | Obsidian (INBOX) |
| `q:` | Kalender-Abfrage | Calendar Freebusy |
| `w:` | Workout loggen | Notion Health DB |
| `m:` | Meeting Note | Obsidian (INBOX) |
| `h:` | Health-Daten | Notion Health DB |

Details: `telegram/command-reference.md`

## Rollout-Phasen

- **Phase 0** — Architektur & Setup (aktuell)
- **Phase 1** — MVP: Telegram Intake + Tasks + Daily Briefing
- **Phase 2** — Weekly Review + Projektlandkarte
- **Phase 3** — E-Mail/Kalender-Intelligenz
- **Phase 4** — Health/Training Layer
- **Phase 5** — Agentisierung
- **Phase 6** — Optimierung

Details: `docs/rollout-phases.md`

## Architektur

Vollstaendige Beschreibung: `Diti_AI_description.md`
Kompakte Uebersicht: `docs/architecture-overview.md`
