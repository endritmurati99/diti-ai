---
date: 2026-03-28
session: "002"
phase: Phase 1 — MVP Build
status: done
tags:
  - dev-log
---

# Dev Session 002 — 2026-03-28

## Was wurde heute gemacht

- Phase 1 MVP Plan erstellt und genehmigt
- n8n API Deploy Script erstellt (`n8n/api/deploy.sh`)
  - Liest .env, deployt JSON-Workflows via n8n REST API
  - Unterstuetzt: deploy all, --list, --file, --activate, --deactivate
- Command Parser JS-Modul erstellt (`n8n/api/command-parser.js`)
  - Regex-basiertes Parsing: `t:`, `f:`, `k:`, `q:`, `w:`, `m:`, `h:`
  - Parameter-Parsing: `/key=value`
  - ULID-Generator fuer Event-IDs
  - Event-Envelope Erzeugung
- 3 n8n Workflow JSON-Dateien erstellt:
  1. `P1-telegram-intake-v1.json` — Telegram -> Command Parser -> Switch -> Google Tasks / Obsidian / Calendar
  2. `P1-gmail-label-task-v1.json` — Gmail AI/TODO Label -> Google Task + Label-Update + Telegram Notify
  3. `P1-daily-briefing-v1.json` — Cron 07:00 -> Tasks + Calendar -> Briefing formatieren -> Telegram
- `.env.example` erweitert um `N8N_API_KEY` und Credential IDs

## Aktuelle Entscheidungen

> [!note] Warum wurde was so geloest?
> - n8n API statt UI: Reproduzierbar, versionierbar, schneller bei Aenderungen
> - Regex statt LLM fuer Command Parsing: Deterministisch, schnell, keine API-Kosten
> - ULID statt UUID: Zeitbasiert, sortierbar, kompakter
> - Placeholder Credential IDs: Werden beim Deploy durch echte IDs ersetzt

## Offene Fragen / Blocker

> [!success] Abgeschlossen
> Alle Workflow-Artefakte erstellt. Warten auf Credential-Setup (siehe Session 003).

## Naechste Schritte

- [x] Phase 1 MVP Plan erstellen
- [x] Deploy Script erstellen
- [x] Command Parser erstellen
- [x] 3 Workflow JSONs erstellen
- [x] `.env.example` erweitern

## Notizen

- Workflow JSONs enthalten Platzhalter: `TELEGRAM_CREDENTIAL_ID`, `GOOGLE_CREDENTIAL_ID`, `TELEGRAM_CHAT_ID`
- Diese muessen vor dem Deploy ersetzt werden (im deploy.sh oder manuell)
- Der `Write Obsidian File` Node braucht Dateisystem-Zugriff auf den Vault-Ordner
- Bei n8n in Docker: Volume-Mount des Vault-Ordners noetig
