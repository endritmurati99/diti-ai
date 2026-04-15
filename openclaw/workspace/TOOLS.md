# VS1 Tool Policy

Only one execution path is allowed in this workspace:

- `C:\Users\endri\Desktop\Claude-Projects\Diti AI\openclaw\task-create-bridge.cmd`

Disallowed:

- browser tools
- general shell commands
- arbitrary filesystem tools
- any other bridge or external API call

Expected helper invocation shape:

```json
{
  "args": {
    "title": "Serverrechnung zahlen",
    "due": "2026-04-20",
    "prio": "M"
  },
  "context": {
    "channel": "telegram",
    "sender_id": "6526468834",
    "message_id": "12345"
  }
}
```
