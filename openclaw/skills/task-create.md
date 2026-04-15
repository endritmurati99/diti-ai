# Skill: task-create

## Purpose
Create a task by sending a deterministic request to n8n (execution layer).

This skill is the **only** allowed execution path for VS1 task creation.

## Endpoint
- **Method**: POST
- **URL**: `http://localhost:5678/webhook/task-create`
- **Auth**: Header `Authorization: Bearer <DITI_WEBHOOK_SECRET>`
- **Content-Type**: `application/json`

## Request JSON (MUST match exactly)

```json
{
  "intent": "task.create",
  "title": "Task Name",
  "params": { "due": "YYYY-MM-DD", "prio": "M", "project": "", "context": "" },
  "source": { "channel": "telegram", "chat_id": "6526468834", "message_id": "12345", "timestamp": "2026-04-15T14:30:00Z" }
}
```

## Field rules
- `intent`: always `"task.create"`
- `title`: required, non-empty string
- `params`:
  - `due`: optional; if present must be `YYYY-MM-DD`
  - `prio`: default `"M"`
  - `project`: default `""`
  - `context`: default `""`
- `source`:
  - `channel`: `"telegram"`
  - `chat_id`: Telegram chat id as string
  - `message_id`: Telegram message id as string (used for idempotency)
  - `timestamp`: ISO string

## Expected success response

```json
{
  "ok": true,
  "action": "task.created",
  "task": { "id": "google-task-id", "title": "Task Name", "due": "YYYY-MM-DD", "list": "NEXT" },
  "event_id": "01JRZK4M0G..."
}
```

## Expected error response

```json
{
  "ok": false,
  "error": "missing_title",
  "message": "Kein Titel angegeben."
}
```

