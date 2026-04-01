---
tags:
  - docs
  - security
---

# Sicherheits-, Datenschutz- und Governance-Modell

## Datenklassifizierung

| Tier | Sensitivitaet | Beispiele | Regel |
|------|--------------|-----------|-------|
| **Tier 0** | Hoch | Health-Details, Identitaeten, Finanzen, private E-Mails | Lokal (Obsidian) oder Primaersystem, nie ungefiltert in Messenger/LLM |
| **Tier 1** | Sensitiv | Projekt-Infos, berufliche Kommunikation | Nur Metadaten/Summaries in Notion, Messenger nur Links/Status |
| **Tier 2** | Low | Status, Reminder, Tagesplan (ohne Inhalte) | Darf in Messenger |

## Secrets & Credentials

- n8n Credentials: verschluesselt mit `N8N_ENCRYPTION_KEY` (einmal setzen, sicher aufbewahren)
- Webhooks: HMAC-Signaturen/Token in Headers, Rate Limiting, IP Allowlist
- MCP Token: Rotation aktivieren, alte Tokens werden revoked
- `.env` Datei: nie committen, `.gitignore` sicherstellen

## Absicherung gegen Fehlaktionen

1. **Draft-only** fuer E-Mail-Antworten
2. **Two-step Commit**: Agent erstellt Vorschlag -> User bestaetigt -> Write
3. **Idempotency Keys** ueberall
4. **Dead-letter Queue**: fehlgeschlagene Events in Notion "Ops/Errors" + taeglicher Review
