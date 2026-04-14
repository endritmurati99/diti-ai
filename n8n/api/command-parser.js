/**
 * Diti AI — Command Parser fuer n8n Code Node
 *
 * HINWEIS: Dies ist eine Referenz-Kopie. Der produktive Code lebt
 * inline im n8n Workflow JSON (P1-telegram-intake-v2.json).
 * Aenderungen hier muessen manuell in den Workflow uebertragen werden.
 *
 * Parst Telegram-Nachrichten im DSL-Format:
 *   t: Titel /due=2026-04-01 /prio=H /p=P1 /ctx=deepwork
 *   f: Follow-up /to=Person /due=2026-04-02
 *   k: Wissens-Titel /topic=Thema /src=link
 *   q: free 2026-04-18 /window=09:00-17:00
 *   w: workout run 45m rpe=7 /tags=intervals
 *   m: Meeting Titel /event=calendar
 *   h: sleep /note=schlecht | h: weigh=82.3 | h: nutrition kcal=2100
 *   j: Mein Tag war produktiv... (Journal-Eintrag -> Obsidian 60_REVIEWS/)
 *
 * Input: items[0].json.message.text (Telegram Message)
 * Output: { command, title, params, event_envelope }
 */

// --- ULID-Generator (simpel, ohne Dependency) ---
function generateULID() {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const TIME_LEN = 10;
  const RANDOM_LEN = 16;

  let now = Date.now();
  let timeStr = '';
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    timeStr = ENCODING[now % 32] + timeStr;
    now = Math.floor(now / 32);
  }

  let randomStr = '';
  for (let i = 0; i < RANDOM_LEN; i++) {
    randomStr += ENCODING[Math.floor(Math.random() * 32)];
  }

  return timeStr + randomStr;
}

// --- Command Parser ---
function parseCommand(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return { command: 'unknown', title: '', params: {}, raw: messageText || '' };
  }

  const text = messageText.trim();

  // Command erkennen: t:, f:, k:, q:, w:, m:, h:
  const commandMatch = text.match(/^([tfkqwmhj]):\s*(.*)/is);

  if (!commandMatch) {
    return { command: 'unknown', title: text, params: {}, raw: text };
  }

  const command = commandMatch[1].toLowerCase();
  let rest = commandMatch[2];

  // Parameter extrahieren: /key=value
  const params = {};
  const paramRegex = /\/(\w+)=([^\s/]+)/g;
  let match;
  while ((match = paramRegex.exec(rest)) !== null) {
    params[match[1]] = match[2];
  }

  // Parameter aus dem Rest-Text entfernen um den Titel zu erhalten
  const title = rest.replace(/\/\w+=[^\s/]+/g, '').trim();

  return { command, title, params, raw: text };
}

// --- Routing ---
function getRoutingDecision(command) {
  const routeMap = {
    t: 'google_tasks_next',
    f: 'google_tasks_waiting',
    k: 'obsidian_inbox',
    q: 'google_calendar_freebusy',
    w: 'notion_health_db',
    m: 'obsidian_inbox',
    h: 'notion_health_db',
    j: 'obsidian_reviews',
  };
  return routeMap[command] || 'unknown';
}

// --- Event-Envelope erzeugen ---
function createEventEnvelope(parsed, sourceId) {
  const eventTypeMap = {
    t: 'task.create',
    f: 'followup.create',
    k: 'knowledge.draft',
    q: 'calendar.query',
    w: 'workout.log',
    m: 'meeting.create',
    h: 'health.log',
    j: 'journal.create',
    unknown: 'unknown',
  };

  return {
    event_id: generateULID(),
    event_type: eventTypeMap[parsed.command] || 'unknown',
    source_system: 'telegram',
    source_id: String(sourceId || ''),
    timestamp: new Date().toISOString(),
    actor: 'user',
    payload: {
      command: parsed.command,
      title: parsed.title,
      ...parsed.params,
    },
    routing_decision: getRoutingDecision(parsed.command),
  };
}

// --- Module exports (fuer Tests) ---
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseCommand, getRoutingDecision, createEventEnvelope, generateULID };
}

// --- n8n Code Node Entry Point ---
// Diesen Block in den n8n Code Node kopieren
if (typeof items !== 'undefined') {
  const message = items[0].json.message || items[0].json;
  const messageText = message.text || '';
  const messageId = message.message_id || message.id || '';
  const chatId = message.chat?.id || message.from?.id || '';

  const parsed = parseCommand(messageText);
  const envelope = createEventEnvelope(parsed, 'msg_' + messageId);

  return [{
    json: {
      ...parsed,
      chat_id: chatId,
      message_id: messageId,
      event_envelope: envelope,
    }
  }];
}
