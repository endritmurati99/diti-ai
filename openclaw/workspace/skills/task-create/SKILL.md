# Skill: task-create

## Purpose

Forward a validated VS1 task-create request to the local n8n webhook through the dependency-free Python bridge.

## Intent

- `task.create`

## Required Field

- `title`

## Optional Fields

- `due` in `YYYY-MM-DD`
- `prio` in `H`, `M`, `L`

## Bridge Path

Only this command may be executed:

- `C:\Users\endri\Desktop\Claude-Projects\Diti AI\openclaw\task-create-bridge.cmd`

## Input Shape

```json
{
  "args": {
    "title": "Rechnung senden",
    "due": "2026-04-18",
    "prio": "M"
  },
  "context": {
    "channel": "telegram",
    "sender_id": "6526468834",
    "message_id": "12345"
  }
}
```

## Webhook Contract

The helper must send:

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
    "timestamp": "2026-04-15T14:30:00"
  }
}
```

## Expected Success

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

## Expected Error

```json
{
  "ok": false,
  "error": "missing_title",
  "message": "Kein Titel angegeben."
}
```
