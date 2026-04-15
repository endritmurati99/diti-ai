# Live State Snapshot - April 15, 2026

## What changed

- Deactivated the legacy Telegram intake workflow `P1-telegram-intake-v2` so OpenClaw can own the bot token without a parallel consumer.
- Updated `WH-task-create-v1` in place on live workflow ID `YazUYXlJeIMEDTEx`.
- Restored webhook `headerAuth` and kept the code-level Bearer check.
- Switched the helper bridge to stdlib-only Python and kept the URL fallback `DITI_WEBHOOK_URL` -> `N8N_BASE_URL/webhook/task-create`.
- Created the minimal OpenClaw workspace files:
  - `openclaw/workspace/AGENTS.md`
  - `openclaw/workspace/SOUL.md`
  - `openclaw/workspace/TOOLS.md`
  - `openclaw/workspace/skills/task-create/SKILL.md`
- Added a single allowed exec bridge command:
  - `openclaw/task-create-bridge.cmd`
- Added a short OpenClaw runbook in `openclaw/README.md`.

## What happened technically

- The first backend smoke tests failed because the Google Tasks node was pointing at an invalid target and because the task-list selection was not aligned with the real Google Tasks API shape.
- I created the missing production Google Tasks list named `NEXT` and updated the workflow to use that real list ID.
- I corrected the Google Tasks node so due dates are written in RFC3339 format.
- I also set the n8n container to allow the built-in `fs` and `path` modules so the dedup file can be written safely inside `/home/node/.n8n/data/dedup-store.json`.

## What works now

- `openclaw --version` works and reports `OpenClaw 2026.4.14`.
- `openclaw config validate` passes.
- OpenClaw gateway health is `OK`, and Telegram shows as connected.
- The exec allowlist contains only the VS1 bridge command.
- Backend webhook happy path works.
- Unauthorized requests are rejected.
- Duplicate webhook requests are rejected.
- The helper works standalone with stdin JSON.
- Missing `DITI_WEBHOOK_SECRET` fails cleanly.
- Google Tasks writes now land in the real `NEXT` list.

## What is still open

- The true Telegram end-to-end path still needs one real inbound message from the allowlisted chat `6526468834`.
- That final check should confirm:
  - a natural-language task creates one Google Task in `NEXT`
  - the same message does not create a duplicate
  - an empty task request triggers clarification instead of a write

## Short verdict

OpenClaw is ready for backend/helper testing now.
The final Telegram E2E check is still pending, so the slice is close but not fully closed yet.
