#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const parserCore = require("../api/command-parser.js");

function parseArgs(argv) {
  const args = {
    corpus: null,
    out: null,
    limitSamples: 20,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--corpus") {
      args.corpus = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (value === "--out") {
      args.out = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (value === "--limit-samples") {
      args.limitSamples = Number(argv[index + 1] || 20);
      index += 1;
    }
  }

  if (!args.corpus) {
    throw new Error("Usage: node n8n/scripts/test_parser.mjs --corpus <path> [--out <path>] [--limit-samples <n>]");
  }

  return args;
}

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function inferWorkflow(command) {
  switch (command) {
    case "task":
      return "P1-telegram-task-next-v1";
    case "followup":
      return "P1-telegram-task-waiting-v1";
    case "knowledge":
      return "P1-telegram-knowledge-draft-v1";
    case "calendar_query":
      return "P1-telegram-calendar-query-v1";
    case "help":
    case "ping":
    default:
      return "P1-telegram-intake-v2";
  }
}

function buildActualChain(workflowName) {
  if (workflowName === "P1-telegram-intake-v2") {
    return ["P1-telegram-intake-v2"];
  }
  return ["P1-telegram-intake-v2", workflowName];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const corpusPath = path.resolve(args.corpus);
  const outPath = path.resolve(
    args.out || path.join(path.dirname(corpusPath), "parser-report.json"),
  );
  const rows = readJsonl(corpusPath);

  const samples = [];
  const summary = {
    total: rows.length,
    ok: 0,
    parser_failures: 0,
    routing_failures: 0,
    write_safety_failures: 0,
    crashes: 0,
  };

  for (const row of rows) {
    try {
      const normalized = parserCore.normalizeIngress(
        {
          source: "test_webhook",
          text: row.text,
          is_test: true,
          run_id: "local-parser",
          seq: row.seq,
          source_id: `test_local-parser_${String(row.seq).padStart(5, "0")}`,
          expected_route: row.expected_route || "",
          expected_chain: row.expected_chain || [],
        },
        {
          workflowId: "P1-telegram-intake-v2",
          defaultChatId: 0,
        },
      );
      const fastLane = parserCore.parseFastLaneEvent(normalized, {
        allowedParams: parserCore.ALLOWED_PARAMS,
        prefixConfig: parserCore.FAST_LANE_PREFIX_CONFIG,
      });
      const canonical = parserCore.normalizeCanonicalEvent(fastLane, {
        workflowId: "P1-telegram-intake-v2",
        allowedParams: parserCore.ALLOWED_PARAMS,
        metaByIntent: parserCore.META_BY_INTENT,
        autoExecutable: parserCore.AUTO_EXECUTABLE,
        testTaskLists: {
          next: "NEXT_TEST",
          waiting: "WAITING_TEST",
        },
        testVaultPath: "/data/obsidian-vault/00_INBOX_TEST/",
        prodVaultPath: "/data/obsidian-vault/00_INBOX/",
        allowProdTargets: false,
      });

      const actualWorkflow = inferWorkflow(canonical.command);
      const actualChain = buildActualChain(actualWorkflow);
      const parserFailure = Boolean(canonical.parse_error);
      const routingFailure =
        canonical.command !== row.expected_command ||
        actualWorkflow !== row.expected_workflow ||
        (
          Array.isArray(row.expected_chain) &&
          row.expected_chain.length > 0 &&
          JSON.stringify(actualChain) !== JSON.stringify(row.expected_chain)
        );
      const writeSafetyFailure = Boolean(canonical.write_safety_error);

      if (parserFailure) {
        summary.parser_failures += 1;
      }
      if (routingFailure) {
        summary.routing_failures += 1;
      }
      if (writeSafetyFailure) {
        summary.write_safety_failures += 1;
      }
      if (!parserFailure && !routingFailure && !writeSafetyFailure) {
        summary.ok += 1;
      }

      if ((parserFailure || routingFailure || writeSafetyFailure) && samples.length < args.limitSamples) {
        samples.push({
          seq: row.seq,
          text: row.text,
          expected_command: row.expected_command,
          actual_command: canonical.command,
          expected_workflow: row.expected_workflow,
          actual_workflow: actualWorkflow,
          expected_chain: row.expected_chain || [],
          actual_chain: actualChain,
          parse_error: canonical.parse_error || "",
          write_safety_error: canonical.write_safety_error || "",
        });
      }
    } catch (error) {
      summary.crashes += 1;
      if (samples.length < args.limitSamples) {
        samples.push({
          seq: row.seq,
          text: row.text,
          crash: String(error && error.message ? error.message : error),
        });
      }
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    corpus_path: corpusPath,
    summary,
    samples,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf-8");
  console.log(`Parser report written to ${outPath}`);
  if (summary.parser_failures || summary.routing_failures || summary.write_safety_failures || summary.crashes) {
    process.exitCode = 1;
  }
}

main();
