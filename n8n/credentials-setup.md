---
tags:
  - n8n
  - setup
---

# n8n Credentials Setup

## Voraussetzungen

- n8n laeuft (self-hosted)
- `N8N_ENCRYPTION_KEY` ist gesetzt und gesichert

## 1. Google OAuth2 (Gmail + Calendar + Tasks)

1. Google Cloud Console -> neues Projekt oder bestehendes
2. APIs aktivieren:
   - Gmail API
   - Google Calendar API
   - Google Tasks API
3. OAuth2 Consent Screen konfigurieren (Typ: External oder Internal)
4. Credentials -> OAuth 2.0 Client ID erstellen
   - Typ: Web Application
   - Redirect URI: `https://<n8n-url>/rest/oauth2-credential/callback`
5. In n8n: Credentials -> Google OAuth2 API
   - Client ID + Client Secret eintragen
   - Scopes:
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/tasks`
   - Authorize klicken

## 2. Telegram Bot

1. Bot Token von @BotFather (siehe `telegram/bot-setup.md`)
2. In n8n: Credentials -> Telegram API
   - Access Token eintragen

## 3. Notion Integration

1. Notion -> Settings -> Integrations -> "New Integration"
   - Name: `Diti AI`
   - Capabilities: Read content, Update content, Insert content
2. Token kopieren (Format: `ntn_...` oder `secret_...`)
3. In n8n: Credentials -> Notion API
   - API Token eintragen
4. **Wichtig:** Jede Notion-Seite/DB muss explizit mit der Integration geteilt werden
   - Seite oeffnen -> "..." -> "Connections" -> "Diti AI" hinzufuegen

## 4. Strava (spaeter, Phase 4)

1. Strava -> Settings -> My API Application
2. OAuth2 Credentials erstellen
3. In n8n: HTTP Request Node mit OAuth2
