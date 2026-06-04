# 2026-04-15 - Diti AI OpenClaw VS1 Cutover

## Status Correction Added 2026-04-16

This note records a technical cutover attempt, not a `live_proven` OpenClaw cutover.

- `WH-task-create-v1` can be treated as `configured` / `activated`
- OpenClaw runtime checks and webhook checks can be treated as `synthetic_verified`
- the Telegram inbound OpenClaw path is not `live_proven`
- the claim that the legacy Telegram intake was off became stale on `2026-04-16`, when all 7 P1 workflows were reactivated
- because the same bot token must not be consumed in parallel, this log is historically useful but not sufficient as current truth

## Summary

OpenClaw VS1 backend preparation was completed to the point of `configured`, `activated`, and partial `synthetic_verified` status. A true OpenClaw cutover was not proven live.

## What I did

- Deactivated `P1-telegram-intake-v2` so the old Telegram consumer no longer competes for the bot token.
- Updated `WH-task-create-v1` live in place on `YazUYXlJeIMEDTEx`.
- Enabled n8n Header Auth on `/webhook/task-create` and kept the code-level Bearer check.
- Switched `openclaw/skills/task_create_helper.py` to stdlib-only `urllib`.
- Added the repo-local OpenClaw workspace files:
  - `openclaw/workspace/AGENTS.md`
  - `openclaw/workspace/SOUL.md`
  - `openclaw/workspace/TOOLS.md`
  - `openclaw/workspace/skills/task-create/SKILL.md`
- Restricted the OpenClaw exec bridge to the single `task-create-bridge.cmd` path.
- Created the missing Google Tasks `NEXT` list and wired the workflow to the real list ID.
- Corrected the Google Tasks due-date write path so dates land correctly.

## What worked technically

- OpenClaw started and validated cleanly at the time of this note.
- The Telegram gateway was reported healthy and allowlisted to chat `6526468834`.
- The exec allowlist contained only the VS1 bridge command.
- The webhook happy path worked.
- Unauthorized requests were rejected.
- Duplicate requests were rejected by the dedup store.
- The helper worked standalone and failed cleanly without `DITI_WEBHOOK_SECRET`.
- Google Tasks writes landed in the real `NEXT` list.

## What was still open

- The final manual Telegram E2E check from the allowlisted chat.
- We still needed to confirm:
  - natural-language task creation lands in `NEXT`
  - duplicate resend does not create a second task
  - empty request triggers clarification instead of a write

## Status Verdict

- `telegram->openclaw->wh-task-create-v1 = not_live_proven`
- `openclaw runtime and bridge setup = synthetic_verified`
- `WH-task-create-v1 technical availability = activated`
- `legacy telegram intake ownership state = superseded by 2026-04-16 reactivation`

The remaining missing proof is the real inbound Telegram check from the allowlisted chat with stored execution evidence.

## Provider follow-up

### What I tested

- Checked OpenClaw gateway health and Telegram connectivity.
- Checked OpenClaw model status and active provider resolution.
- Re-ran the n8n webhook happy path and duplicate protection.
- Re-ran the helper negative path without `DITI_WEBHOOK_SECRET`.

### Results

- Gateway health was green and Telegram was reported connected at the time of the check.
- OpenClaw still pointed to `openai/gpt-5.4` as the default model.
- The current OpenClaw auth state had no usable Gemini/Google provider configured.
- The repo-local `openclaw/.env` did not contain `GEMINI_API_KEY` or `GOOGLE_API_KEY`.
- The webhook path remained green:
  - happy path creates a task in `NEXT`
  - duplicate path returns `duplicate`
- The helper still returned `missing_secret` correctly when the secret was absent.

### Current blocker

Gemini is not blocked by workflow code right now. It is blocked by missing local Gemini credentials. Until a Gemini or Google API key is present, OpenClaw cannot be switched to Gemini for a real end-to-end provider test.

OpenClaw is also blocked from live certification until Telegram bot ownership is exclusive and the inbound Telegram path is separately proven.
