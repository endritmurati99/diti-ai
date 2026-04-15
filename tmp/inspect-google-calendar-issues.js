const { NodeHelpers } = require('n8n-workflow');
const { GoogleCalendar } = require('/usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base@file+packages+nodes-base_@aws-sdk+credential-providers@3.808.0_asn1.js@5_8da18263ca0574b0db58d4fefd8173ce/node_modules/n8n-nodes-base/dist/nodes/Google/Calendar/GoogleCalendar.node.js');
const nodeType = new GoogleCalendar();
const node = {
  name: 'Google Calendar: Events',
  type: 'n8n-nodes-base.googleCalendar',
  typeVersion: 1,
  position: [720, 300],
  parameters: {
    resource: 'event',
    operation: 'getAll',
    calendar: { __rl: true, value: 'primary', mode: 'id' },
    returnAll: true,
    options: {
      timeMin: '={{ $json.timeMin }}',
      timeMax: '={{ $json.timeMax }}',
      singleEvents: true,
      orderBy: 'startTime'
    }
  },
  credentials: {
    googleCalendarOAuth2Api: { id: 'kF0UOYtJLVTJ0Mgf', name: 'Google Calendar account' }
  }
};
console.log(JSON.stringify(NodeHelpers.getNodeParametersIssues(nodeType.description.properties, node, nodeType.description), null, 2));
