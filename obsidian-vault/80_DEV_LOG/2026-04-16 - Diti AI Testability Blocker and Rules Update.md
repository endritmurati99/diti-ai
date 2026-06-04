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
  - Jede Session beginnt mit der "Today's Agenda" (Offene Punkte, Blocker, Naechste Schritte).
  - Dokumentationspflicht via `/obsidian-cli` (symbolisch) in die Devlogs.
- Das Statusmodell fuer Verifikation geschaerft:
  - `configured`
  - `activated`
  - `synthetic_verified`
  - `live_proven`
- Status-Check mit `diti-n8n.cmd --json test preflight` durchgefuehrt.
- Blocker identifiziert: n8n API lieferte 401 Unauthorized, Workflows und Credentials fehlten.

## Session-Update (2026-04-16, abgeschlossen)

### Was wurde repariert

1. **API-Key regeneriert** - `N8N_API_KEY` in `config/.env` aktualisiert. `server api-check` bestaetigt authentifizierten Zugriff.
2. **Alle 7 P1-Workflows reaktiviert** - via REST API (`POST /api/v1/workflows/{id}/activate`). CLI `publish:workflow` (docker exec) setzt nur DB-Flag, registriert Webhooks nicht im laufenden Prozess.
3. **Preflight:** `31/31 pass` - alle Workflow-, Credential- und Routing-Checks gruen.
4. **Webhook-Smoketest:** `10/10 sent, 0 failed` - `http://localhost:5678/webhook/test-intake` antwortet HTTP 200 mit korrektem `reply_text`.

### Zustandskonflikt

- Das Log vom `2026-04-15` behauptete, `P1-telegram-intake-v2` sei deaktiviert und OpenClaw VS1 sei cut over.
- Die heutige Reaktivierung aller 7 P1-Workflows erzeugt einen harten Zustandskonflikt.
- Fuer Phase 1 gilt deshalb ab jetzt: `Telegram -> n8n` ist der einzige autoritative Ingress, OpenClaw ist bis zu eigener Evidenz `not_live_proven`.

### Entdeckte Bugs und Fixes

- **`_read_jsonl` Bug in CLI-Anything** (`cli_anything/n8n/core/batch.py`): `_write_jsonl` schreibt pretty-printed JSON (`indent=2`), `_read_jsonl` las zeilenweise. Fix: `json.JSONDecoder().raw_decode()` Schleife.

### Verbleibender Blocker

> [!warning] Collect/Report blockiert
> n8n speichert standardmaessig keine erfolgreichen Executions (`Save successful production executions = Off`).
> `batch-collect` findet deshalb 0 Matches (orphan: 10).
>
> **Fix:** n8n UI -> Settings -> n8n -> Workflow Settings -> **Save successful production executions: On**

Ohne gespeicherte erfolgreiche Executions ist kein Pfad `live_proven`, auch wenn Infrastruktur und Synthetic-Tests gruen sind.

### Erkenntnisse

- Router `P1-telegram-router-v1` war bereits in der Live-Instanz vorhanden - kein Export/Import noetig.
- Alle OAuth-Credentials (Telegram, Google Tasks, Google Calendar) waren bereits vorhanden.
- Der eigentliche Blocker war nur der ungueltige API-Key plus inaktive Workflows.

## Naechste Schritte

- [ ] n8n UI: `Save successful production executions` aktivieren -> Live-Beweis erst danach moeglich.
- [ ] `single bot owner confirmed` dokumentieren.
- [ ] `test_run`-Routing je Workflow synthetisch freigeben.
- [ ] kleine Live-Ladder nur fuer `Telegram -> n8n` starten:
  - [ ] `/ping`
  - [ ] `t: Live NEXT smoke /due=2026-04-18 /test_run=live-2026-04-16-a`
  - [ ] `t: /test_run=live-2026-04-16-e`
- [ ] `P1-telegram-router-v1.json` aus Live-Instanz exportieren und ins Repo committen (fehlt noch als lokale JSON). **DONE**
- [ ] OpenClaw erst nach n8n-Live-Proof separat zertifizieren.

---

## Stack-Status nach dieser Session

- `Telegram -> n8n configuration = configured`
- `P1 workflow set = activated`
- `test preflight = synthetic_verified`
- `test-intake webhook smoke = synthetic_verified`
- `Telegram -> n8n live path = not_live_proven`
- `Telegram -> OpenClaw live path = not_live_proven`

Was fehlte fuer die technische Wiederherstellung:

- API-Key
- Workflow-Aktivierung via REST API

Was weiterhin fuer echte Beweise fehlt:

- gespeicherte Success-Executions
- eindeutiger Bot-Owner
- Live-Run mit korrelierter Execution-ID und Artefakt
