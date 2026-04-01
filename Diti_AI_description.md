# Persönliches AI-Assistenzsystem als Operating System für Planung, Ausführung, Wissen und Gesundheit

## Executive Summary

Du willst kein „Produktivitätssystem“, sondern ein belastbares, eventgetriebenes Personal-OS: Eingänge (E-Mail, Messenger, Kalender, Trainings/Health) werden zu **standardisierten Events**, diese werden **orchestriert**, erzeugen **Tasks/Follow-ups/Projekte/Notizen**, und liefern **harte Feedback-Loops** (Daily/Weekly/Deadline-Eskalationen). Das ist machbar – aber nur, wenn du **System of Record strikt definierst**, **Human-in-the-loop für riskante Aktionen** erzwingst, und **Automationen erst nach Observability** scharf schaltest.

Kernentscheidungen (80/20):
- **n8n ist Orchestrierung + Event-Backbone**, nicht dein Wissens- oder Task-Store. Es hat fertige Nodes für Gmail/Calendar/Tasks/Notion sowie WhatsApp-Cloud und kann eigene Webhooks bedienen. citeturn0search0turn0search1turn0search2turn14search20  
- **Obsidian Vault ist kanonischer Langzeitspeicher**: lokale Markdown-Dateien im Dateisystem, automatisierbar über Datei-Writes oder Obsidian-URI. citeturn4view1turn16search0  
- **Notion ist Operations-/Dashboard-Layer** mit API-Limits (≈3 req/s je Integration) → du planst mit Caching/Queues, nicht mit „alles live in Notion“. citeturn5view1turn6search0  
- **Google Tasks + Gmail + Calendar sind ein integriertes Execution-Trio**: E-Mail→Task ist nativ, Tasks mit Datum erscheinen im Kalender, und du kannst Free/Busy belastbar per Calendar API abfragen. citeturn23view4turn23view5turn7search0  
- **Garmin ist der harte Teil**: Offizielle Garmin-APIs sind auf „approved business developers“ ausgerichtet und können Lizenz-/Approval-Hürden haben. citeturn11view0turn11view1turn23view1  
  Für „realistisch nutzbar“ brauchst du entweder (a) **Workarounds** (Exports / Drittplattform) oder (b) eine **Zwischenschicht** wie entity["company","Strava","fitness platform company"], weil Garmin→Strava Autosync offiziell existiert und Strava eine öffentliche API hat. citeturn25view0turn10search1  
- **WhatsApp als Feedbackkanal ist machbar, aber kein Hobbyprojekt**: WhatsApp Business Platform setzt Regeln (Templates außerhalb 24h Fenster), und WhatsApp Cloud API ist Business-Stack, nicht „privater Bot“. citeturn23view3turn0search3turn0search22  
  Für MVP ist Telegram/Slack rationaler, WhatsApp ist Phase 3–5.

## Premise Correction und präzise Problemdefinition

**PREMISE CORRECTION:**  
- „Jarvis“ als ein einzelner Super-Agent ist eine falsche Architektur. Realistisch ist ein **System aus Rollen + Workflows + Speichern + Regeln + Rückkopplung**. Ohne klare SoR-Regeln entstehen doppelte Wahrheiten und du verlierst Vertrauen in das System – dann nutzt du es nicht.  
- „Garmin einfach per API anzapfen“ ist naiv. Garmin bietet zwar Health/Activity/Training APIs, aber Zugang ist „free to approved business developers“ und teils kommerziell lizenzpflichtig. Das ist nicht garantiert als Einzelanwender. citeturn11view0turn11view1turn23view1  
- „WhatsApp als Standard-Botkanal“ ist technisch/organisatorisch riskant: Plattformregeln (24h Window + Templates) und Business-Setup/Compliance-Friktion. citeturn23view3turn0search3  
- „Notion als kanonischer Wissensspeicher“ wäre ein Lock-in-/Latenz-/API-Limit-Killer. Obsidian als lokaler Markdown-Store ist für Langzeitwissen strukturell robuster. citeturn4view1turn5view1  

**A. Präzise Problemdefinition (was du wirklich baust)**  
Du baust ein persönliches „Control System“ mit fünf Kernfunktionen:
1) **Intake/Inbox-Standardisierung**: Jede Eingabe wird zu einem Event mit Typ, Kontext, Priorität, Frist, Projektbezug, Zielsystem.  
2) **Entscheidungslogik**: Antwort vs Task vs Follow-up vs Knowledge vs Automation.  
3) **Ausführungs-Backbone**: Trigger → Verarbeitung → Zielsystem → Logging → Feedback.  
4) **Second-Brain als Informationsarchitektur (Obsidian)**: Entscheidungen/SOPs/Lerneffekte werden finalisiert, versioniert, auffindbar. citeturn4view1turn16search10  
5) **Disziplin-Schleifen**: Daily/Weekly Reviews, Abweichungsanalyse, Eskalationen, ohne Notification-Spam.

**Zielbild in einem Absatz**  
Ein modularer Personal-OS-Stack, der E-Mails, Kalender, Tasks, Projekte, Wissen und Gesundheitsdaten in klare SoR-Schichten trennt, Eingaben über wenige Kanäle in strukturierte Events verwandelt, daraus automatisiert Aufgaben/Follow-ups/Notizen/Workflows erzeugt, jede Automation beobachtbar macht, und dich über definierte Feedback-Loops zu konsequentem Handeln zwingt.

## Zielarchitektur

**B. Zielarchitektur (End-to-End, textuell, sauber getrennt)**

### Hauptkomponenten und Verantwortung
1) **Capture & Command Layer (Input)**
   - Messenger-Commands (Primär), Gmail-Label-Trigger (sekundär), Kalender-Interaktionen, Quick-Capture (Text/Voice).
2) **Orchestrierung / Workflow Runtime (n8n)**
   - Trigger, Routing, Datenpipelines, Sync-Jobs, Benachrichtigungen, Human-in-loop Gates. n8n hat Webhook-Trigger und fertige Integrationen für Google/Notion/Messenger. citeturn14search20turn0search0turn0search2  
3) **Agentic Tooling für Engineering & Pflege**
   - **Claude Code** (Terminal/IDE/Tools/Git): liest Codebase, editiert Files, führt Commands aus. citeturn22view0  
   - **Codex CLI**: lokaler Coding-Agent, kann Code lesen/ändern/ausführen, open source. citeturn22view1  
4) **Operations Layer (Notion)**
   - Projekte, Dashboards, Metriken, Statusmodelle. API mit klaren Limits (≈3 req/s) → Queue/Caching obligatorisch. citeturn5view1turn6search0  
   - Optional: Notion Webhooks für Änderungen (wenn sinnvoll), nicht als „Realtime-DB“. citeturn6search1turn6search3  
5) **Knowledge Layer (Obsidian Vault)**
   - Finales Wissen, SOPs, Entscheidungen, Lernartefakte, Meeting Notes (finalisiert). Vault = lokaler Ordner; Notizen = Markdown. citeturn4view1turn1search5  
   - Automatisierbar via Dateioperationen oder Obsidian URI (create/open). citeturn16search0  
6) **Work Execution Layer (Google)**
   - Gmail SoR für Kommunikation. n8n kann per Gmail-Node/Trigger arbeiten; Trigger ist poll-basiert in n8n. citeturn0search0turn0search4  
   - Tasks/Kalender: nativ integrierbar, E-Mail→Task ist Standard, Tasks erscheinen im Kalender, Free/Busy per API. citeturn23view4turn23view5turn7search0  
7) **Health/Training Layer**
   - Garmin als Datenquelle (aber Integrationsrealität beachten). Offizielle Garmin APIs sind program-/approval-getrieben. citeturn11view0turn11view1turn23view1  
   - Alternativ/ergänzend: Strava als API-freundlicher Activity-Hub via Autosync. citeturn25view0turn10search1  
   - Ernährung: Garmin Connect+ bietet Nutrition-Logging (Food DB, Barcode, Kamera/AI) – aber nicht automatisch API-exponiert. citeturn22view4turn20search8  

### Trigger- und Event-Modell
- **Trigger-Typen**
  - Inbound: Webhook (Messenger/Forms), Gmail Label/Inbox Poll, Kalender-Events/Push (wo sinnvoll), geplante Cron-Jobs (Daily/Weekly).
  - Outbound: Messenger-Notifications, Task-Erzeugung, Notion-Updates, Obsidian-Note-Write.
- **Event-Envelope (kanonisch)**
  - `event_id` (ULID), `event_type`, `source_system`, `source_id`, `timestamp`, `actor=user|agent`, `payload`, `routing_decision`, `audit`.
- **Idempotenz**
  - Jeder Workflow checkt `{source_system, source_id}` gegen Event-Registry (n8n DB oder eigene kleine Tabelle), sonst entstehen Duplikate.

### Speicherlogik (Trennung der Schichten)
- **Wissen**: Obsidian – final, kuratiert, versionierbar. citeturn4view1  
- **Operationen**: Notion – Dashboard/Status/Projektlandkarte, nicht „alles Wissen“.  
- **Kommunikation**: Gmail – unverändert, nur Labels/Metadaten.  
- **Ausführung**: Google Tasks + Calendar – Tasks/Termine, minimaler Overhead.  
- **Logs**: n8n Execution Logs + „Agent Journal“ (komprimiert) in Obsidian.

### Authentifizierung und Berechtigung (High-Level)
- Google: OAuth2 (n8n unterstützt OAuth2, bei Cloud teils „Managed OAuth2“ für Google Nodes). citeturn4view2  
- Notion: Integration Token; Seiten müssen explizit mit Integration geteilt werden. citeturn6search0turn6search12  
- n8n: Credentials werden mit Encryption Key verschlüsselt gespeichert; setze einen stabilen `N8N_ENCRYPTION_KEY`. citeturn22view3turn21search0  
- MCP (optional, aber strategisch): n8n hat einen eingebauten MCP-Server inkl. Token/OAuth, Workflows müssen explizit freigeschaltet werden; es gibt harte Limits (z. B. 5-Min Timeout, kein Binary Input). citeturn22view2turn18search3  

## System of Record

**C. System-of-Record-Matrix (SoR ist nicht verhandelbar)**  
Konvention: „Sekundär“ = Spiegel/Index/Derived View. „Schreibzugriff“ = wer darf im Primärsystem ändern.

| Datentyp | Primäres System (SoR) | Sekundäres System | Schreibzugriff | Lesezugriff | Synchronisationsregel | Konfliktrisiko | Empfehlung |
|---|---|---|---|---|---|---|---|
| Kalendertermine | Google Kalender | Notion Projekt-Dashboard, Obsidian Meeting Note (Link) | User + ausgewählte Automationen | Alle | Nur **Event-ID referenzieren**, keine Duplikat-Termine | Mittel | Calendar bleibt master; Notion nur Status/View |
| Aufgaben | Google Tasks | Notion Dashboards (read-only Mirror), Obsidian Tagesnotizen (Links) | User + Inbox-Agent | Alle | One-way: Tasks→Notion Mirror (Status/Datum), Notion nie autoritativ | Mittel | Tasks als Execution Queue, Notion als Reporting |
| Projekte | Notion | Obsidian Projekt-Notes (finale Erkenntnisse), Google Tasks (Tasks referenzieren Projekt-ID) | User + Planner-Agent | Alle | Notion Project-ID in Task-Notes; Obsidian linkt auf Project-ID | Niedrig | Notion = Projektlandkarte |
| E-Mails | Gmail | Notion „Comms Index“, Obsidian Knowledge (nur Zusammenfassung/Decision) | User + Inbox-Agent (Labels) | Alle | Gmail bleibt unverändert; nur Labels + Task-Links | Mittel | Keine Mail-Inhalte in Notion als SoR |
| Follow-ups | Google Tasks (Liste „Waiting“) | Notion Mirror + Gmail Label | User + Inbox-Agent | Alle | Follow-up Task enthält Thread-ID/Message-ID | Mittel | Follow-ups sind Tasks, nicht Notion-Seiten |
| Gewohnheiten/Routinen | Notion (Habit DB) | Google Calendar (Habit-Blocks optional), Messenger Logs | User + Review-Agent | Alle | Notion ist master, Calendar nur Time-Blocks | Mittel | Notion eignet sich für Habit-Metriken |
| Wissensnotizen | Obsidian Vault | Notion „Index/TOC“ optional | User + Knowledge-Agent | Alle | Obsidian ist master; Notion nur Verlinkung/Status | Niedrig | Kein Dual-Write |
| SOPs | Obsidian Vault | Notion Ops-Links | User + Ops-Agent | Alle | SOPs nur in Obsidian final | Niedrig | SOPs = langlebig → Obsidian |
| Ideen | Obsidian (Inbox/Incubator) | Notion Ideation-Board (optional, read-only) | User | Alle | Ideen werden in Review entweder verworfen oder in Projekt/Note überführt | Mittel | Verhindere „Ideenfriedhof“ in Notion |
| Einkaufslisten/Checklisten | Google Tasks (separate Liste) | Notion (optional) | User | Alle | Tasks-only, Notion keine Kopie | Niedrig | Praktisch, mobil, schnell |
| Gesundheitsdaten (all-day: Schlaf, Stress etc.) | Garmin Connect (Datenquelle) | Notion Health DB (Derived Metrics) | Auto (Import) + User (Garmin) | Alle | Importiert werden **Aggregates**, Rohdaten optional | Hoch | Erst MVP: minimal; später robust import |
| Aktivitätsdaten (Steps/Intensity) | Garmin Connect | Notion Health DB | Auto | Alle | Täglich aggregieren (Steps, Sleep, HR summaries) | Hoch | Nur wenn Import stabil |
| Trainingsdaten (automatisch) | **Option A:** Garmin Connect / **Option B:** Strava | Notion Health DB | Auto | Alle | Wenn Strava genutzt: Garmin→Strava Autosync, Import aus Strava API | Mittel | Option B ist automation-freundlicher citeturn25view0turn10search1 |
| Manuell nachgetragene Trainingseinheiten | **Option A:** Garmin Connect Manual Activity / **Option B:** Strava Manual Activity | Notion Health DB | User (Garmin/Strava) + ggf. Bot | Alle | Manuell nur 1x erfassen; System referenziert Activity-ID | Mittel | Garmin kann Manual Activities erstellen (UI) citeturn13search0 |
| Ernährungsdaten | Garmin Connect+ (wenn genutzt) oder Cronometer | Notion Weekly Summary | User + ggf. Auto-Import | Alle | Nur Summaries (Kalorien/Makros) übernehmen | Mittel | Garmin Connect+ Nutrition existiert citeturn22view4turn20search8 |
| Reflexionen | Obsidian (Daily/Weekly) | Notion KPI-Dashboard | User + Review-Agent | Alle | Obsidian master; Notion nur Metrik-Ableitung | Niedrig | Reflexion braucht Text + Kontext |
| Kontakte | Google Contacts | Notion CRM-lite (optional) | User | Alle | Kontakte nie in Notion als SoR duplizieren | Mittel | Quelle bleibt Google |
| Reminder | Google Tasks + Calendar | Messenger | User + Agents | Alle | Reminder sind Tasks/Calendar; Messenger nur Zustellung | Mittel | Kein eigener Reminder-Store |
| Meeting-Notizen | Obsidian | Notion (Meeting Index) | User + Meeting-Agent | Alle | Obsidian master; Calendar Event-ID als Property | Niedrig | Meeting→Note Template |
| Agenten-Logs | n8n Execution + Obsidian „Agent Journal“ | Notion „Ops Status“ | System | Alle | Vollständige Logs in n8n; Obsidian nur verdichtet | Mittel | Debugbarkeit > Schönheit |
| Automations-Status | n8n | Notion Status-Dashboard | System | Alle | n8n ist truth; Notion zeigt nur SLO/Fehler | Niedrig | Monitoring zuerst |
| Entscheidungen | Obsidian (Decision Records) | Notion Projektseite (Link) | User + Agents (Draft) | Alle | Entscheidungen final nur in Obsidian | Niedrig | Verhindert „Entscheidungs-Amnesie“ |

## Tool- und Integrationsbewertung

**D. Tool-Rollen und Integrationsbewertung (kritisch)**  
Hinweis: „Reifegrad“ = Eignung für deinen Use Case **ohne** Bastel-Overkill.

| Tool | Primäre Rolle im System | Technische Eignung | Reifegrad | Integrationsaufwand | Risiken | Was dort nicht liegen sollte | Empfehlung |
|---|---|---|---|---|---|---|---|
| Claude Code | Systempflege/DevOps/Repo-Agent | Stark: Codebase lesen, editieren, Commands, Tool-Integrationen citeturn22view0turn2search9 | Hoch | Mittel | Fehlaktionen bei Autonomie (Permissions), Secrets-Leak | Produktions-Secrets, private Rohdaten | **Kernsystem** für Engineering |
| Codex (CLI) | Coding-Agent + Wartung | Lokal, kann Code lesen/ändern/ausführen, OSS citeturn22view1turn2search11 | Hoch | Mittel | Gleiche Risiken (Code/Secrets), Kosten | Private Daten als Prompt-Dump | **Kernsystem** für Engineering |
| n8n | Orchestrierung, Trigger, Sync, Notifications | Sehr gut: Google Nodes, Webhooks, WhatsApp Cloud Node citeturn0search0turn0search2turn0search3turn14search20 | Hoch | Mittel | Single point of failure, Credential-Handling | Kanonisches Wissen/Tasks/Events als „DB-Ersatz“ | **Kernsystem** (Backbone) |
| Obsidian | Langzeitwissen/Second Brain | Lokal, Markdown Vault, URI-Automation citeturn4view1turn16search0 | Hoch | Mittel | Plugin-Sprawl, Unordnung | Aufgabenlisten als Primärsystem, Rohdaten-Logs | **Kernsystem** (Knowledge SoR) |
| Notion | Ops/Dashboards/DB | Gut, aber API Rate Limit ~3 rps citeturn5view1turn6search0 | Hoch | Mittel | Lock-in, Performance bei großen DBs, Webhook-Komplexität | Roh-E-Mails, Roh-Health-Daten, „alles Wissen“ | **Kernsystem** (Ops) |
| Gmail | Kommunikation SoR | Stark, API + Push möglich (Gmail API watch + Pub/Sub) citeturn17view0turn17view1 | Hoch | Mittel | Datenschutz/LLM-Summaries | Mail-Inhalte in Notion/Chat | **Kernsystem** (Comms SoR) |
| Google Tasks | Execution Tasks | Nativ mit Gmail/Calendar (E-Mail→Task; Tasks im Kalender) citeturn23view4turn23view5 | Mittel–Hoch | Niedrig–Mittel | Begrenzte Metadaten, keine offiziellen Push-Mechanismen (API listet nur CRUD) citeturn8view0 | Projektwissen/Entscheidungen | **Kernsystem** (Tasks), später ggf. ersetzen |
| Google Kalender | Zeit SoR | API Free/Busy + Push Guides citeturn7search0turn7search1 | Hoch | Mittel | Sync-Chaos bei mehreren Kalendern | Projektwissen | **Kernsystem** (Time SoR) |
| Garmin | Health/Training Quelle | Daten stark, APIs aber approval-getrieben citeturn11view0turn11view1turn23view1 | Mittel | Hoch | Kein garantierter Einzeluser-API-Zugang | Alles in n8n/Notion als Rohdaten | **Zusatzsystem** (Quelle) |
| WhatsApp | Feedback/Reminders (Wunsch) | n8n WhatsApp Cloud Node existiert citeturn0search3turn0search22 | Mittel | Hoch | Business Policies: Templates außerhalb 24h, Compliance citeturn23view3 | Health/PII, vertrauliche Inhalte | **Später**, nach MVP |
| Telegram | Feedback/Commands | Bot API ist simpel (HTTP), n8n Trigger/Nodes vorhanden citeturn3search1turn14search2turn14search15 | Hoch | Mittel | Bot-Betrieb/Token-Schutz | Geheimnisse, unverschlüsselte sensible Inhalte | **Primärkanal für MVP** |
| Slack | Feedback/Commands (Fallback) | Incoming Webhooks sehr einfach citeturn3search2turn3search6 | Hoch | Mittel | Workspace/Account-Overhead, Webhook-Limits citeturn14search12 | Health/PII | **Fallback / Work-Kontext** |

**E. Markt-/Lösungs-Check: Was bereits existiert (nicht neu bauen)**  
- Google kann E-Mail→Task direkt: Gmail erzeugt Tasks, gespeichert in Google Tasks, sichtbar im Gmail Side Panel. citeturn23view4  
- Tasks sind im Google Calendar sichtbar, wenn datiert; Tasks lassen sich auch im Calendar erstellen/verwalten. citeturn23view5  
- Garmin→Strava Autosync ist offiziell dokumentiert; Strava bietet eine öffentliche API. Das ist die pragmatische Brücke für Trainingsautomation. citeturn25view0turn10search1  
- Scheduling/Time-Blocking für Tasks existiert als fertiges Produkt: entity["company","Reclaim.ai","calendar scheduling company"] integriert Google Tasks und blockt Zeit im Kalender. citeturn15search3  
- Ernährung/Health-Integration existiert als Produkt: entity["company","Cronometer","nutrition tracking company"] kann Garmin-Daten in Cronometer einbinden (reduziert manuelle Ernährungserfassung – aber ist ein zusätzlicher Dienst). citeturn15search0turn15search4  
- Garmin Training/Structured Workouts Publishing existiert über Training API, aber Program/Approval nötig. citeturn23view1turn11view0  

## Workflows, Command- und Wissensmodelle

**F. Eingabe- und Befehlsmodell (robust, keine Magie)**  
Ziel: Freitext ist erlaubt, aber der Standard ist ein **kompaktes Command DSL**, damit du nicht ständig nachtrainierst und nicht ständig Rückfragen bekommst.

### Eingabetypen
- Text (Messenger, Gmail snippet, Notion quick capture)
- Voice (Messenger voice note → optional Transkription über externen STT; MVP: Voice-to-text vom OS/Messenger nutzen)
- E-Mail-Event (Label/Star/Filter)
- Kalender-Event (neuer Termin, Meeting-Ende)
- Health/Training-Event (Garmin/Strava)

### Intent-Erkennung (Deterministisch zuerst, LLM als Parser)
Priorität: **Rules > LLM**. LLM nur für Parsing/Summarization/Classification, nicht als Quelle von Wahrheit.

**Command-Formate (Beispiele als DSL)**
```text
t: [Titel] /due=2026-04-18 /p=P2 /prio=H /ctx=deepwork
f: [Follow-up] /to=[Person oder E-Mail-Thread] /due=2026-04-02
k: [Knowledge] /topic=[…] /src=[link|mail|meeting] /project=P2
m: [Meeting Note] /event=calendar /actions=auto
h: sleep /note=…   | h: weigh=82.3 | h: nutrition kcal=… protein=…
w: workout run 45m rpe=7 /tags=intervals /source=manual
q: free 2026-04-18 /window=09:00-17:00 /tz=Europe/Berlin
```

### Wann wird was erzeugt?
- **Nur beantworten**: `q:` (Kalenderabfrage), „Suche im Wissen“, Statusfragen.  
- **Task erzeugen**: `t:` oder Inbox-Agent klassifiziert E-Mail als action-required und du bestätigst.  
- **Wissen speichern**: `k:` oder Meeting-Agent nach Meeting-Ende (Template + Zusammenfassung, dann Review).  
- **E-Mail klassifizieren**: nur wenn du Label setzt („AI/TRIAGE“, „AI/TODO“) oder wenn Regel greift.  
- **Training erfassen**: `w:` (manuell) oder Auto-Import (Strava/Garmin).  
- **Wochenziel aktualisieren**: nur über Weekly Review Workflow oder explizites Command (kein stilles Auto-Update).  
- **Workflow starten**: Commands + Labels + Cron.

### Wann wird eine Rückfrage erzwungen?
Hard Gates:
- Jede Aktion, die **versendet** (E-Mail reply, WhatsApp outbound) oder **löscht** oder **Termine verschiebt**, braucht Confirm.  
- Jede Aktion mit **PII/Health Content in Messenger** braucht Confirm + Redaction-Preview.

### Wann darf nichts automatisch passieren?
- Automatisches Antworten auf E-Mails (außer Draft)  
- Automatisches Umbuchen von Terminen  
- Automatisches Eskalieren an Dritte  
- Automatisches Schreiben von „finalem Wissen“ ohne Review-Schritt

**G. Wissens- und Ordnungsmodell**

### Obsidian Vault Informationsarchitektur (SoR für Wissen)
Obsidian speichert Notizen als Markdown im Vault-Folder. citeturn4view1  
Obsidian Properties (strukturierte Metadaten) sind ideal für langlebige Taxonomie, ohne Tag-Spam. citeturn16search10  

**Ordnerstruktur (konservativ, wartbar)**
```text
00_INBOX/
10_PROJECTS/
20_AREAS/
30_KNOWLEDGE/
40_SOPS/
50_DECISIONS/
60_REVIEWS/
70_HEALTH_REPORTS/
90_ARCHIVE/
_meta/templates/
_meta/agent-journal/
```

**Benennung**
- Notes: `YYYY-MM-DD - Titel.md` für Reviews/Meetings  
- Decisions: `DR-YYYY-NNN - Thema.md` (Decision Record)  
- SOPs: `SOP - Prozessname.md`  
- Projekt: `P2 - Projektname.md`

**Metadaten (Properties)**
- `id` (ULID), `source` (gmail|calendar|manual|…), `source_id`, `project_id`, `status`, `review_state`, `created`, `updated`.  

**Templates**
- Meeting Note Template (Agenda, Decisions, Action Items, Links)
- Weekly Review Template (Ziele, Kennzahlen, Abweichungen, nächste Woche)
- Decision Record Template (Context → Options → Decision → Consequences)

**Regeln gegen Informationsmüll**
- INBOX ist ein „Queue“, nicht ein Archiv: Alles älter als 14 Tage wird im Weekly Review verpflichtend verarbeitet (promote/kill).  
- Knowledge wird erst „final“, wenn: (a) Quelle verlinkt, (b) 3–5 Bullet Learnings, (c) nächste Aktion oder SOP/Decision.

### Notion Informationsarchitektur (Ops Layer)
Constraints: API Rate Limit ~3 req/s + Payload Limits, daher keine „Chatty Syncs“. citeturn5view1turn5view2  
Notion Integration braucht explizites Sharing pro Page. citeturn6search0  

**Kern-Datenbanken**
- Projects (SoR Projekte)
- Ops Dashboard (Rollups)
- Habits & Weekly Goals
- Health Weekly (Aggregates, keine Rohdaten)
- Task Mirror (read-only, aus Google Tasks)
- Automation Registry (Workflow, last_run, error_state, SLO)

**H. Gmail-, Kalender- und Task-Architektur**

### Gmail-Verarbeitungslogik (Inbox-Triage ohne Chaos)
n8n kann Gmail operationell bedienen (Messages/Labels/Threads). citeturn0search0  
Gmail Trigger in n8n ist poll-basiert (Poll Time). citeturn0search4  
Wenn du Push willst, ist Gmail API Watch + Pub/Sub der offizielle Weg (mit Expiration/Renew). citeturn17view0turn17view1  

**Label-Set (minimal, aber stark)**
- `AI/TRIAGE` (Agent darf analysieren + klassifizieren + Vorschläge senden)
- `AI/TODO` (Agent darf Task erstellen)
- `AI/FOLLOWUP` (Agent erstellt Follow-up Task)
- `AI/KNOWLEDGE` (Agent erstellt Obsidian Draft Note)
- `AI/BLOCKED` (keine Automation; schützt sensitive Threads)

**Triage-Regeln**
- Standard: Alles bleibt Inbox, bis du Label setzt (reduziert LLM-Kosten + Fehlaktionen).
- Agent-Aktionen:
  - `AI/TRIAGE`: Summary + classification + next action suggestion
  - `AI/TODO`: Create Google Task + back-link in Gmail (Label + Task-ID in Note/Task)
  - `AI/FOLLOWUP`: Waiting-Task mit Frist, Kontakt, Thread-ID

### Tasks als Execution Layer
- Gmail→Task ist nativ; Gmail sagt explizit: Task wird in Google Tasks gespeichert. citeturn23view4  
- Tasks mit Datum erscheinen im Google Calendar. citeturn23view5  
- API-seitig: Google Tasks API bietet CRUD für tasks/tasklists; keine Watch-API in der Referenz → plane Poll/Sync Jobs (Inference aus API-Struktur). citeturn8view0  

**Task-Listen (empfohlen, low-friction)**
- `INBOX` (nur Capture)
- `NEXT` (nächste Aktionen)
- `WAITING` (Follow-ups)
- `SOMEDAY` (Parkplatz)
- `SHOPPING` (Einkauf)

### Kalenderabfrage „Habe ich am 18.4 frei?“
- Belastbar über Google Calendar Freebusy API: liefert Free/Busy für Kalender-Sets. citeturn7search0  
- Für Realtime Push auf Calendar-Changes existiert ein Push-Guide + Watch-Channels. citeturn7search1turn7search16  
MVP: Abfrage via Freebusy + definierte Arbeitsfensterregeln (z. B. 09–17 Uhr).

## Agenten, Feedback, Gesundheit, Sicherheit und Governance

**I. Agenten- und Automationsdesign (minimal, realistisch, wartbar)**  
Du brauchst keine „20 Agents“. Du brauchst 6–8 Rollen mit harten Rechten.

**Agentenlandschaft (Minimum Viable)**
1) **Intake-Agent**
   - Aufgabe: Commands parsen, Event erzeugen, Routing bestimmen.
   - Tools: n8n Webhook/Messenger Nodes; optional LLM Parser.
   - Verboten: Schreiben in Obsidian final; E-Mail senden.
   - Logging: jedes Event mit `event_id`, `intent_confidence`, `target_system`.

2) **Inbox-Agent**
   - Aufgabe: Gmail Label Workflows: Summary, Klassifikation, Task/Follow-up Draft.
   - Tools: n8n Gmail Node/Trigger. citeturn0search0turn0search4  
   - Eskalation: wenn „Send email“ → Draft-only + Confirm.
   - Speicherung: Task-ID + Thread-ID crosslinks.

3) **Planner-Agent**
   - Aufgabe: Tagesplanung/Wochenplanung: Tasks + Kalender + Prioritäten.
   - Tools: Google Calendar API (Freebusy), Google Tasks, Notion Dashboard.
   - Verboten: Termine verschieben ohne Confirm.
   - Output: Tagesplan als Messenger Briefing + Notion Snapshot.

4) **Knowledge-Agent**
   - Aufgabe: Capture→Draft in Obsidian; finalisieren nur mit Review.
   - Tools: File-write in Vault + Obsidian URI optional. citeturn16search0turn4view1  
   - Verboten: „Final knowledge“ ohne `review_state=approved`.

5) **Review-Agent**
   - Aufgabe: Daily/Weekly Review, Abweichungsanalyse, Eskalationen.
   - Tools: Notion Health/Goals DB, Tasks, Calendar.
   - Output: Weekly Report (Obsidian) + Actions (Tasks).

6) **Automation-Agent**
   - Aufgabe: n8n Monitoring, Retry/Dead-letter, SLO.
   - Tools: n8n Execution Logs, Notion Automation Registry.

7) **Health-Review-Agent**
   - Aufgabe: Trainings/Erholung/Gewohnheiten spiegeln, Empfehlungen low-friction.
   - Inputs: Garmin/Strava Aggregates + Habit DB.
   - Output: 2–3 konkrete Anpassungen/Woche, nicht „Motivation“.

8) **Coding-Agent**
   - Aufgabe: Repo-Änderungen, Workflow-as-Code, Templates.
   - Tools: Claude Code, Codex CLI. citeturn22view0turn22view1  

**n8n ↔ Agents über MCP (optional, strategisch sauber)**
- n8n hat eingebauten MCP-Server, Workflows müssen explizit freigeschaltet werden. citeturn22view2  
- MCP ist ein offenes Protokoll zum Tool-/Context-Anbinden, von entity["company","Anthropic","ai startup"] initiiert, auch von entity["company","OpenAI","ai research company"] dokumentiert/unterstützt. citeturn18search7turn18search3turn18search5  

**H. Feedback- und Notification-Design (WhatsApp vs Telegram vs Slack)**

### Technische Realisierbarkeit (hart)
- WhatsApp: außerhalb 24h nur per approved Message Templates; Policies verlangen Eskalationspfade; das ist Business-Compliance-Logik. citeturn23view3  
- Telegram: Bot API ist HTTP-basiert, direkt baubar; n8n hat Trigger/Nodes. citeturn3search1turn14search2turn14search15  
- Slack: Incoming Webhooks sind simpel (URL + JSON payload). citeturn3search2  

### Kanalbewertung
| Kriterium | WhatsApp | Telegram | Slack |
|---|---|---|---|
| Setup-Hürden | Hoch (Business Platform, Regeln) citeturn23view3turn0search3 | Mittel (Bot Token) citeturn3search1turn14search2 | Mittel (Workspace/App/Webhook) citeturn3search2 |
| Zuverlässigkeit/Lock-in | Hoch, aber Policy-gebunden | Hoch | Hoch |
| Kosten | potenziell conversation/pricing + Ops-Aufwand citeturn14search1turn23view3 | gering | gering–mittel |
| Datenschutz-Risiko | Hoch (Meta/Policy, Inhalte im Chat) | Mittel | Mittel |
| Interaktivität | Mittel (Templates/Window) | Hoch | Hoch |
| Eignung Reminder/Eskalation | Mittel–hoch, aber Compliance-lastig | Hoch | Hoch |
| Eignung Health-Feedback | riskant (Policy/PII) citeturn23view3 | Mittel (mit Redaction) | Mittel |

**Empfehlung**
- Primärkanal: **Telegram** (MVP), weil schnell, bot-fähig, n8n-ready. citeturn14search2turn14search15  
- Fallback: **Slack** (wenn Work-Kontext oder strukturierte Threads). citeturn3search2  
- WhatsApp: **später** als „Outbound Briefings“ und nur für low-sensitivity Inhalte, wenn du Business-Setup akzeptierst. citeturn23view3turn0search3  

**J. Gesundheits- und Performance-Layer (pragmatisch)**

### Was automatisch sinnvoll ist
- Trainings-Aktivitäten: Garmin→Strava Autosync (falls du Strava nutzt) und aus Strava API importieren. citeturn25view0turn10search1  
- Garmin All-day Health: Offizielle Garmin Health/Activity APIs existieren, aber Zugang ist approval-getrieben; plane nicht als MVP. citeturn11view0turn11view1  
- Ernährung: Garmin Connect+ Nutrition kann Food Logging + Reports; gut für Reduktion „App-Sprawl“, aber Integration in dein OS ist eher Export/Summary, nicht Live-API (Stand: offiziell dokumentierte Features, nicht API). citeturn22view4turn20search8  

### Was besser manuell/halbautomatisch ist (damit du es wirklich nutzt)
- „Manuelle Trainings ohne Garmin“: ultra-kurzer Command `w:` mit 4 Feldern (Sport, Dauer, Intensität/RPE, Notiz). Parallel kannst du in Garmin Connect eine Manual Activity erstellen (UI). citeturn13search0  
- Ernährung: statt „alles tracken“ → Weekly minimal set (z. B. Ø kcal, Ø Protein, Alkohol, 1–2 Trigger-Foods). Wenn du ernsthaft Macros willst: Garmin Connect+ oder Cronometer als SoR. citeturn22view4turn15search0  

### Feedback so gestalten, dass es diszipliniert, aber nicht nervt
- Daily: 1 Briefing + 1 Abend-Check (max 2 Nachrichten/Tag).  
- Escalation: nur bei **Deadline <48h + keine Aktivität** (keine Completion/keine Kalenderzeit).  
- Weekly: 1 Report mit: Ziele, Ist, Abweichung, 3 konkrete Anpassungen, 5 Tasks.

**K. Sicherheits-, Datenschutz- und Governance-Modell**

### Datenklassifizierung (praktisch)
- **Tier 0 (hoch sensitiv):** Health-Details, Identitäten, Finanz, private E-Mails  
  - bleibt lokal (Obsidian) oder in Primärsystem (Gmail/Garmin), niemals ungefiltert in Messenger/LLM.
- **Tier 1 (sensitiv):** Projekt-Infos, berufliche Kommunikation  
  - nur Metadaten/Summaries in Notion; Messenger nur Links/Status, keine Inhalte.
- **Tier 2 (low):** Status, Reminder, Tagesplan (ohne Inhalte)  
  - darf in Messenger.

### Secrets/OAuth/Webhooks
- n8n Credentials sind verschlüsselt; setze und sichere dauerhaft `N8N_ENCRYPTION_KEY`. citeturn22view3turn21search0  
- Webhooks absichern: HMAC-Signaturen/Token in Headern; Rate limiting; IP allowlist wo möglich.  
- MCP Token Rotation: n8n bietet Token-Rotation; alte Tokens werden revoked. citeturn22view2  

### Absicherung gegen Halluzinationen und falsche Automationen
- **Draft-only** für E-Mail-Antworten  
- **Two-step Commit**: Agent erstellt Vorschlag → du bestätigst → erst dann write.  
- **Idempotency keys** überall.  
- **Dead-letter Queue**: fehlgeschlagene Events landen in Notion „Ops/Errors“ + täglicher Review.

## Rollout, 30-60-90 und harte Direktive

**L. Umsetzungsplan in Phasen (langsam, kontrolliert, aber zielgerichtet)**

### Phase 0: Entscheidungen und Architektur
- Ziel: SoR, Datenmodell, Namenskonventionen, Sicherheitsbasis.
- Deliverables: SoR-Matrix (oben), Vault-Struktur, Notion DB Schemas, n8n Projektstruktur, Secrets/Keys.
- Voraussetzungen: n8n Instanz + Encryption Key fix. citeturn22view3  
- Risiken: Scope-Creep.
- Abnahme: „Kein Datentyp ohne SoR“, „kein Workflow ohne Logging“.
- Nicht bauen: Agents, Health-Automation.

### Phase 1: MVP minimal funktionsfähig
- Ziel: Ein Capture-Kanal → Tasks/Notes + Feedback.
- Deliverables:
  - Telegram Bot → n8n Webhook Intake → Google Task oder Obsidian Draft
  - Gmail Label `AI/TODO` → Task erzeugen
  - Daily Briefing (Tasks heute + 1 Top-Priorität)
- Voraussetzungen: Google OAuth in n8n. citeturn4view2  
- Risiken: Duplikate → Idempotenz erzwingen.
- Abnahme: 7 Tage Nutzung ohne „manuelle Nacharbeit“ >10 min/Tag.

### Phase 2: Stabile Alltagsnutzung
- Ziel: Weekly Review + Projektlandkarte.
- Deliverables:
  - Notion Projects DB + Dashboard
  - Weekly Report in Obsidian + automatische Task-Erzeugung
  - Automation Registry + Error Queue
- Risiken: Notion Rate Limits → Queue/Caching. citeturn5view1  
- Abnahme: Weekly Review in <45 min, mit klaren Next Actions.

### Phase 3: E-Mail-, Task- und Kalenderintelligenz
- Ziel: Inbox Zero-ish ohne Selbstbetrug.
- Deliverables:
  - Gmail Triage Workflow (Summary + Action Vorschläge)
  - Kalenderabfrage per Freebusy API („bin ich frei?“) citeturn7search0  
  - Follow-up Engine (WAITING Liste, Eskalationen)
- Risiken: falsche Autoresponses → Draft-only.
- Abnahme: Follow-ups sinken nicht unter den Tisch (0 überfällige WAITING >7 Tage).

### Phase 4: Health-, Trainings- und Feedback-Layer
- Ziel: Training/Erholung/Ernährung in Weekly Feedback.
- Deliverables:
  - Entscheidung: Garmin-only (schwer) vs Garmin→Strava Hub (pragmatisch) citeturn25view0turn11view0  
  - Manuelles Workout Command `w:` + Weekly Aggregates
  - Nutrition: Garmin Connect+ oder Cronometer als SoR (optional) citeturn22view4turn15search0  
- Risiken: Overtracking → minimal metrics.
- Abnahme: 4 Wochen Health Reviews mit 3 konkreten Anpassungen/Woche.

### Phase 5: Agentisierung und Automatisierung
- Ziel: Rollen sauber trennen, MCP optional.
- Deliverables:
  - MCP-Anbindung n8n (falls gewollt) + freigeschaltete Workflows citeturn22view2turn18search3  
  - Agent SOPs + Permissions Matrix
- Risiken: Autonomie → Hard Gates behalten.
- Abnahme: Keine unerklärten Writes, vollständige Audit Trails.

### Phase 6: Optimierung, Metriken, Review-Schleifen
- Ziel: System wird besser, nicht größer.
- Deliverables: SLOs, Error Budget, „Workflow TCO“-Review, Refactoring.
- Risiken: Tool-Sprawl.
- Abnahme: Reduzierte Komplexität bei gleicher Leistung.

**M. 30-60-90-Tage-Plan (hart, realistisch)**

### 0–30 Tage: Nutzen erzwingen, keine Spielerei
- Telegram Intake live (t/k/q/w minimal), Daily Briefing, Gmail Label→Task. citeturn14search2turn23view4turn0search0  
- Obsidian Vault Struktur + 3 Templates (Meeting/Weekly/Decision). citeturn4view1turn16search14  
- Notion Projects DB + Dashboard (nur Projekte, keine Tasks als SoR).  
- 1 Weekly Review Ritual, automatisch Task-Pakete erzeugen.

### 31–60 Tage: Stabilität + Inbox/Calendar Intelligence
- Kalender Freebusy Abfrage Workflow produktiv. citeturn7search0  
- Inbox-Agent: Summaries + Follow-up Engine (WAITING).  
- Automations Registry + Dead-letter Queue.

### 61–90 Tage: Health/Training Layer (pragmatisch)
- Entscheidung Strava-Hub ja/nein; wenn ja: Garmin→Strava connect + Import aus Strava API. citeturn25view0turn10search1  
- Manuelles Workout Logging über `w:` + Weekly Health Summary.
- Ernährung: nur wenn du bereit bist zu tracken; sonst minimal metrics + Garmin Connect+ optional. citeturn22view4  

**N. Direktive Schlussfolgerung (kompromisslos)**  
- **Was du exakt bauen solltest:**  
  Ein eventgetriebenes Personal-OS mit n8n als Backbone, Google (Gmail/Tasks/Calendar) als Execution/Comms, Notion als Project/Ops Layer, Obsidian als Knowledge SoR, plus Health Layer mit klarer Garmin-Integrationsstrategie.  
- **Was du zuerst bauen solltest:**  
  Intake (Telegram) → Task/Knowledge Routing → Daily/Weekly Feedback. Erst wenn das sitzt, Inbox-Automation und Health.  
- **Was du vorerst nicht bauen solltest:**  
  Vollautonome Agents, automatische E-Mail-Antworten, direkte Garmin-API-Integration als MVP, WhatsApp als primärer Botkanal. citeturn11view0turn23view3  
- **Welche Architektur ist für deinen Fall die beste:**  
  „SoR-first, rules-first, event-driven“ mit Human-in-loop Gates und Observability.  
- **Die 3–5 Entscheidungen, die 80% Erfolg bestimmen:**  
  1) Tasks SoR (Google Tasks) strikt durchziehen. citeturn23view4turn23view5  
  2) Obsidian bleibt finaler Wissensspeicher, Notion bleibt Ops. citeturn4view1turn5view1  
  3) Garmin-Strategie: approval-API vs Strava-Hub vs Export – vor Phase 4 final entscheiden. citeturn11view0turn25view0  
  4) Feedbackkanal: Telegram jetzt, WhatsApp später. citeturn23view3turn14search2  
  5) Keine Automation ohne: Idempotenz, Logging, Dead-letter.

**Konkrete erste 10 nächsten Schritte**
1) n8n self-host oder Cloud aufsetzen; **Encryption Key fixieren** und sichern. citeturn22view3  
2) n8n Google OAuth2 Credentials für Gmail/Calendar/Tasks einrichten (mind. ein Konto). citeturn4view2turn0search0turn0search2  
3) Telegram Bot erstellen + n8n Telegram Trigger/Webhook Intake bauen. citeturn3search1turn14search2turn14search20  
4) Command DSL implementieren (`t:`, `k:`, `q:`, `w:`) inkl. Idempotenz-Registry.  
5) Obsidian Vault Ordnerstruktur + 3 Templates erstellen; Draft-Write Mechanik (Datei) definieren; optional Obsidian URI nutzen. citeturn4view1turn16search0turn16search14  
6) Notion Projects DB + Ops Dashboard minimal erstellen; Integrations-Token anlegen; Pages gezielt teilen. citeturn6search0turn6search12  
7) Gmail Label-Workflow: `AI/TODO` → Google Task erzeugen; `AI/FOLLOWUP` → WAITING Task. citeturn0search0turn23view4  
8) Daily Briefing Workflow: „Top 3 Tasks heute“ + „1 harte Priorität“ + „1 Risiko/Deadline“.  
9) Weekly Review Workflow: Abweichungen (Due vs Done), Projektstatus, nächste Woche Task-Pakete, Obsidian Weekly Note erzeugen.  
10) Garmin/Training Strategie schriftlich festlegen:  
   - Wenn Automation wichtig: Garmin→Strava connect + Import aus Strava API. citeturn25view0turn10search1  
   - Wenn Privacy wichtiger: Garmin-only, aber dann Health-Automation als spätere Phase (Approval/API/Export). citeturn11view0turn11view1