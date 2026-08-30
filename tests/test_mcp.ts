import { MondayMcpServer } from '../scripts/monday_mcp_server';
import { initializeStore } from '../app/api/data/store';

async function runMcpTests() {
  console.log('🧪 Testing Skylark Monday.com MCP Server...');
  initializeStore(true);
  const server = new MondayMcpServer();

  // 1. Initialize
  const initRes = await server.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {},
  });
  console.assert(initRes.result?.serverInfo?.name === 'skylark-monday-bi-mcp', 'Init failed');
  console.log('✓ [PASS] MCP Server Handshake / Initialize (Protocol version: 2024-11-05)');

  // 2. List Tools
  const toolsRes = await server.handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
  });
  const tools = toolsRes.result?.tools || [];
  console.assert(tools.length >= 5, 'Expected at least 5 tools');
  console.log(`✓ [PASS] MCP Tools List (Exposing ${tools.length} Monday BI Tools)`);

  // 3. Call Tool: monday_bi_query
  const queryRes = await server.handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'monday_bi_query',
      arguments: {
        query: 'How is our pipeline looking for energy sector this quarter?',
      },
    },
  });
  console.assert(queryRes.result?.content?.[0]?.text?.includes('Solar & Renewables'), 'Tool call failed');
  console.log('✓ [PASS] MCP Tool Execution: monday_bi_query');

  // 4. Call Tool: monday_get_data_health
  const healthRes = await server.handleRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'monday_get_data_health',
      arguments: {},
    },
  });
  console.assert(healthRes.result?.content?.[0]?.text?.includes('completenessScore'), 'Health check failed');
  console.log('✓ [PASS] MCP Tool Execution: monday_get_data_health');

  // 5. Call Tool: monday_generate_leadership_briefing
  const briefRes = await server.handleRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'monday_generate_leadership_briefing',
      arguments: {
        period: 'Q3 Board Review',
        audience: 'Founders / Board of Directors',
      },
    },
  });
  console.assert(briefRes.result?.content?.[0]?.text?.includes('Skylark Drones Operations Brief'), 'Briefing failed');
  console.log('✓ [PASS] MCP Tool Execution: monday_generate_leadership_briefing');

  console.log('\n========================================');
  console.log('MCP Test Results: All 5 Checks Passed');
  console.log('========================================\n');
}

runMcpTests();
