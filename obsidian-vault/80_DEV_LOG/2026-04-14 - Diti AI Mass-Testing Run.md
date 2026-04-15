# 2026-04-14 - Diti AI Mass-Testing Run

## Summary

Implemented the webhook-first batch testing architecture for Diti AI and the reusable CLI Anything n8n harness.

## What Changed

- Added schema-v2 testing registry with dedicated test sinks.
- Upgraded the intake generator to support:
  - Telegram ingress
  - `test-intake` webhook ingress
  - shared parser/normalizer contract
  - response transport split between Telegram and webhook
  - fail-closed write safety for test traffic
- Added reusable `n8nctl test preflight`, `corpus`, `batch-send`, `batch-collect`, and `batch-report`.
- Added a local parser stress runner at `n8n/scripts/test_parser.mjs`.

## Current Runtime Status

- `diti-n8n.cmd --json session status` resolves the expected Diti project context.
- `diti-n8n.cmd --json server health` is still failing against `http://localhost:5678/healthz`.
- Live proof stages and the main 10k run remain blocked until local n8n is restored.

## Decisions

- Telegram is reserved for tiny smoke tests only.
- All high-volume parser/router/load tests use the dedicated webhook transport.
- Cleanup stays manual; no Google Tasks delete automation was added to the harness.

## Next Step

Restore local n8n health, run `diti-n8n.cmd --json test preflight`, then execute the verification ladder from `docs/testing-runbook.md`.

## Update - 2026-04-15 - OpenClaw VS1 Cutover

### Was ich gemacht habe

- `P1-telegram-intake-v2` in n8n deaktiviert, damit OpenClaw den Telegram-Bot ohne parallelen Consumer übernehmen kann.
- `WH-task-create-v1` live auf `YazUYXlJeIMEDTEx` in place aktualisiert.
- Webhook-Auth auf `headerAuth` gehärtet und den Code-Token-Check als Defense in Depth behalten.
- Den Helper auf stdlib-only Python umgestellt und den URL-Fallback `DITI_WEBHOOK_URL` -> `N8N_BASE_URL/webhook/task-create` beibehalten.
- Die minimale OpenClaw-Workspace-Struktur mit `SOUL.md`, `TOOLS.md`, `AGENTS.md` und `task-create/SKILL.md` angelegt.
- Den Bridge-Pfad auf genau `openclaw/task-create-bridge.cmd` begrenzt.
- Die fehlende Google-Tasks-Liste `NEXT` angelegt und den Workflow auf die echte List-ID umgestellt.
- Das Due-Date-Format im Google-Tasks-Node auf RFC3339 korrigiert.

### Was jetzt funktioniert

- `openclaw --version` und `openclaw config validate` laufen grün.
- OpenClaw Gateway-Health ist `OK`, Telegram ist verbunden.
- Der Exec-Allowlist-Eintrag enthält nur den VS1-Bridge-Pfad.
- Backend happy path, unauthorized und duplicate sind verifiziert.
- Der Helper funktioniert direkt mit stdin-JSON.
- `missing_secret` wird sauber zurückgegeben, wenn `DITI_WEBHOOK_SECRET` fehlt.
- Google Tasks-Schreibvorgänge landen jetzt in der echten `NEXT`-Liste.

### Was noch offen ist

- Der echte Telegram-End-to-End-Check aus dem allowlist-Chat `6526468834`.
- Dort müssen wir noch einmal verifizieren:
  - natürliche Sprache erzeugt einen Task in `NEXT`
  - dieselbe Nachricht erzeugt keinen Duplikat-Task
  - eine leere Anfrage triggert eine Klarstellung statt eines Writes

### Kurzes Fazit

Ja, OpenClaw kannst du jetzt schon in den Backend-/Helper-Pfaden testen.
Den vollständigen Telegram-E2E-Pfad würde ich noch einmal live mit einer echten Nachricht abprüfen, bevor ich ihn als ganz abgeschlossen behandle.
