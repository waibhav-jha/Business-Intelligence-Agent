#!/usr/bin/env node
/**
 * 🦅 Skylark Drones - Monday.com Model Context Protocol (MCP) Server
 * Standard JSON-RPC 2.0 stdio interface exposing Monday.com boards and BI capabilities.
 */

import { MondayClient } from '../lib/monday/client';
import { initializeStore, getStore, updateStoreData } from '../app/api/data/store';
import { executeBIQuery } from '../lib/agent/query_engine';
import { generateLeadershipBriefing } from '../lib/agent/leadership_brief';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

const MCP_SERVER_INFO = {
  name: 'skylark-monday-bi-mcp',
  version: '1.0.0',
  protocolVersion: '2024-11-05',
};

const TOOLS = [
  {
    name: 'monday_test_connection',
    description: 'Verify connection and authentication with Monday.com API v2',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'Optional Monday.com API Key. Defaults to MONDAY_API_KEY env variable.' },
      },
    },
  },
  {
    name: 'monday_list_boards',
    description: 'List accessible Monday.com boards in the workspace',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'Optional Monday.com API Key' },
      },
    },
  },
  {
    name: 'monday_sync_boards',
    description: 'Dynamically query and sync live Deals and Work Order boards into the BI Agent resilience engine',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'Monday.com API Token' },
        dealsBoardId: { type: 'string', description: 'Monday Deals / Sales Pipeline Board ID' },
        workOrdersBoardId: { type: 'string', description: 'Monday Work Order Tracker Board ID' },
      },
      required: ['dealsBoardId', 'workOrdersBoardId'],
    },
  },
  {
    name: 'monday_bi_query',
    description: 'Execute founder-level natural language business intelligence queries across Deals and Work Orders data',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Executive question (e.g. "How is our pipeline looking for energy sector this quarter?")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'monday_generate_leadership_briefing',
    description: 'Generate an executive flash briefing with financial metrics, operations SLAs, cross-board risks, and priorities',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Reporting period (e.g. "Weekly Executive Flash - Q3 Week 8")' },
        audience: { type: 'string', enum: ['Founders / Board of Directors', 'Executive Leadership Team', 'Sales & Ops Sync'] },
      },
    },
  },
  {
    name: 'monday_get_data_health',
    description: 'Inspect data completeness score, normalized currency conversions, and cross-board risk accounts',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

class MondayMcpServer {
  private client: MondayClient | null = null;

  constructor() {
    const defaultKey = process.env.MONDAY_API_KEY;
    if (defaultKey) {
      this.client = new MondayClient(defaultKey);
    }
  }

  private getClient(apiKey?: string): MondayClient {
    const key = apiKey || process.env.MONDAY_API_KEY;
    if (!key) {
      throw new Error('Monday.com API key not provided and MONDAY_API_KEY environment variable is not set');
    }
    return new MondayClient(key);
  }

  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              serverInfo: MCP_SERVER_INFO,
              capabilities: {
                tools: { listChanged: false },
                resources: {},
              },
            },
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: { tools: TOOLS },
          };

        case 'tools/call': {
          const { name, arguments: args = {} } = params || {};
          const result = await this.executeTool(name, args);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                },
              ],
            },
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: err.message || 'Internal Server Error',
        },
      };
    }
  }

  private async executeTool(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      case 'monday_test_connection': {
        const client = this.getClient(args.apiKey);
        return await client.testConnection();
      }

      case 'monday_list_boards': {
        const client = this.getClient(args.apiKey);
        return await client.getBoards();
      }

      case 'monday_sync_boards': {
        const client = this.getClient(args.apiKey);
        const { rawDeals, rawWorkOrders } = await client.syncLiveBoards(
          args.dealsBoardId,
          args.workOrdersBoardId
        );
        const store = updateStoreData(rawDeals, rawWorkOrders, true);
        return {
          success: true,
          syncedDealsCount: store.cleanDealsList.length,
          syncedWorkOrdersCount: store.cleanWorkOrdersList.length,
          totalPipelineValue: store.stats.formattedTotalPipeline,
          wonRevenue: store.stats.formattedWonRevenue,
          completenessScore: `${store.qualityReport.completenessScore}%`,
        };
      }

      case 'monday_bi_query': {
        const store = getStore();
        return executeBIQuery(args.query, {
          deals: store.cleanDealsList,
          workOrders: store.cleanWorkOrdersList,
          crossBoardMatches: store.crossBoardMatches,
          qualityReport: store.qualityReport,
          stats: store.stats,
        });
      }

      case 'monday_generate_leadership_briefing': {
        const store = getStore();
        return generateLeadershipBriefing(
          store.stats,
          store.qualityReport,
          args.period || 'Weekly Executive Flash',
          args.audience || 'Founders / Board of Directors'
        );
      }

      case 'monday_get_data_health': {
        const store = getStore();
        return {
          totalDeals: store.cleanDealsList.length,
          totalWorkOrders: store.cleanWorkOrdersList.length,
          completenessScore: `${store.qualityReport.completenessScore}%`,
          atRiskAccounts: store.stats.topRiskAccounts,
          pipelineValueAtRisk: store.stats.formattedPipelineValueAtRisk,
          caveats: store.qualityReport.caveats,
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  startStdio(): void {
    let buffer = '';

    process.stdin.on('data', async (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const request = JSON.parse(line) as JsonRpcRequest;
          const response = await this.handleRequest(request);
          process.stdout.write(JSON.stringify(response) + '\n');
        } catch (err: any) {
          const errorResponse: JsonRpcResponse = {
            jsonrpc: '2.0',
            id: 0,
            error: { code: -32700, message: `Parse error: ${err.message}` },
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      }
    });

    process.stderr.write(`[Skylark MCP] Monday.com BI Model Context Protocol Server started on stdio\n`);
  }
}

if (require.main === module || process.env.RUN_MCP_DIRECT) {
  const server = new MondayMcpServer();
  server.startStdio();
}

export { MondayMcpServer };
