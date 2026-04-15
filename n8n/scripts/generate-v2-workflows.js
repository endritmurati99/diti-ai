#!/usr/bin/env node
// generate-v2-workflows.js
// Generates all 6 n8n workflow JSON files for P1-telegram-intake-v2
// Run: node n8n/scripts/generate-v2-workflows.js

const fs = require('fs');
const path = require('path');
const parserCore = require('../api/command-parser.js');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'workflows');
const TESTING_REGISTRY_PATH = path.resolve(__dirname, '..', '..', 'config', 'testing-registry.json');

function loadTestingRegistry() {
  try {
    return JSON.parse(fs.readFileSync(TESTING_REGISTRY_PATH, 'utf8'));
  } catch (error) {
    return null;
  }
}

const testingRegistry = loadTestingRegistry();

function resolveWorkflowId(name, fallback) {
  const required = Array.isArray(testingRegistry && testingRegistry.required_workflows)
    ? testingRegistry.required_workflows
    : [];
  const match = required.find((workflow) => workflow && workflow.name === name && workflow.id);
  return match ? String(match.id) : fallback;
}

const TEST_TASK_LISTS = {
  next: String(testingRegistry?.test_targets?.task_lists?.next || 'NEXT_TEST'),
  waiting: String(testingRegistry?.test_targets?.task_lists?.waiting || 'WAITING_TEST'),
};
const TEST_CALENDAR_ID = String(testingRegistry?.test_calendar || 'primary');

const SUBWORKFLOW_IDS = {
  taskNext: resolveWorkflowId('P1-telegram-task-next-v1', '__PENDING_TASK_NEXT__'),
  taskWaiting: resolveWorkflowId('P1-telegram-task-waiting-v1', '__PENDING_TASK_WAITING__'),
  knowledgeDraft: resolveWorkflowId('P1-telegram-knowledge-draft-v1', '__PENDING_KNOWLEDGE__'),
  calendarQuery: resolveWorkflowId('P1-telegram-calendar-query-v1', '__PENDING_CALENDAR__')
};

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
const OPENAI_CRED = {
  openAiApi: { id: 'jMxe7lxLFE2XMIFZ', name: 'OpenAi account' }
};

const ADMIN_CHAT_ID = '6526468834';

function buildReplyEnvelopeCode(replyTextExpression, extraLines = []) {
  return [
    "const current = items[0].json || {};",
    "const upstream = $('Sub-Workflow Trigger').first().json || {};",
    "const event = { ...upstream, ...current };",
    "const source = event.source || event.source_system || 'telegram';",
    "return [{ json: {",
    "  chat_id: Number.isFinite(Number(event.chat_id)) ? Number(event.chat_id) : 0,",
    `  reply_text: ${replyTextExpression},`,
    "  reply_parse_mode: '',",
    "  source: source,",
    "  source_system: event.source_system || source,",
    "  source_id: event.source_id || '',",
    "  is_test: Boolean(event.is_test),",
    "  run_id: event.run_id || null,",
    "  seq: event.seq || null,",
    "  expected_route: event.expected_route || '',",
    "  expected_chain: Array.isArray(event.expected_chain) ? event.expected_chain : [],",
    "  parse_error: event.parse_error || '',",
    "  write_safety_error: event.write_safety_error || '',",
    "  reply_transport: event.reply_transport || (source === 'telegram' ? 'telegram' : 'webhook'),",
    "  should_telegram_reply: event.should_telegram_reply === true || source === 'telegram',",
    "  test_run: event.test_run_id || (event.params && event.params.test_run) || '',",
    ...extraLines,
    "} }];"
  ].join('\n');
}

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
    id: 'ezKkyglJhrTwPi8n',
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
  const buildReplyCode = buildReplyEnvelopeCode(
    "'Task erstellt: ' + (event.title || '')",
    [
      "  task_title: event.title || '',",
      "  task_list: event.resolved_task_list || 'NEXT',"
    ]
  );

  const buildErrorReplyCode = buildReplyEnvelopeCode(
    "'Kein Titel angegeben. Beispiel: t: Rechnung senden'"
  );

  return {
    id: 'pzYSe2gnvbXLedvG',
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
          task: `={{ $json.resolved_task_list || ($json.params.test_run ? "${TEST_TASK_LISTS.next}" : "NEXT") }}`,
          title: '={{ $json.title }}',
          dueDate: '={{ $json.params.due || "" }}',
          notes: '={{ "Event: " + $json.event_id + ($json.params.test_run ? "\\nTestRun: " + $json.params.test_run : "") + "\\nProjekt: " + ($json.params.p || "-") + "\\nPrio: " + ($json.params.prio || "M") + "\\nKontext: " + ($json.params.ctx || "-") }}'
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
        parameters: { jsCode: buildErrorReplyCode },
        id: 'build-error-reply',
        name: 'Build Error Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
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
  const buildReplyCode = buildReplyEnvelopeCode(
    "'Follow-up erstellt: ' + (event.title || '')",
    [
      "  task_title: 'WAITING: ' + (event.title || ''),",
      "  task_list: event.resolved_task_list || 'WAITING',"
    ]
  );

  const buildErrorReplyCode = buildReplyEnvelopeCode(
    "'Kein Titel angegeben. Beispiel: f: Antwort von Max'"
  );

  return {
    id: '6d1fV8surkco100H',
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
          task: `={{ $json.resolved_task_list || ($json.params.test_run ? "${TEST_TASK_LISTS.waiting}" : "WAITING") }}`,
          title: '={{ "WAITING: " + $json.title }}',
          dueDate: '={{ $json.params.due || "" }}',
          notes: '={{ "Follow-up fuer: " + ($json.params.to || "-") + "\\nEvent: " + $json.event_id + ($json.params.test_run ? "\\nTestRun: " + $json.params.test_run : "") }}'
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
        parameters: { jsCode: buildErrorReplyCode },
        id: 'build-error-reply',
        name: 'Build Error Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
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
    "const testRun = item.params && item.params.test_run ? item.params.test_run : '';",
    "const basePath = item.resolved_vault_path || (testRun ? '/data/obsidian-vault/00_INBOX_TEST/' : '/data/obsidian-vault/00_INBOX/');",
    "const safeName = title.replace(/[^a-zA-Z0-9\\u00E4\\u00F6\\u00FC\\u00C4\\u00D6\\u00DC\\u00DF\\s\\-_]/g, '');",
    "const filename = date + ' - ' + safeName.substring(0, 80) + '.md';",
    "",
    "const lines = [",
    "  '---',",
    "  'id: ' + item.event_id,",
    "  'date: ' + date,",
    "  'source: telegram',",
    "  'source_id: msg_' + item.message_id,",
    "  'test_run: ' + testRun,",
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
    "  filepath: basePath + filename,",
    "  chat_id: item.chat_id,",
    "  title: item.title,",
    "  test_run: testRun,",
    "  source: item.source || item.source_system || 'telegram',",
    "  source_system: item.source_system || item.source || 'telegram',",
    "  source_id: item.source_id || '',",
    "  is_test: Boolean(item.is_test),",
    "  run_id: item.run_id || null,",
    "  seq: item.seq || null,",
    "  expected_route: item.expected_route || '',",
    "  expected_chain: Array.isArray(item.expected_chain) ? item.expected_chain : [],",
    "  reply_transport: item.reply_transport || ((item.source || item.source_system) === 'telegram' ? 'telegram' : 'webhook'),",
    "  should_telegram_reply: item.should_telegram_reply === true || (item.source || item.source_system) === 'telegram'",
    "},",
    "binary: {",
    "  data: {",
    "    data: Buffer.from(content, 'utf8').toString('base64'),",
    "    mimeType: 'text/markdown',",
    "    fileName: filename,",
    "  }",
    "}",
    "}];"
  ].join('\n');

  const buildSuccessReplyCode = buildReplyEnvelopeCode(
    "'Knowledge Draft erstellt: ' + (($('Build Markdown').first().json.title) || '')",
    [
      "  note_path: $('Build Markdown').first().json.filepath || '',",
      "  note_filename: $('Build Markdown').first().json.filename || '',"
    ]
  );

  const buildErrorReplyCode = buildReplyEnvelopeCode(
    "'Kein Titel. Beispiel: k: Idee fuer Telegram'"
  );

  return {
    id: 'Jm3AB26MzUlxauV6',
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
        parameters: { jsCode: buildSuccessReplyCode },
        id: 'build-success-reply',
        name: 'Build Success Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1200, 200]
      },
      {
        parameters: { jsCode: buildErrorReplyCode },
        id: 'build-error-reply',
        name: 'Build Error Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
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
    "  event_id: item.event_id,",
    "  source: item.source || item.source_system || 'telegram',",
    "  source_system: item.source_system || item.source || 'telegram',",
    "  source_id: item.source_id || '',",
    "  is_test: Boolean(item.is_test),",
    "  run_id: item.run_id || null,",
    "  seq: item.seq || null,",
    "  expected_route: item.expected_route || '',",
    "  expected_chain: Array.isArray(item.expected_chain) ? item.expected_chain : [],",
    "  reply_transport: item.reply_transport || ((item.source || item.source_system) === 'telegram' ? 'telegram' : 'webhook'),",
    "  should_telegram_reply: item.should_telegram_reply === true || (item.source || item.source_system) === 'telegram'",
    "} }];"
  ].join('\n');

  const formatReplyCode = [
    "const query = $('Parse Query Params').first().json;",
    "const events = items.map(i => i.json);",
    "const lines = ['Kalender ' + query.queryDate + ' (' + query.slotStart + '-' + query.slotEnd + ')'];",
    "lines.push('');",
    "",
    "if (events.length === 0 || (events.length === 1 && !events[0].summary)) {",
    "  lines.push('Keine Termine - der Zeitraum ist frei.');",
    "} else {",
    "  lines.push('Termine:');",
    "  for (const ev of events) {",
    "    if (!ev.summary) continue;",
    "    const start = ev.start ? (ev.start.dateTime || ev.start.date || '?') : '?';",
    "    const end = ev.end ? (ev.end.dateTime || ev.end.date || '?') : '?';",
    "    const startTime = start.includes('T') ? start.split('T')[1].substring(0, 5) : start;",
    "    const endTime = end.includes('T') ? end.split('T')[1].substring(0, 5) : end;",
    "    lines.push('  - ' + startTime + '-' + endTime + ' ' + ev.summary);",
    "  }",
    "}",
    "",
    "return [{ json: {",
    "  chat_id: query.chat_id,",
    "  reply_text: lines.join('\\n'),",
    "  reply_parse_mode: '',",
    "  source: query.source || query.source_system || 'telegram',",
    "  source_system: query.source_system || query.source || 'telegram',",
    "  source_id: query.source_id || '',",
    "  is_test: Boolean(query.is_test),",
    "  run_id: query.run_id || null,",
    "  seq: query.seq || null,",
    "  expected_route: query.expected_route || '',",
    "  expected_chain: Array.isArray(query.expected_chain) ? query.expected_chain : [],",
    "  reply_transport: query.reply_transport || ((query.source || query.source_system) === 'telegram' ? 'telegram' : 'webhook'),",
    "  should_telegram_reply: query.should_telegram_reply === true || (query.source || query.source_system) === 'telegram'",
    "} }];"
  ].join('\n');

  return {
    id: 'FLsNZCEhoqtwCbPG',
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
            value: TEST_CALENDAR_ID,
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
  const allowedParams = ['due', 'project', 'p', 'prio', 'ctx', 'to', 'topic', 'src', 'window', 'tz', 'store', 'test_run'];

  const llmResponseFormat = {
    type: 'json_schema',
    json_schema: {
      name: 'canonical_intent',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          intent: {
            type: 'string',
            enum: [
              'task.create',
              'followup.create',
              'knowledge.draft',
              'calendar.query',
              'shopping.add',
              'workout.log',
              'meeting.create',
              'health.log',
              'journal.create',
              'unknown'
            ]
          },
          target_list: { type: 'string' },
          title: { type: 'string' },
          items: { type: 'array', items: { type: 'string' } },
          params: {
            type: 'object',
            properties: Object.fromEntries(allowedParams.map((name) => [name, { type: 'string' }])),
            additionalProperties: false
          },
          confidence: { type: 'number' },
          needs_confirmation: { type: 'boolean' }
        },
        required: ['ok', 'intent', 'target_list', 'title', 'items', 'params', 'confidence', 'needs_confirmation'],
        additionalProperties: false
      }
    }
  };

  const llmSystemPrompt = [
    'Wandle den User-Text in ein strukturiertes JSON um.',
    'Nutze nur diese Intents: task.create, followup.create, knowledge.draft, calendar.query, shopping.add, workout.log, meeting.create, health.log, journal.create, unknown.',
    'Wenn der Text einen Einkauf oder mehrere Artikel beschreibt, nutze shopping.add und liefere einzelne Artikel in items[].',
    'Verwende nur diese Parameternamen: due, project, p, prio, ctx, to, topic, src, window, tz, store, test_run.',
    'Wenn du dir unsicher bist, setze intent auf unknown und needs_confirmation auf true.',
    'Antwort nur passend zum JSON-Schema.'
  ].join(' ');

  const llmJsonBody = `={{ ({
  model: 'gpt-4o-mini',
  temperature: 0,
  messages: [
    {
      role: 'system',
      content: ${JSON.stringify(llmSystemPrompt)}
    },
    {
      role: 'user',
      content: $json.raw_text || ''
    }
  ],
  response_format: ${JSON.stringify(llmResponseFormat, null, 2)}
}) }}`;

  const normalizeEventCode = parserCore.buildNormalizeIngressNodeCode({
    workflowId: 'P1-telegram-intake-v2',
    defaultChatId: 0
  });

  const fastLaneParserCode = parserCore.buildFastLaneParserNodeCode();

  const extractLlmOutputCode = `const item = items[0].json || {};
const original = $('Remove Duplicates').first().json || {};
const content = item.choices && item.choices[0] && item.choices[0].message ? item.choices[0].message.content : '';

if (!content || typeof content !== 'string') {
  return [{ json: {
    ...original,
    parser: 'llm',
    ok: false,
    intent: 'unknown',
    target_list: '',
    title: '',
    items: [],
    params: {},
    confidence: 0,
    needs_confirmation: true,
    parse_ok: false,
    parse_error: 'llm_missing_content'
  } }];
}

let parsed;
try {
  parsed = JSON.parse(content);
} catch (error) {
  return [{ json: {
    ...original,
    parser: 'llm',
    ok: false,
    intent: 'unknown',
    target_list: '',
    title: '',
    items: [],
    params: {},
    confidence: 0,
    needs_confirmation: true,
    parse_ok: false,
    parse_error: 'llm_invalid_json'
  } }];
}

return [{ json: {
  ...original,
  ...parsed,
  parser: 'llm',
  parse_ok: Boolean(parsed.ok),
  parse_error: ''
} }];`;

  const normalizeCanonicalEventCode = parserCore.buildNormalizeCanonicalEventNodeCode({
    workflowId: 'P1-telegram-intake-v2',
    testTaskLists: {
      next: TEST_TASK_LISTS.next,
      waiting: TEST_TASK_LISTS.waiting
    },
    testVaultPath: '/data/obsidian-vault/00_INBOX_TEST/',
    prodVaultPath: '/data/obsidian-vault/00_INBOX/',
    allowProdTargets: false
  });

  const expandShoppingItemsCode = `const allowedParams = new Set(${JSON.stringify(allowedParams)});
const event = items[0].json || {};
const shoppingItems = Array.isArray(event.items) ? event.items.map((value) => String(value || '').trim()).filter(Boolean) : [];
const params = {};
for (const [key, value] of Object.entries(event.params || {})) {
  if (allowedParams.has(key)) params[key] = String(value);
}
return shoppingItems.map((title) => ({
  json: {
    ...event,
    event_type: 'task.create',
    routing_decision: 'google_tasks',
    payload: {
      ...(event.payload || {}),
      ok: true,
      intent: 'task.create',
      target_list: 'NEXT',
      title,
      items: [],
      params,
      confidence: event.confidence,
      needs_confirmation: false
    },
    ok: true,
    intent: 'task.create',
    title,
    items: [],
    params,
    needs_confirmation: false,
    target_list: 'NEXT',
    command: 'task',
    entity_type: 'task.create',
    target_system: 'google_tasks',
    parse_ok: true,
    parse_error: ''
  }
}));`;

  const confirmReplyCode = `const event = items[0].json || {};
const unsupported = new Set(['workout.log', 'meeting.create', 'health.log', 'journal.create']);
let replyText = '';

if (event.write_safety_error) {
  replyText = 'Test-Schreibschutz aktiv: ' + event.write_safety_error + '. Dieser Lauf wurde bewusst blockiert, damit nichts in produktive Ziele geschrieben wird.';
} else if (unsupported.has(event.intent)) {
  replyText = 'Intent erkannt: ' + event.intent + '. Dieser Typ ist in Phase 1 noch nicht automatisch verdrahtet. Bitte sende vorerst t:, f:, k: oder q:, oder nutze /help.';
} else if (event.intent === 'shopping.add' && event.parse_error === 'shopping_items_required') {
  replyText = 'Ich habe einen Einkauf erkannt, aber keine einzelnen Artikel sicher extrahieren koennen. Sende zum Beispiel: Milch, Eier und Brot kaufen.';
} else if (event.parse_error === 'unsupported_param') {
  replyText = 'Ich habe nicht erlaubte Parameter gefunden. Erlaubt sind /due, /project, /p, /prio, /ctx, /to, /topic, /src, /window, /tz und /store. Fuer Hilfe: /help.';
} else {
  replyText = 'Ich bin mir noch nicht sicher, was du meinst. Sende es bitte klarer oder nutze DSL, zum Beispiel:\\n- t: Rechnung senden /due=2026-04-12\\n- f: Antwort von Max /due=2026-04-14\\n- k: Idee fuer Telegram Intake\\n- q: free 2026-04-18 /window=09:00-17:00 /tz=Europe/Berlin\\n\\nNatuerliche Sprache fuer Einkauf geht auch, zum Beispiel: Milch, Eier und Brot kaufen.';
}

return [{ json: {
  chat_id: event.chat_id,
  reply_text: replyText,
  reply_parse_mode: '',
  source: event.source || event.source_system || 'telegram',
  source_system: event.source_system || event.source || 'telegram',
  source_id: event.source_id || '',
  is_test: Boolean(event.is_test),
  run_id: event.run_id || null,
  seq: event.seq || null,
  expected_route: event.expected_route || '',
  expected_chain: Array.isArray(event.expected_chain) ? event.expected_chain : [],
  parse_error: event.parse_error || '',
  write_safety_error: event.write_safety_error || '',
  reply_transport: event.reply_transport || ((event.source || event.source_system) === 'telegram' ? 'telegram' : 'webhook'),
  should_telegram_reply: event.should_telegram_reply === true || (event.source || event.source_system) === 'telegram'
} }];`;

  const helpText = [
    'Command-Uebersicht',
    '',
    '/ping - Bot-Test',
    '/help - Diese Hilfe',
    '/start - Alias fuer /help',
    '',
    'DSL Fast Lane:',
    't: Titel /due=YYYY-MM-DD',
    'f: Titel /due=YYYY-MM-DD',
    'k: Titel',
    'q: free YYYY-MM-DD /window=09:00-17:00 /tz=Europe/Berlin',
    '',
    'Natuerliche Sprache:',
    'Milch, Eier und Brot kaufen',
    '',
    'Beispiele:',
    't: Rechnung senden /due=2026-04-12',
    'f: Antwort von Max /due=2026-04-14',
    'k: Idee fuer Telegram Intake',
    'q: free 2026-04-18 /window=09:00-17:00 /tz=Europe/Berlin'
  ].join('\\n');

  return {
    id: 'kqCxomzy3TWYSllH',
    name: 'P1-telegram-intake-v2',
    nodes: [
      // 1. Ingress Trigger
      {
        parameters: { updates: ['message'] },
        id: 'telegram-trigger',
        name: 'telegram-trigger',
        type: 'n8n-nodes-base.telegramTrigger',
        typeVersion: 1.1,
        position: [200, 500],
        credentials: TELEGRAM_CRED
      },
      {
        parameters: {
          httpMethod: 'POST',
          path: 'test-intake',
          responseMode: 'responseNode',
          options: {}
        },
        id: 'test-webhook',
        name: 'test-webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [200, 300]
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
                leftValue: '={{ $json.source === "test_webhook" ? ((String($env.DITI_TEST_WEBHOOK_SECRET || $env.N8N_TEST_WEBHOOK_SECRET || "") === "") || (String($json.raw_headers["x-diti-test-key"] || $json.raw_headers["X-Diti-Test-Key"] || "") === String($env.DITI_TEST_WEBHOOK_SECRET || $env.N8N_TEST_WEBHOOK_SECRET || ""))) : (String($json.chat_id) === "' + ADMIN_CHAT_ID + '") }}',
                rightValue: true,
                operator: { type: 'boolean', operation: 'true' }
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
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'r1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'r2', name: 'reply_text', value: 'Nicht autorisierter Chat oder ungueltiger Test-Webhook.', type: 'string' },
              { id: 'r3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'reply-nicht-autorisiert',
        name: 'Reply: Nicht autorisiert',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [860, 760]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'text-check',
                leftValue: '={{ $json.parse_error }}',
                rightValue: 'non_text_message',
                operator: { type: 'string', operation: 'notEquals' }
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
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'r1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'r2', name: 'reply_text', value: 'Bitte sende Text. Natuerliche Sprache ist erlaubt, zum Beispiel: Milch, Eier und Brot kaufen. Fuer DSL-Hilfe: /help.', type: 'string' },
              { id: 'r3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'reply-nur-text',
        name: 'Reply: Nur Text-Commands',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [1080, 760]
      },
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
      {
        parameters: {
          dataType: 'string',
          value1: '={{ ($json.raw_text || "").trim() }}',
          rules: {
            rules: [
              { operation: 'regex', value2: '^(?:[a-z]:|\\/(?:help|ping|start)$)', output: 0 }
            ]
          },
          fallbackOutput: 1
        },
        id: 'fast-lane-check',
        name: 'Fast Lane Check',
        type: 'n8n-nodes-base.switch',
        typeVersion: 1,
        position: [1300, 500]
      },
      {
        parameters: { jsCode: fastLaneParserCode },
        id: 'fast-lane-parser',
        name: 'Fast Lane Parser',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1520, 340]
      },
      {
        parameters: {
          method: 'POST',
          url: 'https://api.openai.com/v1/chat/completions',
          authentication: 'predefinedCredentialType',
          nodeCredentialType: 'openAiApi',
          sendBody: true,
          contentType: 'json',
          specifyBody: 'json',
          jsonBody: llmJsonBody,
          options: { timeout: 15000 }
        },
        id: 'llm-parser',
        name: 'LLM Parser',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.4,
        position: [1520, 660],
        credentials: OPENAI_CRED
      },
      {
        parameters: { jsCode: extractLlmOutputCode },
        id: 'extract-llm-output',
        name: 'Extract LLM Output',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1740, 660]
      },
      {
        parameters: { jsCode: normalizeCanonicalEventCode },
        id: 'normalize-canonical-event',
        name: 'Normalize Canonical Event',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1960, 500]
      },
      {
        parameters: {
          dataType: 'boolean',
          value1: '={{ $json.ok === true && $json.confidence >= 0.85 && $json.needs_confirmation === false }}',
          rules: {
            rules: [
              { operation: 'equal', value2: true, output: 0 }
            ]
          },
          fallbackOutput: 1
        },
        id: 'confidence-gate',
        name: 'Confidence Gate',
        type: 'n8n-nodes-base.switch',
        typeVersion: 1,
        position: [2180, 500]
      },
      {
        parameters: { jsCode: confirmReplyCode },
        id: 'confirm-reply',
        name: 'Confirm Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2400, 760]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'route-task-create',
                leftValue: '={{ $json.intent }}',
                rightValue: 'task.create',
                operator: { type: 'string', operation: 'equals' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'route-task-create',
        name: 'If: task.create',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [2400, 120]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'route-followup-create',
                leftValue: '={{ $json.intent }}',
                rightValue: 'followup.create',
                operator: { type: 'string', operation: 'equals' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'route-followup-create',
        name: 'If: followup.create',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [2400, 260]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'route-knowledge-draft',
                leftValue: '={{ $json.intent }}',
                rightValue: 'knowledge.draft',
                operator: { type: 'string', operation: 'equals' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'route-knowledge-draft',
        name: 'If: knowledge.draft',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [2400, 400]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'route-calendar-query',
                leftValue: '={{ $json.intent }}',
                rightValue: 'calendar.query',
                operator: { type: 'string', operation: 'equals' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'route-calendar-query',
        name: 'If: calendar.query',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [2400, 540]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'route-shopping-add',
                leftValue: '={{ $json.intent }}',
                rightValue: 'shopping.add',
                operator: { type: 'string', operation: 'equals' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'route-shopping-add',
        name: 'If: shopping.add',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [2400, 680]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'route-help',
                leftValue: '={{ $json.intent }}',
                rightValue: 'help',
                operator: { type: 'string', operation: 'equals' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'route-help',
        name: 'If: help',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [2400, 820]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '' },
            conditions: [
              {
                id: 'route-ping',
                leftValue: '={{ $json.intent }}',
                rightValue: 'ping',
                operator: { type: 'string', operation: 'equals' }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'route-ping',
        name: 'If: ping',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [2400, 960]
      },
      {
        parameters: {
          source: 'database',
          workflowId: SUBWORKFLOW_IDS.taskNext
        },
        id: 'exec-task-next',
        name: 'Execute: task-next',
        type: 'n8n-nodes-base.executeWorkflow',
        typeVersion: 1,
        position: [2660, 80]
      },
      {
        parameters: {
          source: 'database',
          workflowId: SUBWORKFLOW_IDS.taskWaiting
        },
        id: 'exec-task-waiting',
        name: 'Execute: task-waiting',
        type: 'n8n-nodes-base.executeWorkflow',
        typeVersion: 1,
        position: [2660, 220]
      },
      {
        parameters: {
          source: 'database',
          workflowId: SUBWORKFLOW_IDS.knowledgeDraft
        },
        id: 'exec-knowledge',
        name: 'Execute: knowledge-draft',
        type: 'n8n-nodes-base.executeWorkflow',
        typeVersion: 1,
        position: [2660, 360]
      },
      {
        parameters: {
          source: 'database',
          workflowId: SUBWORKFLOW_IDS.calendarQuery
        },
        id: 'exec-calendar',
        name: 'Execute: calendar-query',
        type: 'n8n-nodes-base.executeWorkflow',
        typeVersion: 1,
        position: [2660, 500]
      },
      {
        parameters: { jsCode: expandShoppingItemsCode },
        id: 'expand-shopping-items',
        name: 'Expand Shopping Items',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2660, 640]
      },
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'h1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'h2', name: 'reply_text', value: helpText, type: 'string' },
              { id: 'h3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'help-reply',
        name: 'Help Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [2660, 780]
      },
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'p1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'p2', name: 'reply_text', value: 'ok - telegram intake aktiv', type: 'string' },
              { id: 'p3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'ping-reply',
        name: 'Ping Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [2660, 920]
      },
      {
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [
              { id: 'f1', name: 'chat_id', value: '={{ $json.chat_id }}', type: 'number' },
              { id: 'f2', name: 'reply_text', value: 'Kein Ausfuehrungspfad fuer diesen Intent gefunden. Nutze /help oder sende t:, f:, k: oder q:.', type: 'string' },
              { id: 'f3', name: 'reply_parse_mode', value: '', type: 'string' }
            ]
          },
          options: {}
        },
        id: 'fallback-reply',
        name: 'Fallback Reply',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [2660, 1060]
      },
      {
        parameters: {
          dataType: 'string',
          value1: '={{ $json.reply_transport || (Number($json.chat_id || 0) > 0 ? "telegram" : "webhook") }}',
          rules: {
            rules: [
              { value2: 'telegram', output: 0 },
              { value2: 'webhook', output: 1 }
            ]
          },
          fallbackOutput: 1
        },
        id: 'response-transport',
        name: 'Response Transport',
        type: 'n8n-nodes-base.switch',
        typeVersion: 1,
        position: [2920, 500]
      },
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
        position: [3180, 380],
        credentials: TELEGRAM_CRED
      },
      {
        parameters: {
          respondWith: 'text',
          responseBody: '={{ JSON.stringify({ status: $json.write_safety_error ? "blocked" : "ok", source_id: $json.source_id || "", run_id: $json.run_id || null, seq: $json.seq || null, reply_text: $json.reply_text || "", parse_error: $json.parse_error || "", write_safety_error: $json.write_safety_error || "", task_list: $json.task_list || "", note_path: $json.note_path || "", transport: $json.reply_transport || "webhook" }) }}'
        },
        id: 'webhook-response',
        name: 'Webhook Response',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1,
        position: [3180, 620]
      }
    ],
    connections: {
      'telegram-trigger': { main: [[{ node: 'Normalize Event', type: 'main', index: 0 }]] },
      'test-webhook': { main: [[{ node: 'Normalize Event', type: 'main', index: 0 }]] },
      'Normalize Event': { main: [[{ node: 'Allowlist Check', type: 'main', index: 0 }]] },
      'Allowlist Check': {
        main: [
          [{ node: 'Text Guard', type: 'main', index: 0 }],
          [{ node: 'Reply: Nicht autorisiert', type: 'main', index: 0 }]
        ]
      },
      'Reply: Nicht autorisiert': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Text Guard': {
        main: [
          [{ node: 'Remove Duplicates', type: 'main', index: 0 }],
          [{ node: 'Reply: Nur Text-Commands', type: 'main', index: 0 }]
        ]
      },
      'Reply: Nur Text-Commands': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Remove Duplicates': { main: [[{ node: 'Fast Lane Check', type: 'main', index: 0 }]] },
      'Fast Lane Check': {
        main: [
          [{ node: 'Fast Lane Parser', type: 'main', index: 0 }],
          [{ node: 'LLM Parser', type: 'main', index: 0 }]
        ]
      },
      'Fast Lane Parser': { main: [[{ node: 'Normalize Canonical Event', type: 'main', index: 0 }]] },
      'LLM Parser': { main: [[{ node: 'Extract LLM Output', type: 'main', index: 0 }]] },
      'Extract LLM Output': { main: [[{ node: 'Normalize Canonical Event', type: 'main', index: 0 }]] },
      'Normalize Canonical Event': { main: [[{ node: 'Confidence Gate', type: 'main', index: 0 }]] },
      'Confidence Gate': {
        main: [
          [{ node: 'If: task.create', type: 'main', index: 0 }],
          [{ node: 'Confirm Reply', type: 'main', index: 0 }]
        ]
      },
      'Confirm Reply': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'If: task.create': {
        main: [
          [{ node: 'Execute: task-next', type: 'main', index: 0 }],
          [{ node: 'If: followup.create', type: 'main', index: 0 }]
        ]
      },
      'If: followup.create': {
        main: [
          [{ node: 'Execute: task-waiting', type: 'main', index: 0 }],
          [{ node: 'If: knowledge.draft', type: 'main', index: 0 }]
        ]
      },
      'If: knowledge.draft': {
        main: [
          [{ node: 'Execute: knowledge-draft', type: 'main', index: 0 }],
          [{ node: 'If: calendar.query', type: 'main', index: 0 }]
        ]
      },
      'If: calendar.query': {
        main: [
          [{ node: 'Execute: calendar-query', type: 'main', index: 0 }],
          [{ node: 'If: shopping.add', type: 'main', index: 0 }]
        ]
      },
      'If: shopping.add': {
        main: [
          [{ node: 'Expand Shopping Items', type: 'main', index: 0 }],
          [{ node: 'If: help', type: 'main', index: 0 }]
        ]
      },
      'If: help': {
        main: [
          [{ node: 'Help Reply', type: 'main', index: 0 }],
          [{ node: 'If: ping', type: 'main', index: 0 }]
        ]
      },
      'If: ping': {
        main: [
          [{ node: 'Ping Reply', type: 'main', index: 0 }],
          [{ node: 'Fallback Reply', type: 'main', index: 0 }]
        ]
      },
      'Expand Shopping Items': { main: [[{ node: 'Execute: task-next', type: 'main', index: 0 }]] },
      'Execute: task-next': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Execute: task-waiting': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Execute: knowledge-draft': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Execute: calendar-query': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Help Reply': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Ping Reply': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Fallback Reply': { main: [[{ node: 'Response Transport', type: 'main', index: 0 }]] },
      'Response Transport': {
        main: [
          [{ node: 'Telegram Reply', type: 'main', index: 0 }],
          [{ node: 'Webhook Response', type: 'main', index: 0 }]
        ]
      }
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
