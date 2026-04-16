---
date: 2026-04-16
session: "2026-04-16"
phase: Phase 1 - Stabilisierung
status: blocked
tags:
  - dev-log
  - blocker
  - rules-update
---

# Dev Session - 2026-04-16

## Was wurde heute gemacht

- Neue Arbeitsregeln in `CLAUDE.md` festgelegt:
  - Jede Session beginnt mit der "Today's Agenda" (Offene Punkte, Blocker, Nächste Schritte).
  - Dokumentationspflicht via `/obsidian-cli` (symbolisch) in die Devlogs.
- Status-Check mit `diti-n8n.cmd --json test preflight` durchgeführt.
- Blocker identifiziert: n8n API liefert 401 Unauthorized, Workflows und Credentials fehlen.

## Session-Update (2026-04-16, abgeschlossen)

### Was wurde repariert

1. **API-Key regeneriert** — `N8N_API_KEY` in `config/.env` aktualisiert. `server api-check` bestätigt authentifizierten Zugriff.
2. **Alle 7 P1-Workflows reaktiviert** — Via REST API (`POST /api/v1/workflows/{id}/activate`). CLI `publish:workflow` (docker exec) setzt nur DB-Flag, registriert Webhooks nicht im laufenden Prozess.
3. **Preflight:** `31/31 pass` — Alle Workflow-, Credential- und Routing-Checks grün.
4. **Webhook-Smoketest:** `10/10 sent, 0 failed` — `http://localhost:5678/webhook/test-intake` antwortet HTTP 200 mit korrektem `reply_text`.

### Entdeckte Bugs und Fixes

- **`_read_jsonl` Bug in CLI-Anything** (`cli_anything/n8n/core/batch.py`): `_write_jsonl` schreibt pretty-printed JSON (`indent=2`), `_read_jsonl` las zeilenweise. Fix: `json.JSONDecoder().raw_decode()` Schleife.

### Verbleibender Blocker

> [!warning] Collect/Report blockiert
> n8n speichert standardmäßig keine erfolgreichen Executions (`Save successful production executions = Off`).
> `batch-collect` findet deshalb 0 Matches (orphan: 10).
>
> **Fix:** n8n UI → Settings → n8n → Workflow Settings → **Save successful production executions: On**

### Erkenntnisse

- Router `P1-telegram-router-v1` war bereits in der Live-Instanz vorhanden — kein Export/Import nötig.
- Alle OAuth-Credentials (Telegram, Google Tasks, Google Calendar) waren bereits vorhanden.
- Der eigentliche Blocker war nur der ungültige API-Key + inaktive Workflows.

## Nächste Schritte

- [ ] n8n UI: `Save successful production executions` aktivieren → `batch-collect` / `batch-report` freischalten.
- [ ] `P1-telegram-router-v1.json` aus Live-Instanz exportieren und ins Repo committen (fehlt noch als lokale JSON).
- [ ] OpenClaw VS1-Migration fortsetzen (Stack ist jetzt stabil).
