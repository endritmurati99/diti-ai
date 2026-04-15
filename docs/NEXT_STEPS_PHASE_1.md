# Diti AI: Phase 1 Exit Criteria

Stand: April 14, 2026.

## What Is Implemented

- Webhook-first batch testing is wired into the Diti intake generator and the reusable `cli-anything-n8n` harness.
- `config/testing-registry.json` now uses schema v2 with dedicated test sinks and webhook metadata.
- The intake workflow supports two ingress modes:
  - Telegram for small transport smoke tests
  - `test-intake` webhook for high-volume parser/router/load runs
- Test writes are fail-closed to `NEXT_TEST`, `WAITING_TEST`, and `obsidian-vault/00_INBOX_TEST/`.

## Setup Steps (Operator Checklist)

- [ ] **Schritt 1: `.env` fertig befüllen**
  - [ ] Du öffnest `config/.env` und kopierst deine Tokens (Telegram Bot Token, Notion API Token) hinein.
- [ ] **Schritt 2: n8n Docker Volume Mount anpassen**
  - [ ] Wir müssen sicherstellen, dass dein lokaler n8n-Docker-Container den Ordner deines Obsidian-Vaults mountet (z.B. mit `-v "c:\Users\endri\Desktop\Claude-Projects\Diti AI\obsidian-vault:/data/obsidian-vault"`), damit die n8n Workflows direkt Schreibzugriff haben.
- [ ] **Schritt 3: n8n Credentials manuell anlegen**
  - [ ] **Telegram API** Credentials in n8n anlegen.
  - [ ] **Google OAuth2 API** Credentials anlegen (Scopes: Tasks, Calendar, Gmail).
  - [ ] **Notion API** in n8n anlegen (Internal Integration Token).
  - [ ] Die vergebenen Credential-IDs in die `.env` eintragen (falls zutreffend).
- [ ] **Schritt 4: n8n Workflows verknüpfen**
  - [ ] Wir laden die Workflows (`P1-daily-briefing-v1.json`, `P1-gmail-label-task-v1.json`, `P1-telegram-intake-v2.json`) ins n8n.
  - [ ] Danach aktivieren wir die zugehoerigen Sub-Workflows (`P1-telegram-task-next-v1.json`, `P1-telegram-task-waiting-v1.json`, `P1-telegram-knowledge-draft-v1.json`, `P1-telegram-calendar-query-v1.json`, `P1-error-handler-v1.json`).
  - [ ] Wir testen die Nodes und verknüpfen die erstellten Credentials.
- [ ] **Schritt 5: Notion Datenbanken verknüpfen**
  - [ ] In Notion die entsprechenden Datenbanken (Projects, Habits, Task Mirror) mit der "Diti AI" Integration teilen.
- [ ] **Schritt 6: Live-Tests durchführen**
  - [ ] **Test Telegram:** `t: Testaufgabe /due=tomorrow` an den Bot schicken.
  - [ ] **Test Gmail:** Einer E-Mail das Label `AI/TODO` vergeben.
  - [ ] **Test Briefing:** Den Daily-Briefing-Workflow manuell in n8n anstoßen.

## Phase 1 Verification Ladder

- [ ] Runtime restore: `diti-n8n.cmd --json server health` returns success.
- [ ] Runtime restore: `diti-n8n.cmd --json workflow list --active` returns the live active workflow set.
- [ ] Preflight passes: `diti-n8n.cmd --json test preflight`
- [ ] Parser proof: generate a 10k corpus and run `node n8n/scripts/test_parser.mjs --corpus <file> --out <report>`
- [ ] Webhook proof: run `diti-n8n.cmd test batch-send --transport webhook --count 20`
- [ ] Write-safety proof: run `diti-n8n.cmd test batch-send --transport webhook --count 100`
- [ ] Telegram smoke: run `diti-n8n.cmd test batch-send --transport telegram --count 3`
- [ ] Main stress run: run `diti-n8n.cmd test batch-send --transport webhook --count 10000`
- [ ] Collection and reporting: `batch-collect` + `batch-report` produce both Markdown and JSON summaries

## Hard Abort Conditions

- [ ] Any test write lands in a production target
- [ ] Any webhook test produces a Telegram side effect
- [ ] Correlation failure rate exceeds 1% in the webhook proof stages
- [ ] Expected-chain mismatches exceed 5% before the 10k webhook run

## Current Blocker

- `diti-n8n.cmd --json server health` is still failing against `http://localhost:5678/healthz`, so live-state re-verification is not complete yet.
