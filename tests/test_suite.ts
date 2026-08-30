import {
  normalizeCurrency,
  normalizeDate,
  normalizeSector,
  normalizeDealStage,
  isClientMatch,
  cleanDeals,
  cleanWorkOrders,
  buildCrossBoardMatches,
} from '../lib/data/cleaner';
import { computeExecutiveAnalytics } from '../lib/agent/analytics';
import { executeBIQuery } from '../lib/agent/query_engine';
import { RAW_DEALS_SAMPLE, RAW_WORK_ORDERS_SAMPLE } from '../data/datasets';
import { loadCsvDatasets } from '../lib/data/csv_loader';

async function runTests() {
  console.log('🧪 Starting Skylark Drones BI Agent Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Currency Normalization Tests
  console.log('1. Currency & Numeric Resilience:');
  assert(normalizeCurrency('₹75L').amount === 7500000, 'Parse Lakhs notation "₹75L" -> 7,500,000');
  assert(normalizeCurrency('1.2 Cr').amount === 12000000, 'Parse Crores notation "1.2 Cr" -> 12,000,000');
  assert(normalizeCurrency('₹95 Lakhs').amount === 9500000, 'Parse "₹95 Lakhs" -> 9,500,000');
  assert(normalizeCurrency('$50,000').amount === 4200000, 'Convert USD "$50,000" to INR (84/USD) -> 4,200,000');
  assert(normalizeCurrency('').amount === 0, 'Handle empty currency -> 0');

  // 2. Date Normalization Tests
  console.log('\n2. Date Normalization Resilience:');
  assert(normalizeDate('2024-08-15').dateStr === '2024-08-15', 'Parse ISO date "2024-08-15"');
  assert(normalizeDate('15/07/2024').dateStr === '2024-07-15', 'Parse DD/MM/YYYY date "15/07/2024" -> "2024-07-15"');
  assert(normalizeDate('2024-08-15').quarter === 'Q3 2024', 'Compute correct Quarter for August -> "Q3 2024"');
  assert(normalizeDate('tbd').dateStr === null, 'Handle "TBD" date gracefully -> null');

  // 3. Fuzzy Client Match Tests
  console.log('\n3. Fuzzy Entity Resolution:');
  assert(isClientMatch('Adani Green Energy Ltd', 'Adani Green'), 'Match "Adani Green Energy Ltd" <-> "Adani Green"');
  assert(isClientMatch('Tata Power Company', 'Tata Power Ltd'), 'Match "Tata Power Company" <-> "Tata Power Ltd"');
  assert(isClientMatch('Larsen & Toubro Infra', 'L&T Construction'), 'Match "Larsen & Toubro Infra" <-> "L&T Construction"');

  // 4. Sector Normalization Tests
  console.log('\n4. Sector Normalization:');
  assert(normalizeSector('Renewables / Wind').sector === 'Solar & Renewables', 'Map "Renewables / Wind" -> Solar & Renewables');
  assert(normalizeSector('Highway / Infra').sector === 'Infrastructure & Highways', 'Map "Highway / Infra" -> Infrastructure & Highways');
  assert(normalizeSector('Power / Discom').sector === 'Power & Utilities', 'Map "Power / Discom" -> Power & Utilities');

  // 5. Full Dataset Analytics & Cross-Board Joins
  console.log('\n5. End-to-End Analytics & Cross-Board Joins:');
  const { cleanDeals: cDeals } = cleanDeals(RAW_DEALS_SAMPLE);
  const { cleanOrders: cOrders } = cleanWorkOrders(RAW_WORK_ORDERS_SAMPLE, cDeals);
  const matches = buildCrossBoardMatches(cDeals, cOrders);
  const stats = computeExecutiveAnalytics(cDeals, cOrders, matches);

  assert(cDeals.length === RAW_DEALS_SAMPLE.length, `Cleaned ${cDeals.length} Deals successfully`);
  assert(cOrders.length === RAW_WORK_ORDERS_SAMPLE.length, `Cleaned ${cOrders.length} Work Orders successfully`);
  assert(stats.totalPipelineValue > 0, `Total Pipeline calculated: ${stats.formattedTotalPipeline}`);
  assert(stats.wonRevenue > 0, `Won Revenue calculated: ${stats.formattedWonRevenue}`);
  assert(stats.winRate > 0 && stats.winRate <= 100, `Win Rate calculated: ${stats.winRate}%`);
  assert(stats.atRiskAccountsCount > 0, `Detected ${stats.atRiskAccountsCount} cross-board risk accounts`);

  // 6. Query Engine Verification
  console.log('\n6. Natural Language Query Engine:');
  const energyQuery = executeBIQuery("How's our pipeline looking for energy sector this quarter?", {
    deals: cDeals,
    workOrders: cOrders,
    crossBoardMatches: matches,
    qualityReport: { totalDeals: cDeals.length, totalWorkOrders: cOrders.length, dealsWithIssuesCount: 0, workOrdersWithIssuesCount: 0, completenessScore: 94, issuesList: [], caveats: [] },
    stats,
  });
  assert(energyQuery.intent === 'SECTOR_DEEP_DIVE', 'Identified sector deep dive intent');
  assert(energyQuery.metrics.length > 0, 'Returned structured KPI metrics');

  const riskQuery = executeBIQuery("Which clients have delayed work orders and open deals in negotiation?", {
    deals: cDeals,
    workOrders: cOrders,
    crossBoardMatches: matches,
    qualityReport: { totalDeals: cDeals.length, totalWorkOrders: cOrders.length, dealsWithIssuesCount: 0, workOrdersWithIssuesCount: 0, completenessScore: 94, issuesList: [], caveats: [] },
    stats,
  });
  assert(riskQuery.intent === 'CROSS_BOARD_RISK_AUDIT', 'Identified cross-board risk intent');

  const ambQuery = executeBIQuery("How are we doing?", {
    deals: cDeals,
    workOrders: cOrders,
    crossBoardMatches: matches,
    qualityReport: { totalDeals: cDeals.length, totalWorkOrders: cOrders.length, dealsWithIssuesCount: 0, workOrdersWithIssuesCount: 0, completenessScore: 94, issuesList: [], caveats: [] },
    stats,
  });
  assert(ambQuery.isClarificationNeeded === true, 'Triggered clarification for ambiguous query');

  // 7. Real Assignment CSV Ingestion & Processing
  console.log('\n7. Real Assignment CSV Ingestion & Analytics:');
  const { rawDeals: csvDeals, rawWorkOrders: csvOrders } = loadCsvDatasets();
  assert(csvDeals.length >= 100, `Parsed ${csvDeals.length} deals from Deal_funnel_Data.csv`);
  assert(csvOrders.length >= 50, `Parsed ${csvOrders.length} work orders from Work_Order_Tracker_Data.csv`);

  const { cleanDeals: cCsvDeals } = cleanDeals(csvDeals);
  const { cleanOrders: cCsvOrders } = cleanWorkOrders(csvOrders, cCsvDeals);
  const csvMatches = buildCrossBoardMatches(cCsvDeals, cCsvOrders);
  const csvStats = computeExecutiveAnalytics(cCsvDeals, cCsvOrders, csvMatches);

  assert(csvStats.totalPipelineValue > 0, `CSV Pipeline Value computed: ${csvStats.formattedTotalPipeline}`);
  assert(csvStats.wonRevenue > 0, `CSV Won Revenue computed: ${csvStats.formattedWonRevenue}`);
  assert(csvMatches.length > 0, `Created ${csvMatches.length} cross-board client entity matches`);
  assert(csvStats.atRiskAccountsCount > 0, `Identified ${csvStats.atRiskAccountsCount} cross-board risk accounts`);

  // 8. Model Context Protocol (MCP) Verification
  console.log('\n8. Model Context Protocol (MCP) Server:');
  const { MondayMcpServer } = await import('../scripts/monday_mcp_server');
  const mcpServer = new MondayMcpServer();
  const initRes = await mcpServer.handleRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  assert(initRes.result?.serverInfo?.name === 'skylark-monday-bi-mcp', 'MCP Server Initialized successfully');

  const toolsRes = await mcpServer.handleRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert(toolsRes.result?.tools?.length >= 5, `MCP Server exposes ${toolsRes.result?.tools?.length} BI tools`);

  const toolCallRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'monday_bi_query', arguments: { query: 'energy sector' } },
  });
  assert(toolCallRes.result?.content?.[0]?.text?.length > 0, 'MCP Tool Execution: monday_bi_query returned structured response');

  console.log('\n========================================');
  console.log(`Test Results: ${passed} Passed | ${failed} Failed`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
