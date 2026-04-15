# Diti AI → OpenClaw Hybrid Migration Plan

> Dieses Dokument ist die kanonische Anweisung für Claude Code und alle Agenten.
> Es ersetzt keine bestehende Datei, sondern ergänzt das Projekt um den Migrationsplan.
> Lege diese Datei im Projektroot ab: `C:\Users\endri\Desktop\Claude-Projects\Diti AI\MIGRATION-PLAN.md`
> Datum: 2026-04-15

---

## 1. Kontext und Entscheidung

### Was ist Diti AI heute?

Ein event-getriebenes Personal OS, orchestriert über n8n (self-hosted), mit Telegram als primärem Eingabekanal. Der Intake nutzt ein Prefix-DSL (`t:`, `k:`, `q:` etc.) mit LLM-Fallback (gpt-4o-mini). Workflows sind als n8n-JSON definiert, aber **alle inaktiv**. Kein einziger Use Case läuft produktiv.

### Was sich ändert

Wir führen **OpenClaw** als Conversational Gateway ein. OpenClaw übernimmt die Rolle, die bisher der `P1-telegram-intake-v2` Workflow in n8n hatte: Nachrichten empfangen, Intent erkennen, Entities extrahieren. n8n bleibt der deterministische Execution-Layer für alle Schreiboperationen.

### Warum

- n8n ist kein Conversation-Runtime. Multi-Turn-Dialoge, natürliche Sprache, Memory und Rückfragen sind in n8n fragile Hacks.
- OpenClaw bietet native Telegram/WhatsApp-Anbindung, Session Management, natürliche Sprache und ein Skill-System.
- Die Trennung "OpenClaw = unscharfe Schicht (NLP)" und "n8n = scharfe Schicht (Execution)" ist architektonisch sauber.

### Architektonische Grundregeln

1. **OpenClaw ist Router, nicht Gehirn.** Keine autonomen Schreiboperationen. Keine eigenständige Planung. Kein Vertrauen in OpenClaw-Memory für kritische Daten.
2. **n8n schreibt, OpenClaw schreibt nie.** Jeder Write in ein System of Record geht durch einen n8n-Webhook mit Validierung.
3. **Human-in-the-Loop für riskante Writes.** OpenClaw muss vor Kalenderänderungen, E-Mail-Versand und Datenlöschungen bestätigen lassen. Task-Erstellung ist auto-executable.
4. **Obsidian ist das Langzeitgedächtnis.** Nicht OpenClaws Memory. Wenn der Agent Wissen braucht, liest er via n8n aus dem Vault.
5. **SoR-Matrix bleibt unangetastet.** Keine Änderungen an der Datenhoheit (siehe `config/sor-matrix.md`).
6. **Event-Envelope bleibt gültig.** Alle n8n-Workflows nutzen weiterhin das kanonische Event-Format (siehe `config/event-envelope.md`).

---

## 2. Zielarchitektur

```
┌─────────────────────────────────────────────────┐
│  User: Telegram / WhatsApp (später)             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  OpenClaw (Conversational Gateway)              │
│                                                 │
│  Aufgaben:                                      │
│  - Nachricht empfangen (Telegram, später WA)    │
│  - Intent erkennen (natürliche Sprache)         │
│  - Entities extrahieren (Titel, Datum, Prio)    │
│  - JSON an n8n Webhook senden                   │
│  - Antwort von n8n empfangen und an User senden │
│  - Rückfragen stellen bei Unklarheit            │
│                                                 │
│  Verboten:                                      │
│  - Shell-Zugriff                                │
│  - File-I/O                                     │
│  - Direkte API-Calls an Google/Notion/etc.      │
│  - Autonome Entscheidungen ohne Bestätigung     │
└──────────────────┬──────────────────────────────┘
                   │ HTTP POST (JSON)
                   │
┌──────────────────▼──────────────────────────────┐
│  n8n (Deterministic Execution Layer)            │
│                                                 │
│  Webhook-Endpoints:                             │
│  - POST /webhook/task-create         (VS1)      │
│  - POST /webhook/task-followup       (VS2)      │
│  - POST /webhook/knowledge-capture   (VS3)      │
│  - POST /webhook/calendar-query      (VS4)      │
│  - POST /webhook/shopping-split      (VS6)      │
│  - POST /webhook/knowledge-search    (VS8)      │
│                                                 │
│  Cron-Jobs (bestehend, bleiben):                │
│  - Daily Briefing (07:00)                       │
│  - Gmail Label Triage (alle 5 min)              │
│                                                 │
│  Jeder Endpoint:                                │
│  1. Validiert Input-JSON                        │
│  2. Erzeugt Event-Envelope                      │
│  3. Führt Aktion aus (Google Tasks, Obsidian)   │
│  4. Gibt strukturiertes Ergebnis zurück         │
│  5. Loggt Execution                             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Systems of Record (unverändert)                │
│                                                 │
│  Google Tasks  │ Google Calendar │ Gmail         │
│  Obsidian Vault│ Notion          │ Garmin/Strava │
└─────────────────────────────────────────────────┘
```

---

## 3. Was bleibt, was sich ändert, was wegfällt

### BEHALTEN (unverändert)

| Datei / Komponente | Grund |
|---|---|
| `config/sor-matrix.md` | Datenhoheit bleibt |
| `config/event-envelope.md` | Event-Format bleibt gültig |
| `config/.env.example` | Wird erweitert, nicht ersetzt |
| `docs/security-model.md` | Security-Tiers bleiben |
| `docs/agent-roles.md` | Agenten-Rollen bleiben |
| `docs/architecture-overview.md` | Wird aktualisiert, nicht gelöscht |
| `obsidian-vault/` (komplett) | Second Brain bleibt |
| `notion/` (komplett) | DB-Schemas bleiben |
| `n8n/contracts/` | Event-Schemas bleiben |
| `n8n/credentials-setup.md` | Bleibt gültig |
| `n8n/workflows/P1-daily-briefing-v1.json` | Cron bleibt in n8n |
| `n8n/workflows/P1-gmail-label-task-v1.json` | Gmail-Triage bleibt |
| `n8n/workflows/P1-error-handler-v1.json` | Error-Handler bleibt |

### UMBAUEN (Trigger ändern, Logik behalten)

| Datei | Änderung | Wann |
|---|---|---|
| `P1-telegram-task-next-v1.json` | Sub-WF-Trigger → Webhook-Trigger | VS1 |
| `P1-telegram-task-waiting-v1.json` | Sub-WF-Trigger → Webhook-Trigger | VS2 |
| `P1-telegram-knowledge-draft-v1.json` | Sub-WF-Trigger → Webhook-Trigger | VS3 |
| `P1-telegram-calendar-query-v1.json` | Sub-WF-Trigger → Webhook-Trigger | VS4 |

### DEAKTIVIEREN (nicht löschen)

| Datei | Grund |
|---|---|
| `P1-telegram-intake-v2.json` | OpenClaw übernimmt Intake |
| `n8n/api/command-parser.js` | DSL-Parser nicht mehr primär |
| `n8n/scripts/generate-v2-workflows.js` | Generator für alte Architektur |

### NEU ERSTELLEN

| Datei | Beschreibung | Wann |
|---|---|---|
| `MIGRATION-PLAN.md` | Dieses Dokument | Jetzt |
| `openclaw/README.md` | Setup-Anleitung | Phase A |
| `openclaw/.env.example` | OpenClaw Env-Variablen | Phase A |
| `openclaw/persona.md` | System Prompt + Restriktionen | Phase A |
| `openclaw/skills/task-create.md` | Skill-Spec VS1 | Phase C |
| `n8n/workflows/WH-task-create-v1.json` | Webhook-Workflow VS1 | Phase B |

---

## 4. Vertical Slice 1: Task erstellen per natürlicher Sprache

### User Story

> Als Nutzer schicke ich eine Telegram-Nachricht wie "Erstelle eine Aufgabe: Rechnung senden bis Freitag" und bekomme innerhalb von 5 Sekunden eine Bestätigung, dass der Task in Google Tasks (NEXT) erstellt wurde.

### End-to-End-Flow

```
1. User → Telegram: "Erstelle eine Aufgabe: Rechnung senden bis Freitag"

2. OpenClaw erkennt Intent: task.create
   Extrahiert: title="Rechnung senden", due="2026-04-18"

3. OpenClaw → n8n:
   POST http://<n8n-host>/webhook/task-create
   Authorization: Bearer <WEBHOOK_SECRET>
   {
     "intent": "task.create",
     "title": "Rechnung senden",
     "params": { "due": "2026-04-18", "prio": "M", "project": "", "context": "" },
     "source": { "channel": "telegram", "chat_id": "6526468834", "message_id": "12345", "timestamp": "2026-04-15T14:30:00Z" }
   }

4. n8n verarbeitet:
   a) Validiert JSON (title nicht leer, due valides Datum)
   b) Idempotenz-Check (source.channel + source.message_id)
   c) Event-Envelope erzeugen (ULID)
   d) Google Task erstellen (Liste NEXT)
   e) Response:
   { "ok": true, "action": "task.created", "task": { "id": "xyz", "title": "Rechnung senden", "due": "2026-04-18", "list": "NEXT" }, "event_id": "01JRZK..." }

5. OpenClaw → Telegram: "Task erstellt: Rechnung senden (bis 18.04.)"

6. Bei Fehler:
   { "ok": false, "error": "missing_title", "message": "Kein Titel angegeben." }
   → "Fehler: Kein Titel angegeben."
```

### Akzeptanzkriterien

| # | Kriterium | Messung |
|---|---|---|
| 1 | Latenz < 5 Sekunden | Timestamp Send vs. Reply |
| 2 | Task in Google Tasks NEXT | Manuell prüfen |
| 3 | Title + Due Date korrekt | Abgleich |
| 4 | Duplikat erkannt | 2x senden → 1 Task |
| 5 | Fehler gibt Antwort | Leere Nachricht testen |
| 6 | n8n Log zeigt Flow | Execution prüfen |
| 7 | Event-Envelope vorhanden | event_id, source_id |

---

## 5. Implementierungsschritte

### Phase A: OpenClaw Setup

```
A1: OpenClaw installieren
    git clone https://github.com/openclaw/openclaw
    openclaw onboard
    API Key setzen (Anthropic oder OpenAI)

A2: Telegram anbinden
    openclaw config set telegram.bot_token "<TOKEN>"
    openclaw gateway restart
    Pairing: /start → openclaw pairing approve telegram <CODE>
    WICHTIG: VORHER Telegram-Trigger in n8n DEAKTIVIEREN
    (P1-telegram-intake-v2 deaktivieren)

A3: Sicherheitsrestriktionen
    - Shell: OFF
    - File-I/O: OFF
    - Browser: OFF
    - Allowlist: 6526468834

A4: Persona konfigurieren
    System Prompt aus openclaw/persona.md laden
```

### Phase B: n8n Webhook-Workflow bauen

```
B1: WH-task-create-v1 erstellen
    Trigger: Webhook POST /webhook/task-create
    Auth: Bearer Token
    Nodes: Validate → Dedup → EventEnvelope → GoogleTasks → Response
    Error Branch: BuildError → ErrorResponse
    Error Workflow: P1-error-handler-v1

B2: Importieren und aktivieren
    n8nctl.cmd workflow import WH-task-create-v1.json
    n8nctl.cmd workflow activate <id>

B3: Manueller Test via curl
    curl -X POST http://localhost:5678/webhook/task-create \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <SECRET>" \
      -d '{"intent":"task.create","title":"Curl-Test","params":{"due":"2026-04-20","prio":"M"},"source":{"channel":"test","chat_id":"6526468834","message_id":"curl-001"}}'
    Prüfen: Task vorhanden? JSON korrekt? Duplikat blockiert?
```

### Phase C: Skill erstellen und verbinden

```
C1: Custom Skill definieren (nach openclaw/skills/task-create.md)
C2: Skill implementieren (HTTP POST an Webhook)
C3: End-to-End-Test via Telegram
C4: Telegram-Trigger in n8n endgültig deaktivieren
    (ERST wenn C3 stabil)
```

### Phase D: 7-Tage-Bewährungstest

```
D1: Täglich 3+ Tasks per Telegram erstellen
D2: Metriken: Erfolgsrate, Latenz, Fehler, False Positives
D3: Prompt-Tuning und Validierung iterieren
D4: Go/No-Go für VS2 (>90% Erfolg, keine kritischen Fehler)
```

---

## 6. Webhook Input/Output Schema

### Input: POST /webhook/task-create

```json
{
  "intent": "task.create",
  "title": "Rechnung senden",
  "params": {
    "due": "2026-04-18",
    "prio": "M",
    "project": "",
    "context": ""
  },
  "source": {
    "channel": "telegram",
    "chat_id": "6526468834",
    "message_id": "12345",
    "timestamp": "2026-04-15T14:30:00Z"
  }
}
```

### Output: Erfolg

```json
{
  "ok": true,
  "action": "task.created",
  "task": {
    "id": "google-task-id",
    "title": "Rechnung senden",
    "due": "2026-04-18",
    "list": "NEXT"
  },
  "event_id": "01JRZK4M0G..."
}
```

### Output: Fehler

```json
{
  "ok": false,
  "error": "missing_title",
  "message": "Kein Titel angegeben."
}
```

Fehlertypen: `missing_title`, `invalid_date`, `unauthorized`, `duplicate`, `google_api_error`

---

## 7. Workflow-Spezifikation: WH-task-create-v1

```
Name: WH-task-create-v1
Tags: diti-ai, phase-1, webhook, vs1
Error Workflow: P1-error-handler-v1 (ID: ezKkyglJhrTwPi8n)

Credential-IDs:
- Google Tasks: s305fscwssjI56L7
- Telegram (Error Handler): Arepn5qW2Si65rVX

Node-Reihenfolge:
1. Webhook Trigger (POST /webhook/task-create, Header Auth, responseNode)
2. Validate Input (Code Node) → Error Branch bei Fehler
3. Dedup Check (Code Node, source.channel + source.message_id, max 1000)
4. Generate Event Envelope (Code Node, ULID aus command-parser.js)
5. Google Tasks: Create (Liste NEXT, Title, Due, Notes)
6. Build Success Response (Code Node)
7. Respond to Webhook (JSON, HTTP 200)

Error Branch:
8. Build Error Response (Code Node)
9. Respond to Webhook (JSON, HTTP 400)
```

---

## 8. Netzwerk

| Von | Nach | Protokoll |
|---|---|---|
| OpenClaw | n8n Webhook | HTTP localhost:5678 |
| OpenClaw | Telegram API | HTTPS (ausgehend) |
| n8n | Google APIs | HTTPS (bestehend) |
| n8n | Obsidian Vault | Dateisystem (Docker Mount) |

n8n Webhook NICHT ins öffentliche Internet exponieren.
Bei separaten Hosts: Tailscale/WireGuard + Bearer Auth.

---

## 9. Phasen nach VS1

| Phase | Was | Voraussetzung |
|---|---|---|
| **VS1** | Task erstellen | JETZT |
| VS2 | Follow-up erstellen | VS1 stabil 7 Tage |
| VS3 | Knowledge Draft | VS2 stabil |
| VS4 | Kalender-Abfrage | VS3 stabil |
| VS5 | WhatsApp Kanal | VS4 stabil |
| VS6 | Shopping-Split | VS5 stabil |
| VS7 | Briefing via OpenClaw | Optional |
| VS8 | Knowledge Search (RAG) | Eigenes Projekt |

**NICHT anfangen bevor VS1 stabil. Keine Ausnahmen.**

---

## 10. Regeln für Claude Code

### Pflicht
- [ ] MIGRATION-PLAN.md zuerst lesen
- [ ] AGENTS.md und CLAUDE.md für bestehende Regeln
- [ ] n8nctl.cmd und odoocli für CLI-Operationen
- [ ] Erst lesen, dann ändern

### Für Webhook-Workflow
- [ ] WH-task-create-v1.json nach Spec Abschnitt 7
- [ ] Event-Envelope aus config/event-envelope.md
- [ ] ULID-Generator aus n8n/api/command-parser.js
- [ ] Google Tasks Credential: s305fscwssjI56L7
- [ ] Telegram Credential: Arepn5qW2Si65rVX
- [ ] Webhook-Auth: Bearer Token
- [ ] Idempotenz: source.channel + source.message_id
- [ ] Error Handler: ezKkyglJhrTwPi8n

### Für OpenClaw
- [ ] openclaw/ Verzeichnis mit README, persona, .env.example
- [ ] Skills als Markdown-Specs in openclaw/skills/
- [ ] Telegram-Trigger ERST deaktivieren wenn Skill stabil

### Verboten
- [ ] P1-telegram-intake-v2 NICHT löschen (nur deaktivieren)
- [ ] SoR-Matrix NICHT ändern
- [ ] Event-Envelope NICHT ändern
- [ ] NICHT an VS2-VS8 arbeiten vor VS1-Stabilität
- [ ] NICHT OpenJarvis installieren
- [ ] NICHT WhatsApp einrichten
- [ ] NICHT bestehende Workflows refactoren die nicht zu VS1 gehören
