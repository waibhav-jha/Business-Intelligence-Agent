import { RAW_DEALS_SAMPLE, RAW_WORK_ORDERS_SAMPLE } from '@/data/datasets';
import { loadCsvDatasets } from '@/lib/data/csv_loader';
import {
  cleanDeals,
  cleanWorkOrders,
  buildCrossBoardMatches,
  generateDataQualityReport,
} from '@/lib/data/cleaner';
import { computeExecutiveAnalytics, ExecutiveSummaryStats } from '@/lib/agent/analytics';
import {
  RawDeal,
  CleanDeal,
  RawWorkOrder,
  CleanWorkOrder,
  CrossBoardMatch,
  DataQualityReport,
  MondayBoardConfig,
} from '@/lib/types';

interface GlobalStore {
  rawDeals: RawDeal[];
  rawWorkOrders: RawWorkOrder[];
  cleanDealsList: CleanDeal[];
  cleanWorkOrdersList: CleanWorkOrder[];
  crossBoardMatches: CrossBoardMatch[];
  qualityReport: DataQualityReport;
  stats: ExecutiveSummaryStats;
  mondayConfig: MondayBoardConfig;
}

// Global in-memory singleton
let store: GlobalStore | null = null;

export function initializeStore(forceRefresh = false): GlobalStore {
  if (store && !forceRefresh) {
    return store;
  }

  let rawDeals: RawDeal[] = [];
  let rawWorkOrders: RawWorkOrder[] = [];

  try {
    const csvData = loadCsvDatasets();
    if (csvData.rawDeals.length > 0 && csvData.rawWorkOrders.length > 0) {
      rawDeals = csvData.rawDeals;
      rawWorkOrders = csvData.rawWorkOrders;
    } else {
      rawDeals = [...RAW_DEALS_SAMPLE];
      rawWorkOrders = [...RAW_WORK_ORDERS_SAMPLE];
    }
  } catch (err) {
    rawDeals = [...RAW_DEALS_SAMPLE];
    rawWorkOrders = [...RAW_WORK_ORDERS_SAMPLE];
  }

  const { cleanDeals: cleanedDeals, issues: dealIssues } = cleanDeals(rawDeals);
  const { cleanOrders: cleanedOrders, issues: woIssues } = cleanWorkOrders(rawWorkOrders, cleanedDeals);
  const crossBoardMatches = buildCrossBoardMatches(cleanedDeals, cleanedOrders);
  const allIssues = [...dealIssues, ...woIssues];
  const qualityReport = generateDataQualityReport(cleanedDeals, cleanedOrders, allIssues);
  const stats = computeExecutiveAnalytics(cleanedDeals, cleanedOrders, crossBoardMatches);

  store = {
    rawDeals,
    rawWorkOrders,
    cleanDealsList: cleanedDeals,
    cleanWorkOrdersList: cleanedOrders,
    crossBoardMatches,
    qualityReport,
    stats,
    mondayConfig: {
      apiKey: process.env.MONDAY_API_KEY || '',
      dealsBoardId: process.env.MONDAY_DEALS_BOARD_ID || '',
      workOrdersBoardId: process.env.MONDAY_WORK_ORDERS_BOARD_ID || '',
      isLive: false,
      lastSyncedAt: new Date().toISOString(),
    },
  };

  return store;
}

export function getStore(): GlobalStore {
  if (!store) {
    return initializeStore();
  }
  return store;
}

export function updateStoreData(
  rawDeals: RawDeal[],
  rawWorkOrders: RawWorkOrder[],
  isLive = true
): GlobalStore {
  const { cleanDeals: cleanedDeals, issues: dealIssues } = cleanDeals(rawDeals);
  const { cleanOrders: cleanedOrders, issues: woIssues } = cleanWorkOrders(rawWorkOrders, cleanedDeals);
  const crossBoardMatches = buildCrossBoardMatches(cleanedDeals, cleanedOrders);
  const allIssues = [...dealIssues, ...woIssues];
  const qualityReport = generateDataQualityReport(cleanedDeals, cleanedOrders, allIssues);
  const stats = computeExecutiveAnalytics(cleanedDeals, cleanedOrders, crossBoardMatches);

  const prevConfig = store ? store.mondayConfig : {
    apiKey: '',
    dealsBoardId: '',
    workOrdersBoardId: '',
    isLive: false,
  };

  store = {
    rawDeals,
    rawWorkOrders,
    cleanDealsList: cleanedDeals,
    cleanWorkOrdersList: cleanedOrders,
    crossBoardMatches,
    qualityReport,
    stats,
    mondayConfig: {
      ...prevConfig,
      isLive,
      lastSyncedAt: new Date().toISOString(),
    },
  };

  return store;
}

export function setMondayConfig(config: Partial<MondayBoardConfig>): MondayBoardConfig {
  const current = getStore();
  current.mondayConfig = {
    ...current.mondayConfig,
    ...config,
  };
  return current.mondayConfig;
}
