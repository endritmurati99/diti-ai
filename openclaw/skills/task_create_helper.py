import json
import sys
import os
from datetime import datetime
from urllib import error, request


def _read_input():
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        return {}, {}

    return input_data.get('args', {}), input_data.get('context', {})


def _build_payload(args, context):
    title = args.get("title")
    due = args.get("due", "")
    prio = args.get("prio", "M")

    source = {
        "channel": context.get("channel", "telegram"),
        "chat_id": str(context.get("sender_id", "")),
        "message_id": context.get(
            "message_id", "manual-" + datetime.now().strftime("%Y%m%d%H%M%S")
        ),
        "timestamp": datetime.now().isoformat(),
    }

    return {
        "intent": "task.create",
        "title": title,
        "params": {
            "due": due,
            "prio": prio,
            "project": "",
            "context": "",
        },
        "source": source,
    }


def _resolve_webhook_url():
    base_url = os.getenv("N8N_BASE_URL", "http://localhost:5678").rstrip("/")
    return os.getenv("DITI_WEBHOOK_URL") or f"{base_url}/webhook/task-create"


def main():
    args, context = _read_input()
    payload = _build_payload(args, context)
    webhook_url = _resolve_webhook_url()
    secret = os.getenv("DITI_WEBHOOK_SECRET")

    if not secret:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "missing_secret",
                    "message": "DITI_WEBHOOK_SECRET not set in environment.",
                }
            )
        )
        return

    request_body = json.dumps(payload).encode("utf-8")
    http_request = request.Request(
        webhook_url,
        data=request_body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {secret}",
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=10) as response:
            print(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="replace")
        try:
            print(json.dumps(json.loads(response_body)))
        except Exception:
            print(
                json.dumps(
                    {
                        "ok": False,
                        "error": "http_error",
                        "message": f"Webhook call failed: HTTP {exc.code}",
                        "status": exc.code,
                    }
                )
            )
    except error.URLError as exc:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "http_error",
                    "message": f"Webhook call failed: {exc.reason}",
                    "status": 500,
                }
            )
        )

if __name__ == "__main__":
    main()
