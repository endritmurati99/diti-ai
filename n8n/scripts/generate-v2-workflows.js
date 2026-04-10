#!/usr/bin/env node
// generate-v2-workflows.js
// Generates all 6 n8n workflow JSON files for P1-telegram-intake-v2
// Run: node n8n/scripts/generate-v2-workflows.js

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'workflows');

// ── Credential bindings (from live n8n) ──────────────────────
const TELEGRAM_CRED = {
  telegramApi: { id: 'Arepn5qW2Si65rVX', name: 'Telegram account' }
};
const GOOGLE_TASKS_CRED = {
  googleTasksOAuth2Api: { id: 's305fscwssjI56L7', name: 'Google Tasks account' }
};
const GOOGLE_CALENDAR_CRED = {
  googleCalendarOAuth2Api: { id: 'kF0UOYtJLVTJ0Mgf', name: 'Google Calendar account' }
};

const ADMIN_CHAT_ID = '6526468834';

// ═══════════════════════════════════════════════════════════
// 1. P1-error-handler-v1
// ═══════════════════════════════════════════════════════════
function buildErrorHandler() {
  const errorMsgCode = [
    "const input = items[0].json;",
    "const exec = input.execution || {};",
    "const wf = input.workflow || {};",
    "const err = exec.error || {};",
    "const workflow_name = wf.name || 'Unbekannt';",
    "const node_name = typeof err.node === 'object' ? (err.node.name || 'Unbekannt') : String(err.node || 'Unbekannt');",
    "const error_msg = String(err.message || 'Unbekannter Fehler').substring(0, 500);",
    "const exec_url = exec.url || '';",
    "const lines = [",
    "  '\\u{1F6A8} *Fehler in Workflow*',",
    "  '',",
    "  '*Workflow:* ' + workflow_name,",
    "  '*Node:* ' + node_name,",
    "  '*Fehler:* ' + error_msg",
    "];",
    "if (exec_url) lines.push('', exec_url);",
    "return [{ json: { message: lines.join('\\n'), chat_id: '" + ADMIN_CHAT_ID + "' } }];"
  ].join('\n');

  return {
    name: 'P1-error-handler-v1',
    nodes: [
      {
        parameters: {},
        id: 'error-trigger',
        name: 'Error Trigger',
        type: 'n8n-nodes-base.errorTrigger',
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: { jsCode: errorMsgCode },
        id: 'build-error-msg',
        name: 'Build Error Message',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [480, 300]
      },
      {
        parameters: {
          chatId: '={{ $json.chat_id }}',
          text: '={{ $json.message }}',
          additionalFields: { parse_mode: 'Markdown' }
        },
        id: 'send-admin-alert',
        name: 'Telegram: Admin Alert',
        type: 'n8n-nodes-base.telegram',
        typeVersion: 1.2,
        position: [720, 300],
        credentials: TELEGRAM_CRED
      }
    ],
    connections: {
      'Error Trigger': { main: [[{ node: 'Build Error Message', type: 'main', index: 0 }]] },
      'Build Error Message': { main: [[{ node: 'Telegram: Admin Alert', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' },
    tags: [{ name: 'diti-ai' }, { name: 'phase-1' }, { name: 'error-handling' }]
  };
}

// ═══════════════════════════════════════════════════════════
// 2. P1-telegram-task-next-v1
// ═══════════════════════════════════════════════════════════
function buildTaskNext() {
  const buildReplyCode = [
    "const ev = items[0].json;",
    "const title = ev.title || $('Sub-Workflow Trigger').first().json.title || '';",
    "const chat_id = $('Sub-Workflow Trigger').first().json.chat_id;",
    "return [{ json: {",
    "  chat_id: chat_id,",
    "  reply_text: '\\u2705 Task erstellt: ' + title,",
    "  reply_parse_mode: ''",
    "} }];"
  ].join('\n');

  return {
    name: 'P1-telegram-task-next-v1',
    nodes: [
      {
        parameters: {},
        id: 'sub-wf-trigger',
        name: 'Sub-Workflow Trigger',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'validate-parse-ok',
                leftValue: '={{ $json.parse_ok }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'true' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'validate-title',
        name: 'Validate',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [480, 300]
      },
      {
        parameters: {
          resource: 'task',
          operation: 'create',
          taskList: 'NEXT',
          title: '={{ $json.title }}',
          dueDate: '={{ $json.params.due || "" }}',
          notes: '={{ "Event: " + $json.event_id + "\\nProjekt: " + ($json.params.p || "-") + "\\nPrio: " + ($json.params.prio || "M") + "\\nKontext: " + ($json.params.ctx || "-") }}'
        },
        id: 'create-task-next',
        name: 'Google Tasks: NEXT',
        type: 'n8n-nodes-base.googleTasks',
        typeVersion: 1,
        position: [720, 200],
        credentials: GOOGLE_TASKS_CRED
      },
      {
        parameters: { jsCode: buildReplyCode },
        id: 'build-success-reply',
        name: 'Build Success Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [960, 200]
      },
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'a1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'a2', name: 'reply_text', value: '\u26A0\uFE0F Kein Titel angegeben. Beispiel: t: Rechnung senden', type: 'string' },
              { id: 'a3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'build-error-reply',
        name: 'Build Error Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [720, 440]
      }
    ],
    connections: {
      'Sub-Workflow Trigger': { main: [[{ node: 'Validate', type: 'main', index: 0 }]] },
      'Validate': {
        main: [
          [{ node: 'Google Tasks: NEXT', type: 'main', index: 0 }],
          [{ node: 'Build Error Reply', type: 'main', index: 0 }]
        ]
      },
      'Google Tasks: NEXT': { main: [[{ node: 'Build Success Reply', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' },
    tags: [{ name: 'diti-ai' }, { name: 'phase-1' }]
  };
}

// ═══════════════════════════════════════════════════════════
// 3. P1-telegram-task-waiting-v1
// ═══════════════════════════════════════════════════════════
function buildTaskWaiting() {
  const buildReplyCode = [
    "const ev = items[0].json;",
    "const title = ev.title || $('Sub-Workflow Trigger').first().json.title || '';",
    "const chat_id = $('Sub-Workflow Trigger').first().json.chat_id;",
    "return [{ json: {",
    "  chat_id: chat_id,",
    "  reply_text: '\\u23F3 Follow-up erstellt: ' + title,",
    "  reply_parse_mode: ''",
    "} }];"
  ].join('\n');

  return {
    name: 'P1-telegram-task-waiting-v1',
    nodes: [
      {
        parameters: {},
        id: 'sub-wf-trigger',
        name: 'Sub-Workflow Trigger',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'validate-parse-ok',
                leftValue: '={{ $json.parse_ok }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'true' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'validate-title',
        name: 'Validate',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [480, 300]
      },
      {
        parameters: {
          resource: 'task',
          operation: 'create',
          taskList: 'WAITING',
          title: '={{ "WAITING: " + $json.title }}',
          dueDate: '={{ $json.params.due || "" }}',
          notes: '={{ "Follow-up fuer: " + ($json.params.to || "-") + "\\nEvent: " + $json.event_id }}'
        },
        id: 'create-task-waiting',
        name: 'Google Tasks: WAITING',
        type: 'n8n-nodes-base.googleTasks',
        typeVersion: 1,
        position: [720, 200],
        credentials: GOOGLE_TASKS_CRED
      },
      {
        parameters: { jsCode: buildReplyCode },
        id: 'build-success-reply',
        name: 'Build Success Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [960, 200]
      },
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'a1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'a2', name: 'reply_text', value: '\u26A0\uFE0F Kein Titel angegeben. Beispiel: f: Antwort von Max', type: 'string' },
              { id: 'a3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'build-error-reply',
        name: 'Build Error Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [720, 440]
      }
    ],
    connections: {
      'Sub-Workflow Trigger': { main: [[{ node: 'Validate', type: 'main', index: 0 }]] },
      'Validate': {
        main: [
          [{ node: 'Google Tasks: WAITING', type: 'main', index: 0 }],
          [{ node: 'Build Error Reply', type: 'main', index: 0 }]
        ]
      },
      'Google Tasks: WAITING': { main: [[{ node: 'Build Success Reply', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' },
    tags: [{ name: 'diti-ai' }, { name: 'phase-1' }]
  };
}

// ═══════════════════════════════════════════════════════════
// 4. P1-telegram-knowledge-draft-v1
// ═══════════════════════════════════════════════════════════
function buildKnowledgeDraft() {
  const buildMarkdownCode = [
    "const item = items[0].json;",
    "const date = new Date().toISOString().split('T')[0];",
    "const title = item.title || 'Unbenannt';",
    "const safeName = title.replace(/[^a-zA-Z0-9\\u00E4\\u00F6\\u00FC\\u00C4\\u00D6\\u00DC\\u00DF\\s\\-_]/g, '');",
    "const filename = date + ' - ' + safeName.substring(0, 80) + '.md';",
    "",
    "const lines = [",
    "  '---',",
    "  'id: ' + item.event_id,",
    "  'date: ' + date,",
    "  'source: telegram',",
    "  'source_id: msg_' + item.message_id,",
    "  'topic: ' + (item.params.topic || ''),",
    "  'project_id: ' + (item.params.project || item.params.p || ''),",
    "  'status: draft',",
    "  'review_state: pending',",
    "  'tags:',",
    "  '  - knowledge',",
    "  '  - inbox',",
    "  '---',",
    "  '',",
    "  '# ' + title,",
    "  '',",
    "  '> [!info] Quelle',",
    "  '> ' + (item.params.src || 'telegram'),",
    "  '',",
    "  '## Notizen',",
    "  '',",
    "  '- ',",
    "  '',",
    "  '## Naechste Schritte',",
    "  '',",
    "  '- [ ] Review und finalisieren',",
    "  ''",
    "];",
    "const content = lines.join('\\n');",
    "",
    "return [{ json: {",
    "  filename: filename,",
    "  content: content,",
    "  filepath: '/data/obsidian-vault/00_INBOX/' + filename,",
    "  chat_id: item.chat_id,",
    "  title: item.title",
    "} }];"
  ].join('\n');

  return {
    name: 'P1-telegram-knowledge-draft-v1',
    nodes: [
      {
        parameters: {},
        id: 'sub-wf-trigger',
        name: 'Sub-Workflow Trigger',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'validate-parse-ok',
                leftValue: '={{ $json.parse_ok }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'true' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'validate-title',
        name: 'Validate',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [480, 300]
      },
      {
        parameters: { jsCode: buildMarkdownCode },
        id: 'build-markdown',
        name: 'Build Markdown',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [720, 200]
      },
      {
        parameters: {
          operation: 'write',
          fileName: '={{ $json.filepath }}',
          dataPropertyName: 'data'
        },
        id: 'write-obsidian',
        name: 'Write to Obsidian',
        type: 'n8n-nodes-base.readWriteFile',
        typeVersion: 1,
        position: [960, 200]
      },
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'a1', name: 'chat_id', value: '={{ $("Build Markdown").first().json.chat_id }}', type: 'number' },
              { id: 'a2', name: 'reply_text', value: '={{ "\\uD83D\\uDCDD Knowledge Draft erstellt: " + $("Build Markdown").first().json.title }}', type: 'string' },
              { id: 'a3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'build-success-reply',
        name: 'Build Success Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [1200, 200]
      },
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'a1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'a2', name: 'reply_text', value: '\u26A0\uFE0F Kein Titel. Beispiel: k: Idee f\u00FCr Telegram', type: 'string' },
              { id: 'a3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'build-error-reply',
        name: 'Build Error Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [720, 440]
      }
    ],
    connections: {
      'Sub-Workflow Trigger': { main: [[{ node: 'Validate', type: 'main', index: 0 }]] },
      'Validate': {
        main: [
          [{ node: 'Build Markdown', type: 'main', index: 0 }],
          [{ node: 'Build Error Reply', type: 'main', index: 0 }]
        ]
      },
      'Build Markdown': { main: [[{ node: 'Write to Obsidian', type: 'main', index: 0 }]] },
      'Write to Obsidian': { main: [[{ node: 'Build Success Reply', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' },
    tags: [{ name: 'diti-ai' }, { name: 'phase-1' }]
  };
}

// ═══════════════════════════════════════════════════════════
// 5. P1-telegram-calendar-query-v1
// ═══════════════════════════════════════════════════════════
function buildCalendarQuery() {
  const parseQueryCode = [
    "const item = items[0].json;",
    "const title = item.title || '';",
    "const dateMatch = title.match(/(\\d{4}-\\d{2}-\\d{2})/);",
    "const queryDate = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];",
    "const windowParam = item.params.window || '09:00-17:00';",
    "const parts = windowParam.split('-');",
    "const slotStart = parts[0] || '09:00';",
    "const slotEnd = parts[1] || '17:00';",
    "const tz = item.params.tz || 'Europe/Berlin';",
    "",
    "return [{ json: {",
    "  timeMin: queryDate + 'T' + slotStart + ':00',",
    "  timeMax: queryDate + 'T' + slotEnd + ':00',",
    "  timeZone: tz,",
    "  queryDate: queryDate,",
    "  slotStart: slotStart,",
    "  slotEnd: slotEnd,",
    "  chat_id: item.chat_id,",
    "  event_id: item.event_id",
    "} }];"
  ].join('\n');

  const formatReplyCode = [
    "const query = $('Parse Query Params').first().json;",
    "const events = items.map(i => i.json);",
    "const lines = ['\\uD83D\\uDCC5 Kalender ' + query.queryDate + ' (' + query.slotStart + '\\u2013' + query.slotEnd + ')'];",
    "lines.push('');",
    "",
    "if (events.length === 0 || (events.length === 1 && !events[0].summary)) {",
    "  lines.push('\\u2705 Keine Termine \\u2013 der Zeitraum ist frei.');",
    "} else {",
    "  lines.push('Termine:');",
    "  for (const ev of events) {",
    "    if (!ev.summary) continue;",
    "    const start = ev.start ? (ev.start.dateTime || ev.start.date || '?') : '?';",
    "    const end = ev.end ? (ev.end.dateTime || ev.end.date || '?') : '?';",
    "    const startTime = start.includes('T') ? start.split('T')[1].substring(0, 5) : start;",
    "    const endTime = end.includes('T') ? end.split('T')[1].substring(0, 5) : end;",
    "    lines.push('  \\u2022 ' + startTime + '\\u2013' + endTime + ' ' + ev.summary);",
    "  }",
    "}",
    "",
    "return [{ json: {",
    "  chat_id: query.chat_id,",
    "  reply_text: lines.join('\\n'),",
    "  reply_parse_mode: ''",
    "} }];"
  ].join('\n');

  return {
    name: 'P1-telegram-calendar-query-v1',
    nodes: [
      {
        parameters: {},
        id: 'sub-wf-trigger',
        name: 'Sub-Workflow Trigger',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: { jsCode: parseQueryCode },
        id: 'parse-query',
        name: 'Parse Query Params',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [480, 300]
      },
      {
        parameters: {
          resource: 'event',
          operation: 'getAll',
          calendar: {
            __rl: true,
            value: 'primary',
            mode: 'id'
          },
          returnAll: true,
          options: {
            timeMin: '={{ $json.timeMin }}',
            timeMax: '={{ $json.timeMax }}',
            singleEvents: true,
            orderBy: 'startTime'
          }
        },
        id: 'get-calendar-events',
        name: 'Google Calendar: Events',
        type: 'n8n-nodes-base.googleCalendar',
        typeVersion: 1,
        position: [720, 300],
        credentials: GOOGLE_CALENDAR_CRED
      },
      {
        parameters: { jsCode: formatReplyCode },
        id: 'format-reply',
        name: 'Format Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [960, 300]
      }
    ],
    connections: {
      'Sub-Workflow Trigger': { main: [[{ node: 'Parse Query Params', type: 'main', index: 0 }]] },
      'Parse Query Params': { main: [[{ node: 'Google Calendar: Events', type: 'main', index: 0 }]] },
      'Google Calendar: Events': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' },
    tags: [{ name: 'diti-ai' }, { name: 'phase-1' }]
  };
}

// ═══════════════════════════════════════════════════════════
// 6. P1-telegram-intake-v2
// ═══════════════════════════════════════════════════════════
function buildIntakeV2() {
  const normalizeEventCode = [
    "function generateULID() {",
    "  const E = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';",
    "  let now = Date.now(), t = '';",
    "  for (let i = 9; i >= 0; i--) { t = E[now % 32] + t; now = Math.floor(now / 32); }",
    "  let r = '';",
    "  for (let i = 0; i < 16; i++) r += E[Math.floor(Math.random() * 32)];",
    "  return t + r;",
    "}",
    "",
    "const msg = items[0].json.message || items[0].json;",
    "const text = msg.text || '';",
    "const msgId = msg.message_id || 0;",
    "const chatId = msg.chat ? msg.chat.id : 0;",
    "",
    "const event = {",
    "  event_id: generateULID(),",
    "  source_system: 'telegram',",
    "  source_id: 'tg_' + chatId + '_' + msgId,",
    "  chat_id: typeof chatId === 'number' ? chatId : Number(chatId),",
    "  message_id: msgId,",
    "  received_at: new Date().toISOString(),",
    "  raw_text: text,",
    "  command: 'unknown',",
    "  entity_type: '',",
    "  target_system: '',",
    "  title: '',",
    "  params: {},",
    "  parse_ok: false,",
    "  parse_error: ''",
    "};",
    "",
    "if (!text) {",
    "  event.parse_error = 'non_text_message';",
    "  return [{ json: event }];",
    "}",
    "",
    "const trimmed = text.trim();",
    "",
    "if (trimmed === '/help') {",
    "  event.command = 'help';",
    "  event.parse_ok = true;",
    "  return [{ json: event }];",
    "}",
    "if (trimmed === '/ping') {",
    "  event.command = 'ping';",
    "  event.parse_ok = true;",
    "  return [{ json: event }];",
    "}",
    "",
    "const prefixMatch = trimmed.match(/^([tfkq]):\\s*(.*)/is);",
    "if (!prefixMatch) {",
    "  event.command = 'unknown';",
    "  event.parse_error = 'unknown_prefix';",
    "  return [{ json: event }];",
    "}",
    "",
    "const prefixMap = { t: 'task', f: 'followup', k: 'knowledge', q: 'calendar_query' };",
    "const entityMap = { t: 'task.create', f: 'followup.create', k: 'knowledge.draft', q: 'calendar.query' };",
    "const targetMap = { t: 'google_tasks', f: 'google_tasks', k: 'obsidian', q: 'google_calendar' };",
    "",
    "const prefix = prefixMatch[1].toLowerCase();",
    "event.command = prefixMap[prefix];",
    "event.entity_type = entityMap[prefix];",
    "event.target_system = targetMap[prefix];",
    "",
    "let rest = prefixMatch[2] || '';",
    "const params = {};",
    "const paramRe = /\\/(\\w+)=([^\\s\\/]+)/g;",
    "let match;",
    "while ((match = paramRe.exec(rest)) !== null) { params[match[1]] = match[2]; }",
    "event.params = params;",
    "",
    "const title = rest.replace(/\\/\\w+=[^\\s\\/]+/g, '').trim();",
    "event.title = title;",
    "",
    "if (!title && prefix !== 'q') {",
    "  event.parse_error = 'empty_title';",
    "} else {",
    "  event.parse_ok = true;",
    "}",
    "",
    "return [{ json: event }];"
  ].join('\n');

  const helpText = [
    '\\uD83D\\uDCCB *Diti AI Commands*',
    '',
    '`t: <Titel>` \\u2192 Task in NEXT erstellen',
    '  `/due=YYYY-MM-DD` `/p=<Projekt>` `/prio=H|M|L`',
    '',
    '`f: <Titel>` \\u2192 Follow-up in WAITING',
    '  `/due=YYYY-MM-DD` `/to=<Person>`',
    '',
    '`k: <Titel>` \\u2192 Knowledge Draft in Obsidian',
    '  `/topic=<Thema>` `/p=<Projekt>`',
    '',
    '`q: free YYYY-MM-DD` \\u2192 Kalender-Abfrage',
    '  `/window=09:00-17:00` `/tz=Europe/Berlin`',
    '',
    '`/ping` \\u2192 Statuscheck',
    '`/help` \\u2192 Diese Hilfe'
  ].join('\\n');

  return {
    name: 'P1-telegram-intake-v2',
    nodes: [
      // 1. Telegram Trigger
      {
        parameters: { updates: ['message'] },
        id: 'telegram-trigger',
        name: 'Telegram Trigger',
        type: 'n8n-nodes-base.telegramTrigger',
        typeVersion: 1.1,
        position: [200, 500],
        credentials: TELEGRAM_CRED
      },
      // 2. Normalize Event
      {
        parameters: { jsCode: normalizeEventCode },
        id: 'normalize-event',
        name: 'Normalize Event',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [420, 500]
      },
      // 3. Allowlist Check
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'chat-id-check',
                leftValue: '={{ String($json.chat_id) }}',
                rightValue: ADMIN_CHAT_ID,
                operator: { type: 'string', operation: 'equals' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'allowlist-check',
        name: 'Allowlist Check',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [640, 500]
      },
      // 4. Reply: Nicht autorisiert
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'r1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'r2', name: 'reply_text', value: '\uD83D\uDD12 Nicht autorisierter Chat.', type: 'string' },
              { id: 'r3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'reply-nicht-autorisiert',
        name: 'Reply: Nicht autorisiert',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [860, 700]
      },
      // 5. Text Guard
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'text-check',
                leftValue: '={{ $json.raw_text }}',
                rightValue: '',
                operator: { type: 'string', operation: 'isNotEmpty' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'text-guard',
        name: 'Text Guard',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [860, 500]
      },
      // 6. Reply: Nur Text-Commands
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'r1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'r2', name: 'reply_text', value: '\uD83D\uDCF5 Nur Text-Commands werden verarbeitet. Nutze /help f\u00FCr die Command-\u00DCbersicht.', type: 'string' },
              { id: 'r3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'reply-nur-text',
        name: 'Reply: Nur Text-Commands',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [1080, 700]
      },
      // 7. Remove Duplicates
      {
        parameters: {
          operation: 'removeItemsSeenInPreviousExecutions',
          value: '={{ $json.source_id }}',
          options: { maxEntries: 1000 }
        },
        id: 'remove-duplicates',
        name: 'Remove Duplicates',
        type: 'n8n-nodes-base.removeDuplicates',
        typeVersion: 1,
        position: [1080, 500]
      },
      // 8. Switch on command
      {
        parameters: {
          dataType: 'string',
          value1: '={{ $json.command }}',
          rules: {
            rules: [
              { value2: 'task', output: 0 },
              { value2: 'followup', output: 1 },
              { value2: 'knowledge', output: 2 },
              { value2: 'calendar_query', output: 3 },
              { value2: 'help', output: 4 },
              { value2: 'ping', output: 5 }
            ]
          },
          fallbackOutput: 6
        },
        id: 'command-switch',
        name: 'Route Command',
        type: 'n8n-nodes-base.switch',
        typeVersion: 1,
        position: [1300, 500]
      },
      // 9-12. Execute Sub-Workflows (IDs set to __PENDING__, patched after import)
      {
        parameters: {
          source: 'database',
          workflowId: '__PENDING_TASK_NEXT__'
        },
        id: 'exec-task-next',
        name: 'Execute: task-next',
        type: 'n8n-nodes-base.executeWorkflow',
        typeVersion: 1,
        position: [1560, 100]
      },
      {
        parameters: {
          source: 'database',
          workflowId: '__PENDING_TASK_WAITING__'
        },
        id: 'exec-task-waiting',
        name: 'Execute: task-waiting',
        type: 'n8n-nodes-base.executeWorkflow',
        typeVersion: 1,
        position: [1560, 280]
      },
      {
        parameters: {
          source: 'database',
          workflowId: '__PENDING_KNOWLEDGE__'
        },
        id: 'exec-knowledge',
        name: 'Execute: knowledge-draft',
        type: 'n8n-nodes-base.executeWorkflow',
        typeVersion: 1,
        position: [1560, 460]
      },
      {
        parameters: {
          source: 'database',
          workflowId: '__PENDING_CALENDAR__'
        },
        id: 'exec-calendar',
        name: 'Execute: calendar-query',
        type: 'n8n-nodes-base.executeWorkflow',
        typeVersion: 1,
        position: [1560, 640]
      },
      // 13. Help Reply
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'h1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'h2', name: 'reply_text', value: helpText, type: 'string' },
              { id: 'h3', name: 'reply_parse_mode', value: 'Markdown', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'help-reply',
        name: 'Help Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [1560, 820]
      },
      // 14. Ping Reply
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'p1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'p2', name: 'reply_text', value: 'ok', type: 'string' },
              { id: 'p3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'ping-reply',
        name: 'Ping Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [1560, 980]
      },
      // 15. Fallback Reply
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'f1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'f2', name: 'reply_text', value: '\u2753 Unbekannter Befehl. Nutze /help f\u00FCr die Command-\u00DCbersicht.', type: 'string' },
              { id: 'f3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'fallback-reply',
        name: 'Fallback Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [1560, 1140]
      },
      // 16. Telegram Reply
      {
        parameters: {
          chatId: '={{ $json.chat_id }}',
          text: '={{ $json.reply_text }}',
          additionalFields: {}
        },
        id: 'telegram-reply',
        name: 'Telegram Reply',
        type: 'n8n-nodes-base.telegram',
        typeVersion: 1.2,
        position: [1820, 500],
        credentials: TELEGRAM_CRED
      }
    ],
    connections: {
      'Telegram Trigger': { main: [[{ node: 'Normalize Event', type: 'main', index: 0 }]] },
      'Normalize Event': { main: [[{ node: 'Allowlist Check', type: 'main', index: 0 }]] },
      'Allowlist Check': {
        main: [
          [{ node: 'Text Guard', type: 'main', index: 0 }],
          [{ node: 'Reply: Nicht autorisiert', type: 'main', index: 0 }]
        ]
      },
      'Reply: Nicht autorisiert': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] },
      'Text Guard': {
        main: [
          [{ node: 'Remove Duplicates', type: 'main', index: 0 }],
          [{ node: 'Reply: Nur Text-Commands', type: 'main', index: 0 }]
        ]
      },
      'Reply: Nur Text-Commands': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] },
      'Remove Duplicates': { main: [[{ node: 'Route Command', type: 'main', index: 0 }]] },
      'Route Command': {
        main: [
          [{ node: 'Execute: task-next', type: 'main', index: 0 }],
          [{ node: 'Execute: task-waiting', type: 'main', index: 0 }],
          [{ node: 'Execute: knowledge-draft', type: 'main', index: 0 }],
          [{ node: 'Execute: calendar-query', type: 'main', index: 0 }],
          [{ node: 'Help Reply', type: 'main', index: 0 }],
          [{ node: 'Ping Reply', type: 'main', index: 0 }],
          [{ node: 'Fallback Reply', type: 'main', index: 0 }]
        ]
      },
      'Execute: task-next': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] },
      'Execute: task-waiting': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] },
      'Execute: knowledge-draft': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] },
      'Execute: calendar-query': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] },
      'Help Reply': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] },
      'Ping Reply': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] },
      'Fallback Reply': { main: [[{ node: 'Telegram Reply', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' },
    tags: [{ name: 'diti-ai' }, { name: 'phase-1' }, { name: 'intake-v2' }]
  };
}

// ═══════════════════════════════════════════════════════════
// Generate all workflow JSON files
// ═══════════════════════════════════════════════════════════
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const workflows = [
  ['P1-error-handler-v1.json', buildErrorHandler()],
  ['P1-telegram-task-next-v1.json', buildTaskNext()],
  ['P1-telegram-task-waiting-v1.json', buildTaskWaiting()],
  ['P1-telegram-knowledge-draft-v1.json', buildKnowledgeDraft()],
  ['P1-telegram-calendar-query-v1.json', buildCalendarQuery()],
  ['P1-telegram-intake-v2.json', buildIntakeV2()]
];

for (const [filename, wf] of workflows) {
  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(wf, null, 2) + '\n');
  console.log('Created: ' + outPath);
}

console.log('\nAll 6 workflows generated successfully.');
