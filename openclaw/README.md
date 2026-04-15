# OpenClaw VS1 Runbook

This runbook is for the VS1-only Telegram cutover.

## Scope

OpenClaw handles only one intent in VS1:

- `task.create`

It may ask for a missing task title, call the local bridge helper, and return the n8n result. It must not browse, use filesystem tools, or run general shell commands.

## 1. Environment

1. Copy `openclaw/.env.example` to `openclaw/.env` and fill the secrets.
2. Make sure these keys exist:
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `DITI_WEBHOOK_SECRET`
   - `N8N_BASE_URL`
   - optional `DITI_WEBHOOK_URL`
3. Load the env file into the shell before configuring OpenClaw.

PowerShell:

```powershell
Get-Content openclaw\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $name, $value = $_ -split '=', 2
  $value = $value.Trim().Trim('"')
  Set-Item -Path "Env:$name" -Value $value
}
```

## 2. Workspace

Use the repo-local workspace:

```powershell
openclaw setup --workspace "C:\Users\endri\Desktop\Claude-Projects\Diti AI\openclaw\workspace" --mode local
```

If OpenClaw was already configured before, make sure the active config keeps:

- `agents.defaults.workspace = C:\Users\endri\Desktop\Claude-Projects\Diti AI\openclaw\workspace`
- `gateway.mode = local`
- `gateway.bind = loopback`

## 3. Telegram Cutover

Deactivate `P1-telegram-intake-v2` in n8n before enabling OpenClaw for the same bot token.

Configure Telegram:

```powershell
openclaw config set channels.telegram.enabled true --strict-json
openclaw config set channels.telegram.botToken --ref-provider default --ref-source env --ref-id TELEGRAM_BOT_TOKEN
openclaw config set channels.telegram.dmPolicy '"allowlist"' --strict-json
openclaw config set channels.telegram.allowFrom '[6526468834]' --strict-json
```

## 4. Security

VS1 runs with a minimal tool surface:

- browser disabled
- no broad shell access
- no general filesystem tools
- only the exact task-create bridge command may run

Recommended checks:

```powershell
openclaw config get agents.defaults.workspace
openclaw config get channels.telegram.enabled
openclaw config get channels.telegram.dmPolicy
openclaw config get channels.telegram.allowFrom
openclaw config get browser.enabled
openclaw config validate
```

## 5. Gateway

Start or restart the gateway after config changes:

```powershell
openclaw gateway run
```

In another shell:

```powershell
openclaw status
openclaw channels status
```

## 6. Manual Checks

Backend-only webhook check:

```powershell
$headers = @{
  Authorization = "Bearer $env:DITI_WEBHOOK_SECRET"
  "Content-Type" = "application/json"
}
$body = @{
  intent = "task.create"
  title = "VS1 Smoke Task"
  params = @{ due = "2026-04-20"; prio = "M"; project = ""; context = "" }
  source = @{ channel = "smoke"; chat_id = "6526468834"; message_id = "smoke-001"; timestamp = "2026-04-15T00:00:00Z" }
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "http://localhost:5678/webhook/task-create" -Headers $headers -Body $body
```

Bridge helper check:

```powershell
'{"args":{"title":"Bridge Smoke","due":"2026-04-20","prio":"M"},"context":{"channel":"telegram","sender_id":"6526468834","message_id":"bridge-001"}}' | py -3 openclaw\skills\task_create_helper.py
```

Bridge command check:

```powershell
'{"args":{"title":"Bridge Wrapper Smoke","due":"2026-04-20","prio":"M"},"context":{"channel":"telegram","sender_id":"6526468834","message_id":"bridge-002"}}' | .\openclaw\task-create-bridge.cmd
```
