---
tags:
  - telegram
  - setup
---

# Telegram Bot Setup

## 1. Bot bei BotFather erstellen

1. Oeffne Telegram und suche `@BotFather`
2. Sende `/newbot`
3. Waehle einen Namen: z.B. `Diti AI`
4. Waehle einen Username: z.B. `diti_ai_bot`
5. Kopiere den **Bot Token** (Format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. Speichere den Token in `.env` als `TELEGRAM_BOT_TOKEN`

## 2. Chat-ID ermitteln

1. Sende eine Nachricht an deinen Bot
2. Rufe auf: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Finde `"chat":{"id":123456789}` in der Antwort
4. Speichere die ID in `.env` als `TELEGRAM_CHAT_ID`

## 3. n8n Telegram Trigger einrichten

1. In n8n: neuer Workflow
2. Node hinzufuegen: **Telegram Trigger**
3. Credentials: Bot Token eintragen
4. Trigger auf: `message` (alle Nachrichten)
5. Verbinde mit dem Intake-Workflow (Command Parser)

## 4. Bot-Befehle registrieren (optional)

Sende an @BotFather:
```
/setcommands
```

Dann:
```
task - Aufgabe erstellen (t:)
followup - Follow-up erstellen (f:)
knowledge - Wissen speichern (k:)
query - Kalender abfragen (q:)
workout - Training loggen (w:)
health - Gesundheitsdaten (h:)
meeting - Meeting Note (m:)
```
