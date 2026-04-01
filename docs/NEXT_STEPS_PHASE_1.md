# Diti AI: Nächste Schritte & To-Dos für Phase 1 MVP

Dieses Dokument speichert unseren aktuellen Stand, damit wir beim nächsten Mal sofort da weitermachen können, wo wir aufgehört haben.

## Aktueller Startpunkt
Die Verzeichnisstrukturen für Obsidian, n8n und Notion stehen. Die `.env`-Datei in `config/.env` wurde aus dem Template erstellt.

## To-Do Liste (Was beim nächsten Mal direkt ansteht)

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
  - [ ] Wir laden die drei Workflows (`P1-daily-briefing-v1.json`, `P1-gmail-label-task-v1.json`, `P1-telegram-intake-v1.json`) ins n8n.
  - [ ] Wir testen die Nodes und verknüpfen die erstellten Credentials.
- [ ] **Schritt 5: Notion Datenbanken verknüpfen**
  - [ ] In Notion die entsprechenden Datenbanken (Projects, Habits, Task Mirror) mit der "Diti AI" Integration teilen.
- [ ] **Schritt 6: Live-Tests durchführen**
  - [ ] **Test Telegram:** `t: Testaufgabe /due=tomorrow` an den Bot schicken.
  - [ ] **Test Gmail:** Einer E-Mail das Label `AI/TODO` vergeben.
  - [ ] **Test Briefing:** Den Daily-Briefing-Workflow manuell in n8n anstoßen.

Sobald wir diese Liste beim nächsten Mal abgehakt haben, ist das "Phase 1 MVP" deines Agentensystems live und funktionsfähig!
