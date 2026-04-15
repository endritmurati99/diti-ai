/**
 * Shared parser and normalization helpers for Diti AI.
 *
 * This module is the single source of truth for:
 * - local parser/router testing
 * - intake workflow code-node generation
 *
 * NOTE:
 * - The live intake embeds code in n8n workflow exports (for example `n8n/workflows/P1-telegram-intake-v2.json`).
 * - Keep this file in sync with embedded workflow code when you change parsing/normalization behavior.
 */

const fs = require('fs');
const path = require('path');

const TESTING_REGISTRY_PATH = path.resolve(__dirname, '..', '..', 'config', 'testing-registry.json');

function loadTestingRegistry() {
  try {
    return JSON.parse(fs.readFileSync(TESTING_REGISTRY_PATH, 'utf8'));
  } catch (error) {
    return null;
  }
}

const testingRegistry = loadTestingRegistry();
const DEFAULT_TEST_TASK_LISTS = {
  next: String(testingRegistry?.test_targets?.task_lists?.next || 'NEXT_TEST'),
  waiting: String(testingRegistry?.test_targets?.task_lists?.waiting || 'WAITING_TEST'),
};

const ALLOWED_PARAMS = [
  'due',
  'project',
  'p',
  'prio',
  'ctx',
  'to',
  'topic',
  'src',
  'window',
  'tz',
  'store',
  'test_run',
];

const FAST_LANE_PREFIX_CONFIG = {
  t: { intent: 'task.create', command: 'task', event_type: 'task.create', target_system: 'google_tasks', target_list: 'NEXT', needs_confirmation: false, requires_title: true },
  f: { intent: 'followup.create', command: 'followup', event_type: 'followup.create', target_system: 'google_tasks', target_list: 'WAITING', needs_confirmation: false, requires_title: true },
  k: { intent: 'knowledge.draft', command: 'knowledge', event_type: 'knowledge.draft', target_system: 'obsidian', target_list: '', needs_confirmation: false, requires_title: true },
  q: { intent: 'calendar.query', command: 'calendar_query', event_type: 'calendar.query', target_system: 'google_calendar', target_list: '', needs_confirmation: false, requires_title: false },
  w: { intent: 'workout.log', command: 'workout', event_type: 'workout.log', target_system: 'notion', target_list: '', needs_confirmation: true, requires_title: true },
  m: { intent: 'meeting.create', command: 'meeting', event_type: 'meeting.create', target_system: 'obsidian', target_list: '', needs_confirmation: true, requires_title: true },
  h: { intent: 'health.log', command: 'health', event_type: 'health.log', target_system: 'notion', target_list: '', needs_confirmation: true, requires_title: true },
  j: { intent: 'journal.create', command: 'journal', event_type: 'journal.create', target_system: 'obsidian', target_list: '', needs_confirmation: true, requires_title: true },
};

const META_BY_INTENT = {
  'task.create': { command: 'task', entity_type: 'task.create', target_system: 'google_tasks', target_list: 'NEXT', routing: 'google_tasks' },
  'followup.create': { command: 'followup', entity_type: 'followup.create', target_system: 'google_tasks', target_list: 'WAITING', routing: 'google_tasks' },
  'knowledge.draft': { command: 'knowledge', entity_type: 'knowledge.draft', target_system: 'obsidian', target_list: '', routing: 'obsidian' },
  'calendar.query': { command: 'calendar_query', entity_type: 'calendar.query', target_system: 'google_calendar', target_list: '', routing: 'google_calendar' },
  'shopping.add': { command: 'shopping', entity_type: 'shopping.add', target_system: 'google_tasks', target_list: 'NEXT', routing: 'google_tasks' },
  help: { command: 'help', entity_type: 'system.help', target_system: 'telegram', target_list: '', routing: 'telegram' },
  ping: { command: 'ping', entity_type: 'system.ping', target_system: 'telegram', target_list: '', routing: 'telegram' },
  'workout.log': { command: 'workout', entity_type: 'workout.log', target_system: 'notion', target_list: '', routing: 'manual_confirmation' },
  'meeting.create': { command: 'meeting', entity_type: 'meeting.create', target_system: 'obsidian', target_list: '', routing: 'manual_confirmation' },
  'health.log': { command: 'health', entity_type: 'health.log', target_system: 'notion', target_list: '', routing: 'manual_confirmation' },
  'journal.create': { command: 'journal', entity_type: 'journal.create', target_system: 'obsidian', target_list: '', routing: 'manual_confirmation' },
  unknown: { command: 'unknown', entity_type: 'unknown', target_system: '', target_list: '', routing: 'manual_confirmation' },
};

const AUTO_EXECUTABLE = [
  'task.create',
  'followup.create',
  'knowledge.draft',
  'calendar.query',
  'shopping.add',
  'help',
  'ping',
];

function generateULID() {
  const encoding = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let now = Date.now();
  let timePart = '';
  for (let index = 9; index >= 0; index -= 1) {
    timePart = encoding[now % 32] + timePart;
    now = Math.floor(now / 32);
  }
  let randomPart = '';
  for (let index = 0; index < 16; index += 1) {
    randomPart += encoding[Math.floor(Math.random() * 32)];
  }
  return timePart + randomPart;
}

function toSafeNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toSafeString(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function padSequence(seq) {
  return String(seq).padStart(5, '0');
}

function ensureTestRunId(candidate, runId, seq, isTest) {
  if (candidate) {
    return toSafeString(candidate).trim();
  }
  if (!isTest || !runId) {
    return '';
  }
  return `${runId}-${padSequence(seq)}`;
}

function normalizeIngress(input, options = {}) {
  const rawInput = input || {};
  const webhookBody = rawInput.body && typeof rawInput.body === 'object' ? rawInput.body : null;
  const sourceInput = webhookBody || rawInput;
  const inferredWebhook =
    sourceInput.source === 'test_webhook'
    || sourceInput.source_system === 'test_webhook'
    || sourceInput.is_test === true
    || sourceInput.run_id !== undefined
    || sourceInput.seq !== undefined
    || webhookBody !== null;

  const source = inferredWebhook ? 'test_webhook' : 'telegram';
  const rawMessage = source === 'telegram'
    ? (rawInput.message || rawInput.raw_message || rawInput || {})
    : (sourceInput.raw_message || sourceInput || {});

  const text = typeof sourceInput.text === 'string'
    ? sourceInput.text
    : typeof sourceInput.raw_text === 'string'
      ? sourceInput.raw_text
      : typeof rawMessage.text === 'string'
        ? rawMessage.text
        : '';

  const seq = toSafeNumber(sourceInput.seq, 0);
  const runId = toSafeString(sourceInput.run_id, '').trim();
  const messageId = toSafeNumber(
    sourceInput.message_id !== undefined ? sourceInput.message_id : (rawMessage.message_id !== undefined ? rawMessage.message_id : seq),
    0,
  );
  const defaultChatId = options.defaultChatId !== undefined ? options.defaultChatId : 0;
  const chatId = toSafeNumber(
    sourceInput.chat_id !== undefined
      ? sourceInput.chat_id
      : rawMessage.chat && rawMessage.chat.id !== undefined
        ? rawMessage.chat.id
        : rawMessage.from && rawMessage.from.id !== undefined
          ? rawMessage.from.id
          : defaultChatId,
    0,
  );
  const isTest = Boolean(sourceInput.is_test || source === 'test_webhook' || runId);
  const expectedChain = Array.isArray(sourceInput.expected_chain)
    ? sourceInput.expected_chain.map((item) => String(item)).filter(Boolean)
    : [];
  const testRunId = ensureTestRunId(sourceInput.test_run, runId, seq || messageId || 0, isTest);
  const sourceId = sourceInput.source_id
    ? toSafeString(sourceInput.source_id).trim()
    : source === 'telegram'
      ? `tg_${chatId}_${messageId}`
      : `test_${runId || 'adhoc'}_${padSequence(seq || messageId || 0)}`;
  const timestamp = new Date().toISOString();

  return {
    event_id: toSafeString(rawInput.event_id || generateULID()),
    event_type: source === 'telegram' ? 'telegram.message.received' : 'test.webhook.received',
    source,
    source_system: source,
    source_id: sourceId,
    timestamp,
    received_at: timestamp,
    actor: 'user',
    chat_id: chatId,
    message_id: messageId,
    raw_text: text,
    raw_message: rawMessage,
    raw_headers: rawInput.headers || rawInput.raw_headers || {},
    is_test: isTest,
    run_id: runId || null,
    seq: seq || null,
    expected_route: toSafeString(sourceInput.expected_route, '').trim(),
    expected_chain: expectedChain,
    test_run_id: testRunId,
    reply_transport: source === 'telegram' ? 'telegram' : 'webhook',
    should_telegram_reply: source === 'telegram',
    routing_decision: 'pending',
    audit: {
      workflow_id: options.workflowId || 'P1-telegram-intake-v2',
      parser: 'normalize',
      confidence: 0,
    },
    ok: false,
    intent: 'unknown',
    target_list: '',
    resolved_task_list: '',
    resolved_vault_path: '',
    write_safety_error: '',
    title: '',
    items: [],
    params: testRunId ? { test_run: testRunId } : {},
    confidence: 0,
    needs_confirmation: true,
    command: 'unknown',
    entity_type: 'unknown',
    target_system: '',
    parse_ok: false,
    parse_error: text ? '' : 'non_text_message',
    payload: {
      ok: false,
      intent: 'unknown',
      target_list: '',
      title: '',
      items: [],
      params: testRunId ? { test_run: testRunId } : {},
      confidence: 0,
      needs_confirmation: true,
    },
  };
}

function parseFastLaneEvent(inputData, options = {}) {
  const allowedParams = new Set(options.allowedParams || ALLOWED_PARAMS);
  const prefixConfig = options.prefixConfig || FAST_LANE_PREFIX_CONFIG;
  const text = toSafeString(inputData.raw_text).trim();
  const slashMatch = text.match(/^\/(help|ping|start)$/i);
  const prefixMatch = text.match(/^([a-z]):\s*(.*)$/is);
  const existingParams = inputData.params && typeof inputData.params === 'object'
    ? { ...inputData.params }
    : {};

  let result = {
    ...inputData,
    parser: 'fast_lane',
    ok: false,
    intent: 'unknown',
    target_list: '',
    title: '',
    items: [],
    params: existingParams,
    confidence: 0,
    needs_confirmation: true,
    command: 'unknown',
    entity_type: 'unknown',
    target_system: '',
    parse_ok: false,
    parse_error: 'unknown_prefix',
  };

  if (slashMatch) {
    const slash = slashMatch[1].toLowerCase();
    const intent = slash === 'ping' ? 'ping' : 'help';
    const eventType = intent === 'ping' ? 'system.ping' : 'system.help';
    result = {
      ...result,
      ok: true,
      intent,
      target_list: '',
      title: '',
      items: [],
      params: existingParams,
      confidence: 1,
      needs_confirmation: false,
      command: intent,
      entity_type: eventType,
      target_system: 'telegram',
      event_type: eventType,
      parse_ok: true,
      parse_error: '',
    };
  } else if (prefixMatch) {
    const prefix = prefixMatch[1].toLowerCase();
    const config = prefixConfig[prefix];
    if (config) {
      const rest = prefixMatch[2] || '';
      const extracted = { ...existingParams };
      const invalidParams = [];
      const paramRegex = /\/(\w+)=([^\s/]+)/g;
      let match = paramRegex.exec(rest);
      while (match !== null) {
        const key = match[1];
        const value = match[2];
        if (!allowedParams.has(key)) {
          invalidParams.push(key);
        } else {
          extracted[key] = value;
        }
        match = paramRegex.exec(rest);
      }
      if (inputData.is_test && inputData.test_run_id && !extracted.test_run) {
        extracted.test_run = inputData.test_run_id;
      }
      const title = rest.replace(/\/\w+=[^\s/]+/g, '').trim();
      const missingTitle = config.requires_title && !title;
      const parseError = invalidParams.length > 0
        ? 'unsupported_param'
        : (missingTitle ? 'empty_title' : '');
      const ok = parseError === '';
      result = {
        ...result,
        ok,
        intent: config.intent,
        target_list: config.target_list,
        title,
        items: [],
        params: extracted,
        confidence: ok ? 1 : 0.2,
        needs_confirmation: ok ? config.needs_confirmation : true,
        command: config.command,
        entity_type: config.event_type,
        target_system: config.target_system,
        event_type: config.event_type,
        parse_ok: ok,
        parse_error: parseError,
      };
    }
  }

  return result;
}

function normalizeCanonicalEvent(inputData, options = {}) {
  const allowedParams = new Set(options.allowedParams || ALLOWED_PARAMS);
  const metaByIntent = options.metaByIntent || META_BY_INTENT;
  const autoExecutable = new Set(options.autoExecutable || AUTO_EXECUTABLE);
  const rawParams = inputData.params && typeof inputData.params === 'object' ? inputData.params : {};
  const params = {};
  const invalidParams = [];
  for (const [key, value] of Object.entries(rawParams)) {
    if (!allowedParams.has(key)) {
      invalidParams.push(key);
      continue;
    }
    params[key] = String(value);
  }

  if (inputData.is_test && inputData.test_run_id && !params.test_run) {
    params.test_run = inputData.test_run_id;
  }

  const intent = typeof inputData.intent === 'string' && inputData.intent ? inputData.intent : 'unknown';
  const meta = metaByIntent[intent] || metaByIntent.unknown;
  const rawItems = Array.isArray(inputData.items) ? inputData.items : [];
  const cleanItems = rawItems.map((item) => String(item || '').trim()).filter(Boolean);
  const title = typeof inputData.title === 'string' ? inputData.title.trim() : '';
  let ok = Boolean(inputData.ok);
  let confidence = Number(inputData.confidence);
  if (!Number.isFinite(confidence)) {
    confidence = 0;
  }
  let needsConfirmation = Boolean(inputData.needs_confirmation);
  let parseError = toSafeString(inputData.parse_error, '');

  if (intent === 'unknown') {
    ok = false;
    needsConfirmation = true;
    parseError = parseError || 'unknown_intent';
  }
  if (invalidParams.length > 0) {
    ok = false;
    needsConfirmation = true;
    parseError = parseError || 'unsupported_param';
  }
  if (['task.create', 'followup.create', 'knowledge.draft'].includes(intent) && !title) {
    ok = false;
    needsConfirmation = true;
    parseError = parseError || 'empty_title';
  }
  if (intent === 'shopping.add' && cleanItems.length === 0) {
    ok = false;
    needsConfirmation = true;
    parseError = parseError || 'shopping_items_required';
  }
  if (!autoExecutable.has(intent)) {
    needsConfirmation = true;
  }

  const defaultTargetList =
    typeof inputData.target_list === 'string' && inputData.target_list !== ''
      ? inputData.target_list
      : meta.target_list;
  const targetSystem = inputData.target_system || meta.target_system;
  const eventType = inputData.event_type || meta.entity_type;
  const testTaskLists = options.testTaskLists || DEFAULT_TEST_TASK_LISTS;
  const testVaultPath = toSafeString(options.testVaultPath, '/data/obsidian-vault/00_INBOX_TEST/').replace(/\/?$/, '/');
  const prodVaultPath = toSafeString(options.prodVaultPath, '/data/obsidian-vault/00_INBOX/').replace(/\/?$/, '/');
  let resolvedTaskList = defaultTargetList;
  let resolvedVaultPath = targetSystem === 'obsidian' ? prodVaultPath : '';
  let writeSafetyError = '';

  if (inputData.is_test) {
    if (intent === 'task.create' || intent === 'shopping.add') {
      resolvedTaskList = testTaskLists.next;
    } else if (intent === 'followup.create') {
      resolvedTaskList = testTaskLists.waiting;
    } else if (intent === 'knowledge.draft') {
      resolvedVaultPath = testVaultPath;
    }
  }

  if (inputData.is_test && options.allowProdTargets === false) {
    if ((intent === 'task.create' || intent === 'shopping.add') && resolvedTaskList !== testTaskLists.next) {
      writeSafetyError = 'task_test_target_must_use_next_test';
    }
    if (intent === 'followup.create' && resolvedTaskList !== testTaskLists.waiting) {
      writeSafetyError = 'followup_test_target_must_use_waiting_test';
    }
    if (intent === 'knowledge.draft' && resolvedVaultPath !== testVaultPath) {
      writeSafetyError = 'knowledge_test_target_must_use_test_vault';
    }
  }

  if (writeSafetyError) {
    ok = false;
    needsConfirmation = true;
    parseError = parseError || 'write_safety_violation';
  }

  const payload = {
    ok,
    intent,
    target_list: defaultTargetList,
    title,
    items: intent === 'shopping.add' ? cleanItems : [],
    params,
    confidence,
    needs_confirmation: needsConfirmation,
  };
  const routingDecision = writeSafetyError
    ? 'blocked_test_write'
    : (!ok || needsConfirmation ? 'manual_confirmation' : meta.routing);
  const audit = {
    workflow_id: options.workflowId || 'P1-telegram-intake-v2',
    parser: inputData.parser || 'unknown',
    confidence,
    invalid_params: invalidParams,
  };

  return {
    event_id: inputData.event_id || '',
    event_type: eventType,
    source: inputData.source || inputData.source_system || 'telegram',
    source_system: inputData.source_system || inputData.source || 'telegram',
    source_id: inputData.source_id || '',
    timestamp: inputData.timestamp || inputData.received_at || new Date().toISOString(),
    actor: inputData.actor || 'user',
    payload,
    routing_decision: routingDecision,
    audit,
    ok,
    intent,
    title,
    items: payload.items,
    params,
    confidence,
    needs_confirmation: needsConfirmation,
    target_list: defaultTargetList,
    resolved_task_list: resolvedTaskList,
    resolved_vault_path: resolvedVaultPath,
    write_safety_error: writeSafetyError,
    command: meta.command,
    entity_type: eventType,
    target_system: targetSystem,
    parse_ok: ok,
    parse_error: parseError,
    chat_id: toSafeNumber(inputData.chat_id, 0),
    message_id: toSafeNumber(inputData.message_id, 0),
    raw_text: toSafeString(inputData.raw_text),
    raw_message: inputData.raw_message || {},
    raw_headers: inputData.raw_headers || {},
    received_at: inputData.received_at || inputData.timestamp || new Date().toISOString(),
    is_test: Boolean(inputData.is_test),
    run_id: inputData.run_id || null,
    seq: inputData.seq || null,
    expected_route: inputData.expected_route || '',
    expected_chain: Array.isArray(inputData.expected_chain) ? inputData.expected_chain : [],
    test_run_id: inputData.test_run_id || params.test_run || '',
    reply_transport: inputData.reply_transport || (inputData.source === 'telegram' ? 'telegram' : 'webhook'),
    should_telegram_reply: Boolean(inputData.should_telegram_reply),
  };
}

function buildNormalizeIngressNodeCode(options = {}) {
  return `
const options = ${JSON.stringify(options, null, 2)};
${toSafeNumber.toString()}
${toSafeString.toString()}
${padSequence.toString()}
${ensureTestRunId.toString()}
${generateULID.toString()}
${normalizeIngress.toString()}
const input = items[0].json || {};
return [{ json: normalizeIngress(input, options) }];
`.trim();
}

function buildFastLaneParserNodeCode() {
  return `
const options = {
  allowedParams: ${JSON.stringify(ALLOWED_PARAMS, null, 2)},
  prefixConfig: ${JSON.stringify(FAST_LANE_PREFIX_CONFIG, null, 2)}
};
${toSafeString.toString()}
${parseFastLaneEvent.toString()}
const inputData = items[0].json || {};
return [{ json: parseFastLaneEvent(inputData, options) }];
`.trim();
}

function buildNormalizeCanonicalEventNodeCode(options = {}) {
  return `
const options = ${JSON.stringify({
    ...options,
    allowedParams: ALLOWED_PARAMS,
    metaByIntent: META_BY_INTENT,
    autoExecutable: AUTO_EXECUTABLE,
  }, null, 2)};
${toSafeNumber.toString()}
${toSafeString.toString()}
${normalizeCanonicalEvent.toString()}
const inputData = items[0].json || {};
return [{ json: normalizeCanonicalEvent(inputData, options) }];
`.trim();
}

module.exports = {
  ALLOWED_PARAMS,
  FAST_LANE_PREFIX_CONFIG,
  META_BY_INTENT,
  AUTO_EXECUTABLE,
  generateULID,
  normalizeIngress,
  parseFastLaneEvent,
  normalizeCanonicalEvent,
  buildNormalizeIngressNodeCode,
  buildFastLaneParserNodeCode,
  buildNormalizeCanonicalEventNodeCode,
};
