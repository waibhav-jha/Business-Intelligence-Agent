import {
  CleanDeal,
  CleanWorkOrder,
  CrossBoardMatch,
  Sector,
  DealStage,
  FlightOpsStatus,
} from '../types';
import { formatINR } from '../data/cleaner';

export interface SectorAnalytics {
  sector: Sector;
  dealCount: number;
  openDealCount: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  wonRevenue: number;
  winRate: number; // percentage
  workOrderCount: number;
  activeWorkOrders: number;
  delayedWorkOrders: number;
  totalSurveyAreaKm2: number;
  formattedWonRevenue: string;
  formattedPipelineValue: string;
  formattedWeightedValue: string;
}

export interface ExecutiveSummaryStats {
  // Financial & Sales Metrics
  totalPipelineValue: number;
  formattedTotalPipeline: string;
  weightedPipelineValue: number;
  formattedWeightedPipeline: string;
  wonRevenue: number;
  formattedWonRevenue: string;
  lostRevenue: number;
  formattedLostRevenue: string;
  winRate: number; // percentage
  averageDealSize: number;
  formattedAvgDealSize: string;
  totalDealsCount: number;
  openDealsCount: number;
  wonDealsCount: number;

  // Operational & Delivery Metrics
  totalWorkOrdersCount: number;
  activeWorkOrdersCount: number;
  completedWorkOrdersCount: number;
  delayedWorkOrdersCount: number;
  onTimeDeliveryRate: number; // percentage
  totalSurveyAreaKm2: number;
  totalWeatherDelayDays: number;

  // Cross-Board Health
  atRiskAccountsCount: number;
  wonDealsMissingWorkOrdersCount: number;
  pipelineValueAtRisk: number;
  formattedPipelineValueAtRisk: string;

  // Breakdowns
  stageFunnel: Array<{ stage: DealStage; count: number; value: number; formattedValue: string }>;
  sectorBreakdown: SectorAnalytics[];
  quarterlyPacing: Array<{ quarter: string; totalValue: number; weightedValue: number; wonValue: number }>;
  opsStatusBreakdown: Array<{ status: FlightOpsStatus; count: number }>;
  topRiskAccounts: CrossBoardMatch[];
}

export function computeExecutiveAnalytics(
  deals: CleanDeal[],
  workOrders: CleanWorkOrder[],
  crossBoardMatches: CrossBoardMatch[]
): ExecutiveSummaryStats {
  // Sales Pipeline computations
  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  const lostDeals = deals.filter(d => d.stage === 'Closed Lost');
  const openDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');

  const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const lostRevenue = lostDeals.reduce((sum, d) => sum + d.value, 0);
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipelineValue = openDeals.reduce((sum, d) => sum + d.weightedValue, 0);

  const totalDecided = wonDeals.length + lostDeals.length;
  const winRate = totalDecided > 0 ? Math.round((wonDeals.length / totalDecided) * 100) : 0;
  const averageDealSize = deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / deals.length) : 0;

  // Stage funnel
  const stageOrder: DealStage[] = ['Lead', 'Discovery', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const stageFunnel = stageOrder.map(st => {
    const stageDeals = deals.filter(d => d.stage === st);
    const value = stageDeals.reduce((sum, d) => sum + d.value, 0);
    return {
      stage: st,
      count: stageDeals.length,
      value,
      formattedValue: formatINR(value),
    };
  });

  // Operational metrics
  const completedOrders = workOrders.filter(w => w.status === 'Delivered');
  const activeOrders = workOrders.filter(w => w.status !== 'Delivered' && w.status !== 'Cancelled');
  const delayedOrders = workOrders.filter(w => w.isDelayed);
  
  const totalSurveyAreaKm2 = Number(workOrders.reduce((sum, w) => sum + w.surveyAreaKm2, 0).toFixed(1));
  const totalWeatherDelayDays = workOrders.reduce((sum, w) => sum + w.weatherDelayDays, 0);

  // On-time delivery calculation
  const completedWithDeadlines = completedOrders.filter(w => w.expectedDeliveryDate && w.deliveryDate);
  const onTimeCount = completedWithDeadlines.filter(w => {
    return new Date(w.deliveryDate!).getTime() <= new Date(w.expectedDeliveryDate!).getTime();
  }).length;
  const onTimeDeliveryRate = completedWithDeadlines.length > 0 
    ? Math.round((onTimeCount / completedWithDeadlines.length) * 100) 
    : 85;

  // Sector breakdown
  const sectors: Sector[] = [
    'Solar & Renewables',
    'Mining & Minerals',
    'Power & Utilities',
    'Infrastructure & Highways',
    'Agriculture & Forestry',
    'Urban & Real Estate',
    'Oil & Gas / Pipeline',
    'Other',
  ];

  const sectorBreakdown: SectorAnalytics[] = sectors.map(sec => {
    const secDeals = deals.filter(d => d.sector === sec);
    const secOpenDeals = secDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
    const secWonDeals = secDeals.filter(d => d.stage === 'Closed Won');
    const secLostDeals = secDeals.filter(d => d.stage === 'Closed Lost');

    const pipeVal = secOpenDeals.reduce((sum, d) => sum + d.value, 0);
    const weightVal = secOpenDeals.reduce((sum, d) => sum + d.weightedValue, 0);
    const wonVal = secWonDeals.reduce((sum, d) => sum + d.value, 0);

    const secDecided = secWonDeals.length + secLostDeals.length;
    const secWinRate = secDecided > 0 ? Math.round((secWonDeals.length / secDecided) * 100) : 0;

    const secOrders = workOrders.filter(w => w.sector === sec);
    const secActive = secOrders.filter(w => w.status !== 'Delivered' && w.status !== 'Cancelled');
    const secDelayed = secOrders.filter(w => w.isDelayed);
    const secArea = Number(secOrders.reduce((sum, w) => sum + w.surveyAreaKm2, 0).toFixed(1));

    return {
      sector: sec,
      dealCount: secDeals.length,
      openDealCount: secOpenDeals.length,
      totalPipelineValue: pipeVal,
      weightedPipelineValue: weightVal,
      wonRevenue: wonVal,
      winRate: secWinRate,
      workOrderCount: secOrders.length,
      activeWorkOrders: secActive.length,
      delayedWorkOrders: secDelayed.length,
      totalSurveyAreaKm2: secArea,
      formattedWonRevenue: formatINR(wonVal),
      formattedPipelineValue: formatINR(pipeVal),
      formattedWeightedValue: formatINR(weightVal),
    };
  }).filter(s => s.dealCount > 0 || s.workOrderCount > 0);

  // Quarterly pacing
  const quarterMap = new Map<string, { total: number; weighted: number; won: number }>();
  deals.forEach(d => {
    const q = d.quarter || 'Unassigned Quarter';
    if (!quarterMap.has(q)) {
      quarterMap.set(q, { total: 0, weighted: 0, won: 0 });
    }
    const current = quarterMap.get(q)!;
    if (d.stage === 'Closed Won') {
      current.won += d.value;
    } else if (d.stage !== 'Closed Lost') {
      current.total += d.value;
      current.weighted += d.weightedValue;
    }
  });

  const quarterlyPacing = Array.from(quarterMap.entries()).map(([quarter, data]) => ({
    quarter,
    totalValue: data.total,
    weightedValue: data.weighted,
    wonValue: data.won,
  })).sort((a, b) => a.quarter.localeCompare(b.quarter));

  // Ops status distribution
  const opsStatusOrder: FlightOpsStatus[] = [
    'Scheduled',
    'In Progress',
    'Data Processing',
    'Quality Review',
    'Delivered',
    'On Hold',
    'Cancelled',
  ];
  const opsStatusBreakdown = opsStatusOrder.map(st => ({
    status: st,
    count: workOrders.filter(w => w.status === st).length,
  }));

  // Cross-board risk detection
  const allRiskAccounts = crossBoardMatches
    .filter(m => m.isAtRisk)
    .sort((a, b) => b.pipelineTotalValue - a.pipelineTotalValue || b.wonDealTotalValue - a.wonDealTotalValue);
  
  const pipelineValueAtRisk = allRiskAccounts.reduce((sum, a) => sum + a.pipelineTotalValue, 0);
  const topRiskAccounts = allRiskAccounts.slice(0, 5);

  const wonDealsMissingWorkOrdersCount = crossBoardMatches.filter(
    m => m.wonDealTotalValue >= 500000 && m.workOrders.length === 0
  ).length;

  return {
    totalPipelineValue,
    formattedTotalPipeline: formatINR(totalPipelineValue),
    weightedPipelineValue,
    formattedWeightedPipeline: formatINR(weightedPipelineValue),
    wonRevenue,
    formattedWonRevenue: formatINR(wonRevenue),
    lostRevenue,
    formattedLostRevenue: formatINR(lostRevenue),
    winRate,
    averageDealSize,
    formattedAvgDealSize: formatINR(averageDealSize),
    totalDealsCount: deals.length,
    openDealsCount: openDeals.length,
    wonDealsCount: wonDeals.length,

    totalWorkOrdersCount: workOrders.length,
    activeWorkOrdersCount: activeOrders.length,
    completedWorkOrdersCount: completedOrders.length,
    delayedWorkOrdersCount: delayedOrders.length,
    onTimeDeliveryRate,
    totalSurveyAreaKm2,
    totalWeatherDelayDays,

    atRiskAccountsCount: topRiskAccounts.length,
    wonDealsMissingWorkOrdersCount,
    pipelineValueAtRisk,
    formattedPipelineValueAtRisk: formatINR(pipelineValueAtRisk),

    stageFunnel,
    sectorBreakdown,
    quarterlyPacing,
    opsStatusBreakdown,
    topRiskAccounts,
  };
}
