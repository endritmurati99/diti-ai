---
date: 2026-03-28
session: "003"
phase: Phase 1 — MVP Build
status: done
tags:
  - dev-log
---

# Dev Session 003 — 2026-03-28

## Was wurde heute gemacht

- Google OAuth2 in n8n erfolgreich eingerichtet
  - Problem: OAuth Redirect URL zeigte auf private IP (`172.22.147.116`) — Google blockiert private IPs
  - Loesung: `WEBHOOK_URL` temporaer auf `http://localhost:5678/` gesetzt, OAuth-Flow ueber localhost durchgefuehrt
  - Redirect URI in Google Cloud Console: `http://localhost:5678/rest/oauth2-credential/callback`
  - OAuth-Tokens erfolgreich gespeichert, danach `WEBHOOK_URL` zurueckgesetzt
- Telegram Bot erstellt bei @BotFather
  - Username: `@DITI_AI_BOT`
  - Bot Token erhalten
  - Chat-ID ermittelt: `6526468834`

## Aktuelle Entscheidungen

> [!note] Warum wurde was so geloest?
> - OAuth ueber localhost statt private IP: Google erlaubt keine OAuth-Redirects zu privaten IPs — localhost ist die einzige Ausnahme fuer lokale Entwicklung
> - Temporaere `WEBHOOK_URL`-Aenderung: OAuth-Tokens bleiben nach Autorisierung gespeichert, unabhaengig von der URL ueber die n8n spaeter erreichbar ist

## Offene Fragen / Blocker

> [!warning] Noch zu erledigen
> - Telegram Bot API Credential in n8n erstellen (Token eintragen)
> - n8n Credential IDs auslesen (Google + Telegram)
> - Platzhalter in Workflow JSONs ersetzen
> - n8n API aktivieren oder Workflows manuell importieren
> - `NODES_EXCLUDE` in docker-compose prufen — `readWriteFile` ist aktuell blockiert (wird fuer Obsidian-Drafts benoetigt)

## Naechste Schritte

- [ ] Telegram Bot API Credential in n8n erstellen
- [ ] Credential IDs auslesen und bereitstellen (Google ID + Telegram ID)
- [ ] Platzhalter in allen 3 Workflow JSONs ersetzen
- [ ] Workflows in n8n importieren (UI oder API)
- [ ] Workflows aktivieren
- [ ] `readWriteFile` Node aus `NODES_EXCLUDE` entfernen (fuer `k:` Knowledge Drafts)
- [ ] Google Tasks Listen erstellen: NEXT, WAITING, SOMEDAY, SHOPPING
- [ ] Gmail Labels erstellen: AI/TODO, AI/FOLLOWUP, AI/PROCESSED
- [ ] End-to-End Test: `t: Test Task /due=2026-04-01 /prio=H` via Telegram

## Notizen

- n8n laeuft in Docker hinter Caddy Reverse Proxy (`https://${LAN_HOST}/n8n/`)
- n8n Public API ist aktuell deaktiviert (`N8N_PUBLIC_API_DISABLED: "true"`) — muss temporaer aktiviert werden oder Workflows werden manuell importiert
- `NODES_EXCLUDE` blockiert aktuell `readWriteFile` — der `k:` Command (Knowledge Draft -> Obsidian) braucht diesen Node
  - Alternative: HTTP-Request an Backend-API die die Datei schreibt
  - Oder: `readWriteFile` aus der Exclude-Liste entfernen und Dateizugriff auf Vault-Ordner beschraenken
- Bekannte Werte:
  - Telegram Bot: `@DITI_AI_BOT`
  - Chat-ID: `6526468834`
  - Google OAuth2: eingerichtet und autorisiert
  - n8n URL (intern): `http://localhost:5678`
  - n8n URL (extern): `https://${LAN_HOST}/n8n/`
