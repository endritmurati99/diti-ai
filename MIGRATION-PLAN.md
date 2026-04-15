# Diti AI → OpenClaw Hybrid Migration Plan

> Dieses Dokument ist die kanonische Anweisung für Claude Code und alle Agenten.
> Es ersetzt keine bestehende Datei, sondern ergänzt das Projekt um den Migrationsplan.
> Datum: 2026-04-15
> OpenClaw Version: 2026.4.14 (pinned)
> VS1 Cutover Override: `P1-telegram-intake-v2` must be deactivated before OpenClaw takes the Telegram bot token. No parallel Telegram pilot with the same bot is allowed.

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
| `openclaw/skills/task-create.tool.json` | Tool-Definition VS1 | Phase C |
| `openclaw/skills/task_create_helper.py` | HTTP-Executor | Phase C |
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
   POST http://localhost:5678/webhook/task-create
   {
     "intent": "task.create",
     "title": "Rechnung senden",
     "params": { "due": "2026-04-18", "prio": "M", "project": "", "context": "" },
     "source": { "channel": "telegram", "chat_id": "6526468834", "message_id": "12345", "timestamp": "2026-04-15T14:30:00Z" }
   }

4. n8n verarbeitet (als Execution Layer):
   a) Validiert JSON (Authentifizierung via Bearer Token + Inhaltsprüfung)
   b) Idempotenz-Check (persistent gegen /home/node/.n8n/data/dedup-store.json)
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
    P1-telegram-intake-v2 zuerst deaktivieren
    openclaw config set channels.telegram.enabled true --strict-json
    openclaw config set channels.telegram.botToken --ref-provider default --ref-source env --ref-id TELEGRAM_BOT_TOKEN
    openclaw config set channels.telegram.dmPolicy '"allowlist"' --strict-json
    openclaw config set channels.telegram.allowFrom '[6526468834]' --strict-json
    openclaw gateway restart
    Pairing: /start → openclaw pairing approve <CODE>

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
    Auth: Header Auth (Bearer Token)
    Nodes: Validate (Secret Check) → Dedup (Persistent File-based) → EventEnvelope → GoogleTasks → Response
    Error Branch: BuildError → ErrorResponse
    Error Workflow: P1-error-handler-v1

B2: Importieren und aktivieren
    diti-n8n.cmd workflow import WH-task-create-v1.json
    diti-n8n.cmd workflow activate <id>

B3: Manueller Test via curl
    curl -X POST http://localhost:5678/webhook/task-create \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <SECRET>" \
      -d '{"intent":"task.create","title":"Curl-Test","params":{"due":"2026-04-20","prio":"M"},"source":{"channel":"test","chat_id":"6526468834","message_id":"curl-001"}}'
```

### Phase C: Skill erstellen und verbinden

```
C1: Workspace definieren (openclaw/workspace/SOUL.md + skills/task-create/SKILL.md)
    - OpenClaw fungiert als NLP-zu-Schema-Übersetzer.
C2: Skill-Executor implementieren (via openclaw/skills/task_create_helper.py)
    - Rein technisches Routing der Schema-Daten an den n8n-Webhook.
    - Nutzt nur Python-Standardbibliothek an localhost:5678
C3: End-to-End-Test via Telegram
C4: 7-Tage-Pilot nur mit OpenClaw als einzigem Telegram-Consumer
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
3. Dedup Check (Code Node, nutzt /home/node/.n8n/data/dedup-store.json)
    - Persistent in n8n-Container-Volume
    - TTL: 7 Tage, Max: 1000 Einträge
4. Generate Event Envelope (Code Node, ULID-Generation)
5. Google Tasks: Create (Liste NEXT, Title, Due, Notes)
6. Build Success Response (Code Node)
7. Respond to Webhook (JSON, HTTP 200)
```

---

### Phase 1: Lokal (aktuell)
- OpenClaw auf Host oder WSL2
- n8n in Docker (Container)
- Kommunikation via http://localhost:5678 (Host-Side Port Mapping)

### Phase 2: VPS (Zukunft)
- Umstellung auf Hostnamen / Tailscale / WireGuard
- Kein localhost mehr verwenden.

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

---

## 10. Regeln für Claude Code

### Pflicht
- [x] MIGRATION-PLAN.md zuerst lesen
- [ ] AGENTS.md und CLAUDE.md für bestehende Regeln
- [ ] n8nctl.cmd und odoocli für CLI-Operationen
- [ ] Erst lesen, dann ändern

### Für Webhook-Workflow
- [x] WH-task-create-v1.json nach Spec Abschnitt 7
- [x] Dedup: n8n/data/dedup-store.json
- [x] Google Tasks Credential: s305fscwssjI56L7
- [x] Telegram Credential: Arepn5qW2Si65rVX

### Für OpenClaw
- [x] openclaw/workspace/SOUL.md
- [x] openclaw/workspace/skills/task-create/SKILL.md
- [x] openclaw/skills/task_create_helper.py
- [x] Telegram-Trigger VOR OpenClaw-Cutover deaktivieren
