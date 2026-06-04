# Testing Runbook

## Goal

Operate Diti AI with evidence-based verification. Technical readiness, synthetic proof, and real live proof are different states and must not be conflated.

## Status Model

Use only these labels in docs and run notes:

- `configured`
- `activated`
- `synthetic_verified`
- `live_proven`

Interpretation:

- `configured` means credentials and configuration are present
- `activated` means a workflow or consumer is technically active
- `synthetic_verified` means webhook or harness behavior is proven through controlled test inputs
- `live_proven` means a real Telegram end-to-end run is proven with saved execution evidence and the expected side effect

Never use `activated` as a synonym for `live`, `tested`, `working`, or `cut over`.

## Source Of Truth

- Registry: [config/testing-registry.json](../config/testing-registry.json)
- Workflow generator: [n8n/scripts/generate-v2-workflows.js](../n8n/scripts/generate-v2-workflows.js)
- Parser source: [n8n/api/command-parser.js](../n8n/api/command-parser.js)

## Safety Model

- Telegram is smoke-only.
- Bulk runs use the `test-intake` webhook.
- Test writes may target only:
  - `NEXT_TEST`
  - `WAITING_TEST`
  - `obsidian-vault/00_INBOX_TEST/`
- If a test write resolves to a production sink, the intake should block it with a write-safety error.

## Live Gates

Before any live ladder starts, document all of these gates:

- `Save successful production executions = On`
- `single bot owner confirmed`
- `active ingress documented`
- `test_run routing proven`
- absolute timestamp with timezone

If one gate is missing, stop. Do not start a live run.

## Synthetic Verification

Synthetic verification proves routing and safety without claiming live behavior.

### Preflight

Run these first:

```powershell
diti-n8n.cmd --json session status
diti-n8n.cmd --json server health
diti-n8n.cmd --json test preflight
```

If health fails, stop and restore the local n8n stack before live tests.

### Corpus Generation

```powershell
diti-n8n.cmd test corpus --out tmp/corpus.jsonl --count 10000 --seed 20260414
```

### Local Parser Stress Test

This does not touch Telegram or n8n:

```powershell
node n8n/scripts/test_parser.mjs --corpus tmp/corpus.jsonl --out tmp/parser-report.json
```

Require:

- zero crashes
- no unexpected parser failures for the generated corpus
- no write-safety violations

### Webhook Proof Stages

#### Stage 1: 20-message webhook proof

```powershell
diti-n8n.cmd test batch-send --transport webhook --count 20 --sent-log tmp/webhook-20-sent.jsonl
diti-n8n.cmd test batch-collect --sent-log tmp/webhook-20-sent.jsonl --results tmp/webhook-20-results.jsonl --wait-for-idle 30
diti-n8n.cmd test batch-report --results tmp/webhook-20-results.jsonl --out tmp/webhook-20-report.md
```

Require:

- 100% request success
- 100% execution correlation
- expected workflow chains match

#### Stage 2: 100-message mixed write-safety proof

```powershell
diti-n8n.cmd test batch-send --transport webhook --count 100 --sent-log tmp/webhook-100-sent.jsonl
diti-n8n.cmd test batch-collect --sent-log tmp/webhook-100-sent.jsonl --results tmp/webhook-100-results.jsonl --wait-for-idle 60
diti-n8n.cmd test batch-report --results tmp/webhook-100-results.jsonl --out tmp/webhook-100-report.md
```

Require:

- zero writes into production task lists
- zero notes in `00_INBOX/`
- zero Telegram side effects for webhook traffic

### Telegram Smoke

Use only a very small run:

```powershell
diti-n8n.cmd test batch-send --transport telegram --count 3 --sent-log tmp/telegram-smoke-sent.jsonl
diti-n8n.cmd test batch-collect --sent-log tmp/telegram-smoke-sent.jsonl --results tmp/telegram-smoke-results.jsonl --wait-for-idle 60
diti-n8n.cmd test batch-report --results tmp/telegram-smoke-results.jsonl --out tmp/telegram-smoke-report.md
```

### Main 10k Run

Only run this after the proof stages pass:

```powershell
diti-n8n.cmd test batch-send --transport webhook --corpus tmp/corpus.jsonl --sent-log tmp/sent.jsonl --concurrency 10
diti-n8n.cmd test batch-collect --sent-log tmp/sent.jsonl --results tmp/results.jsonl --wait-for-idle 180
diti-n8n.cmd test batch-report --results tmp/results.jsonl --out tmp/report.md
```

### Synthetic Cleanup

- delete test tasks from `NEXT_TEST`
- delete test tasks from `WAITING_TEST`
- remove files from `obsidian-vault/00_INBOX_TEST/`

Example:

```powershell
Remove-Item -LiteralPath ".\\obsidian-vault\\00_INBOX_TEST\\*" -Force
```

Synthetic verdicts may be recorded as `synthetic_verified`, but never as `live_proven`.

## test_run Routing Proof

Do not use `test_run` in live ladders until synthetic proof exists for each relevant path:

- `t:` writes only to `NEXT_TEST`
- `f:` writes only to `WAITING_TEST`
- `k:` writes only to `obsidian-vault/00_INBOX_TEST/`
- `q:` produces no production write
- negative paths produce no write

Record the proof result per path. If a path is not proven, it is not eligible for live verification.

## Live Verification

Live verification is performed only after the gates and `test_run` routing proof pass.

### Evidence Standard

Record this for every live run:

- exact test text
- start time with timezone
- active ingress path
- n8n workflow name
- n8n execution ID
- Telegram reply yes/no
- observed side effect
- cleanup status
- final verdict per path and use case

Example verdicts:

- `telegram->n8n->ping = live_proven`
- `telegram->n8n->task_next_test = live_proven`
- `telegram->n8n->task_next_negative = live_proven`
- `telegram->n8n->waiting_test = not_run`
- `telegram->openclaw->wh-task-create-v1 = not_live_proven`

### Abort Rules

Abort the ladder immediately after any failed step:

- no Telegram reply within the defined observation window
- no matching saved success execution
- wrong workflow or wrong workflow chain
- write in a production sink instead of the expected test sink
- missing correlation between test text, execution, and artifact
- unclear Telegram bot owner or suspected parallel consumer

Do not continue the ladder after an abort. Investigate the cause first.

### Phase 0: Truth Baseline

- enable and verify `Save successful production executions = On`
- confirm a single Telegram consumer owns the bot token
- document the active ingress for the run
- prove `test_run` routing synthetically for each relevant workflow
- treat OpenClaw as `not_live_proven` until separately verified

### Phase 1: Intake Proof

Run the smallest live ladder first:

```text
/ping
t: Live NEXT smoke /due=2026-04-18 /test_run=live-2026-04-16-a
t: /test_run=live-2026-04-16-e
```

Success criteria:

- `/ping`
  Telegram reply present, saved success execution present, intake-only path, no write
- `t:` write case
  Telegram reply present, saved success execution present, expected workflow chain, write only to `NEXT_TEST`
- negative `t:` case
  clarification reply present, saved success execution present, no write

Only continue to Phase 2 if all three runs are `live_proven`.

### Phase 2: Domain Proofs

Run these paths one by one and record separate verdicts:

```text
f: Live WAITING smoke /to=Max /due=2026-04-19 /test_run=live-2026-04-16-b
k: Live KNOWLEDGE smoke /topic=test /test_run=live-2026-04-16-c
q: Live CALENDAR smoke morgen 09:00-10:00 /tz=Europe/Berlin /test_run=live-2026-04-16-d
```

Success criteria:

- `f:` writes only to `WAITING_TEST`
- `k:` writes only to `obsidian-vault/00_INBOX_TEST/`
- `q:` returns a Telegram reply, stores a saved success execution, and performs no production write

### Phase 3: OpenClaw Verification

Verify OpenClaw only after the n8n Telegram ladder is proven.

Preconditions:

- `P1-telegram-intake-v2` deactivated
- OpenClaw is the only Telegram owner
- OpenClaw gateway reachable
- Telegram connected in OpenClaw
- required secrets resolved in the runtime path
- `WH-task-create-v1` activated

Then verify `Telegram -> OpenClaw -> WH-task-create-v1` as a separate path with its own verdict.

## Troubleshooting

- `server health` fails: start Docker / n8n before any live test.
- webhook sends fail: verify the `test-intake` path exists in the generated intake workflow and that the workflow is active in n8n.
- 429 from Telegram: use `--transport telegram` only for tiny smoke runs; retry handling is built into `batch-send`.
- correlation failures: inspect `source_id`, `run_id`, and `seq` propagation in intake and sub-workflows.
- write-safety failures: inspect `resolved_task_list`, `resolved_vault_path`, and `write_safety_error` in the intake execution.
