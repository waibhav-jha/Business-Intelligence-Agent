import { EMBEDDED_RAW_DEALS, EMBEDDED_RAW_WORK_ORDERS } from '@/data/csv_embedded';
import {
  cleanDeals,
  cleanWorkOrders,
  buildCrossBoardMatches,
  generateDataQualityReport,
} from '@/lib/data/cleaner';
import { computeExecutiveAnalytics, ExecutiveSummaryStats } from '@/lib/agent/analytics';
import { executeBIQuery } from '@/lib/agent/query_engine';
import { generateLeadershipBriefing, LeadershipBriefing } from '@/lib/agent/leadership_brief';
import {
  CleanDeal,
  CleanWorkOrder,
  CrossBoardMatch,
  DataQualityReport,
  MondayBoardConfig,
  BIQueryResponse,
} from '@/lib/types';

export interface ClientStoreState {
  cleanDealsList: CleanDeal[];
  cleanWorkOrdersList: CleanWorkOrder[];
  crossBoardMatches: CrossBoardMatch[];
  qualityReport: DataQualityReport;
  stats: ExecutiveSummaryStats;
  mondayConfig: MondayBoardConfig;
}

let cachedClientState: ClientStoreState | null = null;

export function getClientStore(): ClientStoreState {
  if (cachedClientState) return cachedClientState;

  const { cleanDeals: cleanedDeals, issues: dealIssues } = cleanDeals(EMBEDDED_RAW_DEALS);
  const { cleanOrders: cleanedOrders, issues: woIssues } = cleanWorkOrders(EMBEDDED_RAW_WORK_ORDERS, cleanedDeals);
  const crossBoardMatches = buildCrossBoardMatches(cleanedDeals, cleanedOrders);
  const allIssues = [...dealIssues, ...woIssues];
  const qualityReport = generateDataQualityReport(cleanedDeals, cleanedOrders, allIssues);
  const stats = computeExecutiveAnalytics(cleanedDeals, cleanedOrders, crossBoardMatches);

  cachedClientState = {
    cleanDealsList: cleanedDeals,
    cleanWorkOrdersList: cleanedOrders,
    crossBoardMatches,
    qualityReport,
    stats,
    mondayConfig: {
      apiKey: '',
      dealsBoardId: '',
      workOrdersBoardId: '',
      isLive: false,
      lastSyncedAt: new Date().toISOString(),
    },
  };

  return cachedClientState;
}

export function handleClientQuery(query: string): BIQueryResponse {
  const store = getClientStore();
  return executeBIQuery(query, {
    deals: store.cleanDealsList,
    workOrders: store.cleanWorkOrdersList,
    crossBoardMatches: store.crossBoardMatches,
    qualityReport: store.qualityReport,
    stats: store.stats,
  });
}

export function handleClientBriefing(
  period: string,
  audience: 'Founders / Board of Directors' | 'Executive Leadership Team' | 'Sales & Ops Sync'
): LeadershipBriefing {
  const store = getClientStore();
  return generateLeadershipBriefing(store.stats, store.qualityReport, period, audience);
}
