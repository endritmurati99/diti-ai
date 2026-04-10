# AGENTS.md

Schnellzugriff fuer Agent-Arbeit mit Odoo und n8n.

Die kanonische Datei liegt hier:

`C:\Users\endri\Desktop\Bachelor\Mobile Picking und Voice Assistant\AGENTS.md`

## Standardregel

- fuer Codex, Claude Code und andere Agenten: CLI first
- `n8nctl.cmd` fuer n8n
- `odoocli` fuer Odoo
- fuer Agenten bevorzugt `--json`
- erst lesen, dann aendern

## Schnellbefehle

```powershell
n8nctl.cmd --json session status
n8nctl.cmd --json workflow list
odoocli --json auth whoami
odoocli --json db list
odoocli --json server version
```

## Wenn Odoo nicht eingeloggt ist

```powershell
odoocli auth login --password admin
```

## Wenn JSON-Domains noetig sind

```powershell
$domain = '[["state","=","assigned"]]'
odoocli --json model search-read stock.picking --domain $domain --fields id,name,state --limit 10
```
