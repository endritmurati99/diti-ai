# 2026-04-15 - Diti AI OpenClaw VS1 Cutover

## Summary

OpenClaw VS1 is cut over. The legacy Telegram intake is off, the task-create webhook workflow is hardened in place, and the OpenClaw bridge is restricted to the single task-create path.

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

## What works now

- OpenClaw starts and validates cleanly.
- The Telegram gateway is healthy and allowlisted to chat `6526468834`.
- The exec allowlist contains only the VS1 bridge command.
- The webhook happy path works.
- Unauthorized requests are rejected.
- Duplicate requests are rejected by the dedup store.
- The helper works standalone and fails cleanly without `DITI_WEBHOOK_SECRET`.
- Google Tasks writes now land in the real `NEXT` list.

## What is still open

- The final manual Telegram E2E check from the allowlisted chat.
- We still need to confirm:
  - natural-language task creation lands in `NEXT`
  - duplicate resend does not create a second task
  - empty request triggers clarification instead of a write

## Short verdict

The backend slice is ready for live Telegram testing. The only remaining step is the real user-facing inbound check from `6526468834`.

## Provider follow-up

### What I tested

- Checked OpenClaw gateway health and Telegram connectivity.
- Checked OpenClaw model status and active provider resolution.
- Re-ran the n8n webhook happy path and duplicate protection.
- Re-ran the helper negative path without `DITI_WEBHOOK_SECRET`.

### Results

- Gateway health is still green and Telegram is connected.
- OpenClaw still points to `openai/gpt-5.4` as the default model.
- The current OpenClaw auth state has no usable Gemini/Google provider configured.
- The repo-local `openclaw/.env` also does not currently contain `GEMINI_API_KEY` or `GOOGLE_API_KEY`.
- The webhook path is still green:
  - happy path creates a task in `NEXT`
  - duplicate path returns `duplicate`
- The helper still returns `missing_secret` correctly when the secret is absent.

### Current blocker

Gemini is not blocked by workflow code right now. It is blocked by missing local Gemini credentials. Until a Gemini or Google API key is present, OpenClaw cannot be switched to Gemini for a real end-to-end provider test.
