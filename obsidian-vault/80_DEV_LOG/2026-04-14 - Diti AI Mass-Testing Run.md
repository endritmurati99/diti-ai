# 2026-04-14 - Diti AI Mass-Testing Run

## Summary

Implemented the webhook-first batch testing architecture for Diti AI and the reusable CLI Anything n8n harness.

## What Changed

- Added schema-v2 testing registry with dedicated test sinks.
- Upgraded the intake generator to support:
  - Telegram ingress
  - `test-intake` webhook ingress
  - shared parser/normalizer contract
  - response transport split between Telegram and webhook
  - fail-closed write safety for test traffic
- Added reusable `n8nctl test preflight`, `corpus`, `batch-send`, `batch-collect`, and `batch-report`.
- Added a local parser stress runner at `n8n/scripts/test_parser.mjs`.

## Current Runtime Status

- `diti-n8n.cmd --json session status` resolves the expected Diti project context.
- `diti-n8n.cmd --json server health` is still failing against `http://localhost:5678/healthz`.
- Live proof stages and the main 10k run remain blocked until local n8n is restored.

## Decisions

- Telegram is reserved for tiny smoke tests only.
- All high-volume parser/router/load tests use the dedicated webhook transport.
- Cleanup stays manual; no Google Tasks delete automation was added to the harness.

## Next Step

Restore local n8n health, run `diti-n8n.cmd --json test preflight`, then execute the verification ladder from `docs/testing-runbook.md`.
