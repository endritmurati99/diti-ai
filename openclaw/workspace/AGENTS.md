# Diti AI VS1 Workspace

This OpenClaw workspace is restricted to the VS1 Telegram task-creation slice.

- Input channel: Telegram direct messages from allowlisted sender `6526468834`
- Supported intent: `task.create`
- Execution layer: local n8n webhook `POST /webhook/task-create`
- System of record for tasks: Google Tasks `NEXT`

Anything outside VS1 is out of scope and must not be executed.
