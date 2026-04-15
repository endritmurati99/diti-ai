# Testing Runbook

## Goal

Run small real Telegram smoke tests, then large webhook-based batch tests, while guaranteeing that test writes stay out of production targets.

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

## Preflight

Run these first:

```powershell
diti-n8n.cmd --json session status
diti-n8n.cmd --json server health
diti-n8n.cmd --json test preflight
```

If health fails, stop and restore the local n8n stack before live tests.

## Corpus Generation

```powershell
diti-n8n.cmd test corpus --out tmp/corpus.jsonl --count 10000 --seed 20260414
```

## Local Parser Stress Test

This does not touch Telegram or n8n:

```powershell
node n8n/scripts/test_parser.mjs --corpus tmp/corpus.jsonl --out tmp/parser-report.json
```

Require:

- zero crashes
- no unexpected parser failures for the generated corpus
- no write-safety violations

## Webhook Proof Stages

### Stage 1: 20-message webhook proof

```powershell
diti-n8n.cmd test batch-send --transport webhook --count 20 --sent-log tmp/webhook-20-sent.jsonl
diti-n8n.cmd test batch-collect --sent-log tmp/webhook-20-sent.jsonl --results tmp/webhook-20-results.jsonl --wait-for-idle 30
diti-n8n.cmd test batch-report --results tmp/webhook-20-results.jsonl --out tmp/webhook-20-report.md
```

Require:

- 100% request success
- 100% execution correlation
- expected workflow chains match

### Stage 2: 100-message mixed write-safety proof

```powershell
diti-n8n.cmd test batch-send --transport webhook --count 100 --sent-log tmp/webhook-100-sent.jsonl
diti-n8n.cmd test batch-collect --sent-log tmp/webhook-100-sent.jsonl --results tmp/webhook-100-results.jsonl --wait-for-idle 60
diti-n8n.cmd test batch-report --results tmp/webhook-100-results.jsonl --out tmp/webhook-100-report.md
```

Require:

- zero writes into production task lists
- zero notes in `00_INBOX/`
- zero Telegram side effects for webhook traffic

## Telegram Smoke

Use only a very small run:

```powershell
diti-n8n.cmd test batch-send --transport telegram --count 3 --sent-log tmp/telegram-smoke-sent.jsonl
diti-n8n.cmd test batch-collect --sent-log tmp/telegram-smoke-sent.jsonl --results tmp/telegram-smoke-results.jsonl --wait-for-idle 60
diti-n8n.cmd test batch-report --results tmp/telegram-smoke-results.jsonl --out tmp/telegram-smoke-report.md
```

## Main 10k Run

Only run this after the proof stages pass:

```powershell
diti-n8n.cmd test batch-send --transport webhook --corpus tmp/corpus.jsonl --sent-log tmp/sent.jsonl --concurrency 10
diti-n8n.cmd test batch-collect --sent-log tmp/sent.jsonl --results tmp/results.jsonl --wait-for-idle 180
diti-n8n.cmd test batch-report --results tmp/results.jsonl --out tmp/report.md
```

## Manual Cleanup

- delete test tasks from `NEXT_TEST`
- delete test tasks from `WAITING_TEST`
- remove files from `obsidian-vault/00_INBOX_TEST/`

Example:

```powershell
Remove-Item -LiteralPath ".\\obsidian-vault\\00_INBOX_TEST\\*" -Force
```

## Troubleshooting

- `server health` fails: start Docker / n8n before any live test.
- webhook sends fail: verify the `test-intake` path exists in the generated intake workflow and that the workflow is active in n8n.
- 429 from Telegram: use `--transport telegram` only for tiny smoke runs; retry handling is built into `batch-send`.
- correlation failures: inspect `source_id`, `run_id`, and `seq` propagation in intake and sub-workflows.
- write-safety failures: inspect `resolved_task_list`, `resolved_vault_path`, and `write_safety_error` in the intake execution.
