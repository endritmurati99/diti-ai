# Live State Snapshot - April 14, 2026

## Project Context

- Diti repo commit: `5912469`
- CLI Anything n8n harness commit: `176ea78`
- Diti wrapper: `diti-n8n.cmd`
- API base: `http://localhost:5678/api/v1`
- Health URL: `http://localhost:5678/healthz`

## Wrapper Resolution

`diti-n8n.cmd --json session status` resolves:

- project root: `C:\Users\endri\Desktop\Claude-Projects\Diti AI`
- env file: `C:\Users\endri\Desktop\Claude-Projects\Diti AI\config\.env`
- compose file: `C:\Users\endri\Desktop\Bachelor\Mobile Picking und Voice Assistant\docker-compose.yml`
- workflow dir: `C:\Users\endri\Desktop\Claude-Projects\Diti AI\n8n\workflows`
- testing registry: `C:\Users\endri\Desktop\Claude-Projects\Diti AI\config\testing-registry.json`
- telegram configured: `true`

## Runtime Health

`diti-n8n.cmd --json server health` on April 14, 2026 currently returns:

```json
{
  "error": "Cannot connect to n8n health endpoint at http://localhost:5678/healthz. Is Docker up?",
  "type": "runtime_error"
}
```

## Workflow IDs Used By The Testing Registry

| Workflow | ID |
|---|---|
| P1-telegram-intake-v2 | `kqCxomzy3TWYSllH` |
| P1-telegram-router-v1 | `2Ckdfk7HHSRFnQoh` |
| P1-telegram-task-next-v1 | `pzYSe2gnvbXLedvG` |
| P1-telegram-task-waiting-v1 | `6d1fV8surkco100H` |
| P1-telegram-knowledge-draft-v1 | `Jm3AB26MzUlxauV6` |
| P1-telegram-calendar-query-v1 | `FLsNZCEhoqtwCbPG` |
| P1-error-handler-v1 | `ezKkyglJhrTwPi8n` |

## Local Test Infrastructure State

- parser source of truth: `n8n/api/command-parser.js`
- workflow generator source of truth: `n8n/scripts/generate-v2-workflows.js`
- webhook test path: `test-intake`
- test task sinks: `NEXT_TEST`, `WAITING_TEST`
- test vault sink: `obsidian-vault/00_INBOX_TEST/`

## Blocking Note

This snapshot is good enough for implementation and local parser testing, but not for live execution verification. Re-run `diti-n8n.cmd --json server health` and `diti-n8n.cmd --json workflow list --active` after the local n8n stack is restored.
