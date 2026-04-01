---
tags:
  - config
  - sor
---

# System-of-Record Matrix

> [!important] SoR ist nicht verhandelbar
> Jeder Datentyp hat genau ein Primaersystem. Sekundaersysteme sind Spiegel/Index/Derived Views.

| Datentyp | Primaeres System (SoR) | Sekundaer | Schreibzugriff | Sync-Regel |
|---|---|---|---|---|
| Kalendertermine | Google Kalender | Notion (View), Obsidian (Link) | User + Automationen | Event-ID referenzieren, keine Duplikate |
| Aufgaben | Google Tasks | Notion (read-only Mirror) | User + Inbox-Agent | One-way: Tasks -> Notion |
| Projekte | Notion | Obsidian (finale Erkenntnisse) | User + Planner-Agent | Notion Project-ID in Tasks |
| E-Mails | Gmail | Notion (Comms Index) | User + Inbox-Agent (Labels) | Gmail unveraendert, nur Labels |
| Follow-ups | Google Tasks (Liste "WAITING") | Notion + Gmail Label | User + Inbox-Agent | Follow-up = Task mit Thread-ID |
| Gewohnheiten | Notion (Habit DB) | Calendar (Time-Blocks) | User + Review-Agent | Notion master |
| Wissensnotizen | Obsidian Vault | Notion (Index optional) | User + Knowledge-Agent | Kein Dual-Write |
| SOPs | Obsidian Vault | Notion (Ops-Links) | User + Ops-Agent | SOPs nur in Obsidian final |
| Ideen | Obsidian (Inbox/Incubator) | — | User | Review: verwerfen oder ueberführen |
| Einkaufslisten | Google Tasks (separate Liste) | — | User | Tasks-only |
| Gesundheitsdaten | Garmin Connect | Notion (Derived Metrics) | Auto + User | Nur Aggregates importieren |
| Trainingsdaten | Garmin / Strava | Notion Health DB | Auto | Strava API als pragmatische Bruecke |
| Ernaehrung | Garmin Connect+ / Cronometer | Notion (Weekly Summary) | User + Auto-Import | Nur Summaries |
| Reflexionen | Obsidian (Daily/Weekly) | Notion KPI-Dashboard | User + Review-Agent | Obsidian master |
| Kontakte | Google Contacts | — | User | Nie in Notion duplizieren |
| Meeting-Notizen | Obsidian | Notion (Meeting Index) | User + Meeting-Agent | Calendar Event-ID als Property |
| Agenten-Logs | n8n Execution + Obsidian | Notion (Ops Status) | System | n8n = truth |
| Entscheidungen | Obsidian (Decision Records) | Notion (Link) | User + Agents (Draft) | Nur in Obsidian final |
