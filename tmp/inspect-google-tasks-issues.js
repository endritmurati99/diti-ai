const { NodeHelpers } = require('n8n-workflow');
const { GoogleTasks } = require('/usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base@file+packages+nodes-base_@aws-sdk+credential-providers@3.808.0_asn1.js@5_8da18263ca0574b0db58d4fefd8173ce/node_modules/n8n-nodes-base/dist/nodes/Google/Task/GoogleTasks.node.js');
const nodeType = new GoogleTasks();
const node = {
  name: 'Google Tasks: NEXT',
  type: 'n8n-nodes-base.googleTasks',
  typeVersion: 1,
  position: [720, 200],
  parameters: {
    resource: 'task',
    operation: 'create',
    taskList: '={{ $json.resolved_task_list || ($json.params.test_run ? "NEXT_TEST" : "NEXT") }}',
    title: '={{ $json.title }}',
    dueDate: '={{ $json.params.due || "" }}',
    notes: '={{ "Event: " + $json.event_id + ($json.params.test_run ? "\\nTestRun: " + $json.params.test_run : "") + "\\nProjekt: " + ($json.params.p || "-") + "\\nPrio: " + ($json.params.prio || "M") + "\\nKontext: " + ($json.params.ctx || "-") }}'
  },
  credentials: {
    googleTasksOAuth2Api: { id: 's305fscwssjI56L7', name: 'Google Tasks account' }
  }
};
console.log(JSON.stringify(NodeHelpers.getNodeParametersIssues(nodeType.description.properties, node, nodeType.description), null, 2));
