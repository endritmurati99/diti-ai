# START-AGENTEN.md

Schnellstart fuer Codex und Claude Code im Projekt `Mobile Picking und Voice Assistant`.

## Am effizientesten

Starte den Agenten moeglichst im Projektroot:

`C:\Users\endri\Desktop\Bachelor\Mobile Picking und Voice Assistant`

Dort liegen:

- `AGENTS.md` fuer die gemeinsame Agent-Anweisung
- `CLAUDE.md` fuer Claude-Code-spezifische Regeln

## Standard-Startprompt

```text
Folge AGENTS.md und CLAUDE.md. Nutze fuer Odoo und n8n nicht MCP, sondern die lokalen CLIs odoocli und n8nctl.cmd. Fuer Agenten nach Moeglichkeit immer --json verwenden. Erst lesen und verifizieren, dann aendern.
```

## Prompt 1: Projekt orientieren

```text
Folge AGENTS.md und CLAUDE.md. Orientiere dich kurz im Projekt. Nutze fuer Odoo und n8n nur die lokalen CLIs odoocli und n8nctl.cmd, nicht MCP. Pruefe zuerst:
- n8nctl.cmd --json session status
- n8nctl.cmd --json workflow list
- odoocli --json auth whoami
- odoocli --json server version
Fasse danach kurz zusammen, was erreichbar ist und welche Workflows bzw. Odoo-Kontexte aktiv sind.
```

## Prompt 2: n8n lesen und analysieren

```text
Folge AGENTS.md. Nutze nur n8nctl.cmd, nicht MCP. Arbeite read-only. Pruefe:
- n8nctl.cmd --json server api-check
- n8nctl.cmd --json workflow list
- n8nctl.cmd --json workflow get "Quality Alert Created"
- n8nctl.cmd --json workflow local-list --details
Vergleiche lokale Workflow-Dateien mit dem Live-Stand und fasse Unterschiede kurz zusammen.
```

## Prompt 3: Odoo lesen und analysieren

```text
Folge AGENTS.md. Nutze nur odoocli, nicht MCP. Pruefe zuerst odoocli --json auth whoami. Wenn noetig, nutze odoocli auth login --password admin. Arbeite danach read-only und fuehre aus:
- odoocli --json model search-read stock.picking --fields id,name,state,scheduled_date --limit 10
- odoocli --json model search-read quality.alert.custom --fields id,name,priority,stage_id,ai_evaluation_status --limit 10
- odoocli --json model call stock.picking search_count --args "[[]]"
Fasse danach den aktuellen Odoo-Zustand kurz zusammen.
```

## Prompt 4: End-to-End Fehleranalyse

```text
Folge AGENTS.md und CLAUDE.md. Nutze Odoo und n8n ausschliesslich ueber odoocli und n8nctl.cmd. Analysiere den End-to-End-Flow fuer Quality Alerts:
1. Pruefe Odoo-Daten fuer quality.alert.custom.
2. Pruefe den Live-Workflow "Quality Alert Created" in n8n.
3. Lies den relevanten Backend-Code und die Workflow-JSON.
4. Identifiziere den wahrscheinlichsten Bruchpunkt.
Arbeite erst read-only und schlage erst danach konkrete Fixes vor.
```

## Prompt 5: Sichere Code-Aenderung

```text
Folge AGENTS.md und CLAUDE.md. Nutze odoocli und n8nctl.cmd fuer alle Odoo- und n8n-Pruefungen. Analysiere zuerst den Ist-Zustand read-only. Implementiere danach die kleinste sinnvolle Aenderung im Code. Verifiziere die Aenderung anschliessend wieder ueber die lokalen CLIs und die vorhandenen Projekt-Checks. Keine MCP-Nutzung fuer Odoo oder n8n.
```

## Prompt 6: Nur offene Quality Alerts

```text
Folge AGENTS.md. Nutze nur odoocli. Ermittle zuerst die Stages von quality.alert.stage.custom. Lies danach alle noch nicht erledigten quality.alert.custom Datensaetze und fasse sie nach Status, Prioritaet und Picking-Bezug zusammen. Arbeite read-only.
```

## Prompt 7: Pickings im Fokus

```text
Folge AGENTS.md. Nutze nur odoocli. Lies alle Pickings mit Status assigned und zeige fuer jedes die wichtigsten Felder. Falls Domains noetig sind, nutze in PowerShell eine Variable fuer den JSON-Domain-String. Arbeite read-only und fasse Engpaesse oder Auffaelligkeiten kurz zusammen.
```

## Prompt 8: Nur n8n-Aktivierungen pruefen

```text
Folge AGENTS.md. Nutze nur n8nctl.cmd. Pruefe, welche Workflows live aktiv sind, welche lokalen JSON-Dateien vorhanden sind und ob es offensichtliche Luecken zwischen lokalem Repo und n8n-Instanz gibt. Nichts aktivieren oder deaktiveren ohne explizite Rueckfrage.
```

## Praktische Regel

Fuer Agenten immer bevorzugen:

- `n8nctl.cmd --json ...`
- `odoocli --json ...`

REPL nur fuer dich manuell. Agenten arbeiten am stabilsten mit One-shot-Kommandos.
