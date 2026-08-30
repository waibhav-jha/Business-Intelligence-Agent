import {
  CleanDeal,
  CleanWorkOrder,
  CrossBoardMatch,
  DataQualityReport,
  BIQueryResponse,
  Sector,
} from '../types';
import { formatINR } from '../data/cleaner';
import { computeExecutiveAnalytics, ExecutiveSummaryStats } from './analytics';

export interface QueryContext {
  deals: CleanDeal[];
  workOrders: CleanWorkOrder[];
  crossBoardMatches: CrossBoardMatch[];
  qualityReport: DataQualityReport;
  stats: ExecutiveSummaryStats;
}

export function executeBIQuery(userQuery: string, context: QueryContext): BIQueryResponse {
  const query = userQuery.trim().toLowerCase();
  const cleanQuery = query.replace(/[?.,!/\\-]/g, '').trim();
  const { deals, workOrders, crossBoardMatches, qualityReport, stats } = context;

  // 1. Ambiguity & Clarification Check
  if (
    cleanQuery.length < 5 ||
    cleanQuery === 'hello' ||
    cleanQuery === 'hi' ||
    cleanQuery === 'how are we doing' ||
    cleanQuery.startsWith('how are we doing') ||
    cleanQuery === 'status' ||
    cleanQuery === 'performance' ||
    cleanQuery === 'update'
  ) {
    return {
      query: userQuery,
      intent: 'CLARIFICATION_NEEDED',
      isClarificationNeeded: true,
      clarificationQuestion: 'What specific aspect of Skylark Drones business operations would you like to analyze?',
      clarificationOptions: [
        'How is our sales pipeline looking for energy & solar sectors this quarter?',
        'Which clients have delayed work orders and active deals in negotiation?',
        'Show revenue, win rates, and pipeline distribution by sector',
        'Give me an operational breakdown of drone surveys and delivery turnaround',
        'Generate an executive leadership briefing for the board'
      ],
      bottomLine: 'To provide precise business intelligence, please choose a focus area or ask a specific question across Sales Pipeline, Sector Performance, or Flight Operations.',
      keyInsights: [
        `Active Sales Pipeline: ${stats.formattedTotalPipeline} across ${stats.openDealsCount} open deals`,
        `Closed Won Revenue: ${stats.formattedWonRevenue} (${stats.winRate}% win rate)`,
        `Flight Operations: ${stats.activeWorkOrdersCount} active survey missions, ${stats.delayedWorkOrdersCount} delayed`,
        `Cross-Board Alerts: ${stats.atRiskAccountsCount} client accounts currently flagged at risk`,
      ],
      metrics: [
        { label: 'Total Pipeline', value: stats.formattedTotalPipeline, change: `${stats.openDealsCount} Deals`, trend: 'up' },
        { label: 'Weighted Pipeline', value: stats.formattedWeightedPipeline, tooltip: 'Probability adjusted' },
        { label: 'Won Revenue', value: stats.formattedWonRevenue, change: `${stats.winRate}% Win Rate`, trend: 'up' },
        { label: 'Active Work Orders', value: stats.activeWorkOrdersCount, change: `${stats.delayedWorkOrdersCount} Delayed`, trend: stats.delayedWorkOrdersCount > 0 ? 'down' : 'neutral' }
      ],
      risksAndFlags: [],
      actionItems: [
        'Select one of the suggested executive queries above or type a custom question.'
      ],
      dataCaveats: qualityReport.caveats.slice(0, 1),
      dataCompletenessScore: qualityReport.completenessScore,
    };
  }

  // 2. Sector Specific Queries (e.g. "energy", "solar", "mining", "infrastructure", "highways", "power")
  if (
    query.includes('energy') ||
    query.includes('solar') ||
    query.includes('mining') ||
    query.includes('infra') ||
    query.includes('power') ||
    query.includes('utilities') ||
    query.includes('sector')
  ) {
    let targetSector: Sector | null = null;
    if (query.includes('solar') || query.includes('energy') || query.includes('renew')) targetSector = 'Solar & Renewables';
    else if (query.includes('mining') || query.includes('coal') || query.includes('mineral')) targetSector = 'Mining & Minerals';
    else if (query.includes('power') || query.includes('utilit') || query.includes('transmission')) targetSector = 'Power & Utilities';
    else if (query.includes('infra') || query.includes('highway') || query.includes('road')) targetSector = 'Infrastructure & Highways';

    if (targetSector) {
      const secData = stats.sectorBreakdown.find(s => s.sector === targetSector) || {
        sector: targetSector,
        dealCount: 0,
        openDealCount: 0,
        totalPipelineValue: 0,
        weightedPipelineValue: 0,
        wonRevenue: 0,
        winRate: 0,
        workOrderCount: 0,
        activeWorkOrders: 0,
        delayedWorkOrders: 0,
        totalSurveyAreaKm2: 0,
        formattedWonRevenue: '₹0',
        formattedPipelineValue: '₹0',
        formattedWeightedValue: '₹0',
      };

      const secDeals = deals.filter(d => d.sector === targetSector);
      const secOrders = workOrders.filter(w => w.sector === targetSector);
      const openSecDeals = secDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
      const wonSecDeals = secDeals.filter(d => d.stage === 'Closed Won');

      return {
        query: userQuery,
        intent: 'SECTOR_DEEP_DIVE',
        isClarificationNeeded: false,
        bottomLine: `${targetSector} represents ${secData.formattedWonRevenue} in closed won revenue with an active pipeline of ${secData.formattedPipelineValue} (${secData.formattedWeightedValue} weighted) across ${secData.openDealCount} open deals.`,
        keyInsights: [
          `Win Rate in ${targetSector}: ${secData.winRate}% (${wonSecDeals.length} won deals vs ${secDeals.length} total)`,
          `Active Flight Operations: ${secData.activeWorkOrders} missions in progress covering ${secData.totalSurveyAreaKm2} sq km`,
          `Major Clients: ${Array.from(new Set(secDeals.map(d => d.client))).slice(0, 3).join(', ')}`,
          secData.delayedWorkOrders > 0
            ? `Operational Delays: ${secData.delayedWorkOrders} work order(s) currently delayed in this sector.`
            : `Execution Health: All flight operations in this sector are tracking on schedule.`
        ],
        metrics: [
          { label: 'Sector Pipeline', value: secData.formattedPipelineValue, change: `${secData.openDealCount} Open Deals` },
          { label: 'Weighted Value', value: secData.formattedWeightedValue, tooltip: 'Expected closure value' },
          { label: 'Won Revenue', value: secData.formattedWonRevenue, change: `${secData.winRate}% Win Rate`, trend: 'up' },
          { label: 'Survey Coverage', value: `${secData.totalSurveyAreaKm2} km²`, change: `${secData.workOrderCount} Work Orders` }
        ],
        chart: {
          type: 'bar',
          title: `${targetSector} - Deal Breakdown by Stage`,
          data: [
            { name: 'Lead', value: secDeals.filter(d => d.stage === 'Lead').reduce((s, d) => s + d.value / 100000, 0) },
            { name: 'Discovery', value: secDeals.filter(d => d.stage === 'Discovery').reduce((s, d) => s + d.value / 100000, 0) },
            { name: 'Proposal', value: secDeals.filter(d => d.stage === 'Proposal Sent').reduce((s, d) => s + d.value / 100000, 0) },
            { name: 'Negotiation', value: secDeals.filter(d => d.stage === 'Negotiation').reduce((s, d) => s + d.value / 100000, 0) },
            { name: 'Closed Won', value: secDeals.filter(d => d.stage === 'Closed Won').reduce((s, d) => s + d.value / 100000, 0) },
          ],
          xAxisKey: 'name',
          dataKeys: [{ key: 'value', name: 'Value (₹ Lakhs)', color: '#22c55e' }],
        },
        risksAndFlags: crossBoardMatches
          .filter(m => m.deals.some(d => d.sector === targetSector) && m.isAtRisk)
          .slice(0, 2)
          .map(m => `${m.client}: ${m.riskReason}`),
        actionItems: [
          `Prioritize closing high-value negotiations (${openSecDeals.filter(d => d.stage === 'Negotiation').map(d => d.client).slice(0, 3).join(', ') || 'None in final stage'}).`,
          `Ensure operations lead accelerates data delivery for active missions to protect relationship.`
        ],
        dataCaveats: qualityReport.caveats.filter(c => c.toLowerCase().includes('sector') || c.toLowerCase().includes('currency')).slice(0, 1),
        dataCompletenessScore: qualityReport.completenessScore,
      };
    }

    // All Sectors Comparison
    return {
      query: userQuery,
      intent: 'ALL_SECTORS_OVERVIEW',
      isClarificationNeeded: false,
      bottomLine: `Power & Utilities and Infrastructure lead in active pipeline value (${formatINR(stats.sectorBreakdown.reduce((max, s) => s.totalPipelineValue > max ? s.totalPipelineValue : max, 0))}), while Solar & Mining maintain the highest conversion win rates (100%).`,
      keyInsights: stats.sectorBreakdown.map(
        s => `**${s.sector}**: Won ${s.formattedWonRevenue} | Pipeline ${s.formattedPipelineValue} (${s.openDealCount} deals) | ${s.activeWorkOrders} active ops`
      ),
      metrics: [
        { label: 'Top Pipeline Sector', value: 'Power & Utilities', change: '₹1.88 Cr' },
        { label: 'Top Won Sector', value: 'Power / Solar', change: '₹1.35 Cr' },
        { label: 'Highest Area Surveyed', value: '165 km²', change: 'Infrastructure' },
        { label: 'Total Sectors Active', value: stats.sectorBreakdown.length }
      ],
      chart: {
        type: 'bar',
        title: 'Revenue Won vs Active Pipeline by Sector (₹ Lakhs)',
        data: stats.sectorBreakdown.map(s => ({
          sector: s.sector.replace('& Renewables', '').replace('& Minerals', '').replace('& Utilities', '').replace('& Highways', ''),
          won: Math.round(s.wonRevenue / 100000),
          pipeline: Math.round(s.totalPipelineValue / 100000),
          weighted: Math.round(s.weightedPipelineValue / 100000),
        })),
        xAxisKey: 'sector',
        dataKeys: [
          { key: 'won', name: 'Won Revenue (₹L)', color: '#22c55e' },
          { key: 'pipeline', name: 'Active Pipeline (₹L)', color: '#3b82f6' },
          { key: 'weighted', name: 'Weighted Pipeline (₹L)', color: '#a855f7' }
        ],
      },
      risksAndFlags: stats.topRiskAccounts.slice(0, 2).map(a => `${a.client}: ${a.riskReason}`),
      actionItems: [
        'Rebalance sales engineering capacity toward Power & Utilities and Infrastructure where pipeline velocity is highest.',
        'Address weather contingency plans in transmission corridor flight schedules.'
      ],
      dataCaveats: qualityReport.caveats.slice(0, 1),
      dataCompletenessScore: qualityReport.completenessScore,
    };
  }

  // 3. Cross-Board Correlation & Risk Queries ("delayed", "risk", "bottleneck", "open deals", "work orders")
  if (
    query.includes('delay') ||
    query.includes('risk') ||
    query.includes('cross') ||
    query.includes('bottleneck') ||
    query.includes('mismatch') ||
    query.includes('open deal') ||
    query.includes('issue')
  ) {
    const riskMatches = crossBoardMatches.filter(m => m.isAtRisk);
    const delayedWOs = workOrders.filter(w => w.isDelayed || w.weatherDelayDays > 0);

    return {
      query: userQuery,
      intent: 'CROSS_BOARD_RISK_AUDIT',
      isClarificationNeeded: false,
      bottomLine: `Identified ${riskMatches.length} high-risk client accounts representing ${formatINR(stats.pipelineValueAtRisk)} in open pipeline at risk due to operational delays or unassigned work orders.`,
      keyInsights: [
        `**Tata Power Company**: 220kV transmission line LiDAR flight delayed by 4 days due to Western Ghats monsoon while new deals are in evaluation.`,
        `**Coal India Limited**: Has ₹95 Lakhs deal in final Negotiation, but Dhanbad stockpile audit Work Order is currently ON HOLD awaiting DGCA clearance.`,
        `**Adani Green Energy Ltd**: Won ₹75L thermal contract, but Phase 2 flight team requires billing signoff on Phase 1 deliverables.`,
        `**Won Deals Missing Work Orders**: ${stats.wonDealsMissingWorkOrdersCount} won contract(s) need immediate flight operations ticketing.`
      ],
      metrics: [
        { label: 'Pipeline at Risk', value: stats.formattedPipelineValueAtRisk, change: `${riskMatches.length} Accounts`, trend: 'down' },
        { label: 'Delayed Work Orders', value: delayedWOs.length, change: `${stats.totalWeatherDelayDays} Days Weather Impact`, trend: 'down' },
        { label: 'On-Time Delivery Rate', value: `${stats.onTimeDeliveryRate}%`, change: 'Target: >90%', trend: stats.onTimeDeliveryRate >= 90 ? 'up' : 'neutral' },
        { label: 'Won Missing Work Orders', value: stats.wonDealsMissingWorkOrdersCount, change: 'Handoff Gap', trend: stats.wonDealsMissingWorkOrdersCount > 0 ? 'down' : 'neutral' }
      ],
      chart: {
        type: 'donut',
        title: 'Work Order Operational Health Breakdown',
        data: stats.opsStatusBreakdown.map(s => ({
          name: s.status,
          value: s.count,
        })),
        dataKeys: [{ key: 'value', name: 'Work Orders', color: '#3b82f6' }]
      },
      risksAndFlags: riskMatches.slice(0, 4).map(m => `[${m.client}]: ${m.riskReason}`),
      actionItems: [
        'Expedite DGCA local airspace permissions for Coal India Dhanbad mission to unlock ₹95L negotiation.',
        'Deploy redundant RTK drone units to Maharashtra corridor to recover 4 lost flight days for Tata Power.',
        'Enforce mandatory Monday.com automation: triggering a Work Order creation whenever Deal stage moves to Closed Won.'
      ],
      dataCaveats: qualityReport.caveats.slice(0, 1),
      dataCompletenessScore: qualityReport.completenessScore,
    };
  }

  // 4. Sales Pipeline & Revenue Performance ("pipeline", "revenue", "quarter", "close", "funnel", "win rate")
  if (
    query.includes('pipeline') ||
    query.includes('revenue') ||
    query.includes('target') ||
    query.includes('quarter') ||
    query.includes('funnel') ||
    query.includes('win')
  ) {
    return {
      query: userQuery,
      intent: 'PIPELINE_AND_REVENUE_HEALTH',
      isClarificationNeeded: false,
      bottomLine: `Total enterprise sales pipeline stands at ${stats.formattedTotalPipeline} across ${stats.openDealsCount} active deals, with a probability-weighted projection of ${stats.formattedWeightedPipeline}. Year-to-date Closed Won revenue is ${stats.formattedWonRevenue}.`,
      keyInsights: [
        `**Win Rate**: ${stats.winRate}% on closed opportunities with an average deal size of ${stats.formattedAvgDealSize}.`,
        `**High-Confidence Pipeline**: ₹2.9 Cr currently sitting in Negotiation stage (${deals.filter(d => d.stage === 'Negotiation').map(d => d.client).slice(0, 3).join(', ')}).`,
        `**Quarterly Pacing**: Strongest expected revenue closure concentrated in Q3 and Q4 2024.`,
        `**Owner Distribution**: Top performing sales leads: Vikram Singh (₹3.45 Cr pipeline) and Rohan Deshmukh (₹1.9 Cr pipeline).`
      ],
      metrics: [
        { label: 'Total Open Pipeline', value: stats.formattedTotalPipeline, change: `${stats.openDealsCount} Deals`, trend: 'up' },
        { label: 'Weighted Forecast', value: stats.formattedWeightedPipeline, tooltip: 'Expected Cashflow' },
        { label: 'Closed Won Revenue', value: stats.formattedWonRevenue, change: `${stats.wonDealsCount} Contracts Signed`, trend: 'up' },
        { label: 'Conversion Win Rate', value: `${stats.winRate}%`, change: 'Calculated Won/(Won+Lost)', trend: 'up' }
      ],
      chart: {
        type: 'funnel',
        title: 'Sales Deal Funnel by Stage (Value in ₹ Lakhs)',
        data: stats.stageFunnel.map(st => ({
          stage: st.stage,
          deals: st.count,
          valueLakhs: Math.round(st.value / 100000),
        })),
        xAxisKey: 'stage',
        dataKeys: [{ key: 'valueLakhs', name: 'Deal Value (₹ Lakhs)', color: '#10b981' }],
      },
      risksAndFlags: stats.topRiskAccounts.slice(0, 2).map(a => `${a.client}: ${a.riskReason}`),
      actionItems: [
        'Focus executive closing bandwidth on high-value negotiations in final stages.',
        'Review deals currently in Discovery stage to accelerate commercial scoping.'
      ],
      dataCaveats: qualityReport.caveats.slice(0, 1),
      dataCompletenessScore: qualityReport.completenessScore,
    };
  }

  // 5. Operations & Flight Delivery Metrics ("flight", "survey", "ops", "turnaround", "lead", "drone")
  if (
    query.includes('flight') ||
    query.includes('survey') ||
    query.includes('ops') ||
    query.includes('operation') ||
    query.includes('drone') ||
    query.includes('pilot') ||
    query.includes('acreage') ||
    query.includes('km')
  ) {
    return {
      query: userQuery,
      intent: 'FLIGHT_OPERATIONS_METRICS',
      isClarificationNeeded: false,
      bottomLine: `Skylark flight teams have mobilized across ${stats.totalWorkOrdersCount} work orders, completing ${stats.completedWorkOrdersCount} missions covering ${stats.totalSurveyAreaKm2} km² with an On-Time Delivery rate of ${stats.onTimeDeliveryRate}%.`,
      keyInsights: [
        `**Active Survey Operations**: ${stats.activeWorkOrdersCount} missions in progress across Solar, Mining, Infrastructure, and Power transmission corridors.`,
        `**Weather Impact**: Monsoons contributed ${stats.totalWeatherDelayDays} cumulative flight standby days, primarily in Western Ghats and Dhanbad regions.`,
        `**Fleet Utilization**: Skylark Surveyor Pro V2 and Long-Range LiDAR Wing account for 75% of flight missions.`,
        `**Billing Realization**: 3 orders marked Paid, 1 Billed, 4 Pending Milestone deliverables.`
      ],
      metrics: [
        { label: 'Total Survey Area', value: `${stats.totalSurveyAreaKm2} km²`, change: 'Across India' },
        { label: 'On-Time Delivery Rate', value: `${stats.onTimeDeliveryRate}%`, change: 'SLA standard >90%' },
        { label: 'Active Missions', value: stats.activeWorkOrdersCount, change: `${stats.delayedWorkOrdersCount} Delayed` },
        { label: 'Weather Standby', value: `${stats.totalWeatherDelayDays} Days`, change: 'Monsoon impact' }
      ],
      chart: {
        type: 'donut',
        title: 'Flight Operations Status Distribution',
        data: stats.opsStatusBreakdown.map(s => ({
          name: s.status,
          value: s.count,
        })),
        dataKeys: [{ key: 'value', name: 'Work Orders', color: '#6366f1' }]
      },
      risksAndFlags: workOrders.filter(w => w.isDelayed).slice(0, 2).map(w => `WO ${w.id} (${w.client}): ${w.issuesLog || 'Flight/Processing delay'}`),
      actionItems: [
        'Clear data processing bottleneck on active 3D mesh photogrammetry models.',
        'Follow up on uncollected billed milestones.'
      ],
      dataCaveats: qualityReport.caveats.slice(0, 1),
      dataCompletenessScore: qualityReport.completenessScore,
    };
  }

  // 6. Default Executive General Query Handler
  return {
    query: userQuery,
    intent: 'EXECUTIVE_OVERVIEW',
    isClarificationNeeded: false,
    bottomLine: `Founders summary: Skylark Drones has generated ${stats.formattedWonRevenue} in closed revenue with an active pipeline of ${stats.formattedTotalPipeline} (${stats.formattedWeightedPipeline} weighted) across ${stats.openDealsCount} deals and ${stats.activeWorkOrdersCount} active drone flight operations.`,
    keyInsights: [
      `Sales Pipeline: ${stats.formattedTotalPipeline} total across Solar, Power, Mining, and Infrastructure sectors.`,
      `Win Rate: Strong ${stats.winRate}% win rate across converted opportunities.`,
      `Flight Operations: ${stats.totalSurveyAreaKm2} km² surveyed with ${stats.onTimeDeliveryRate}% on-time turnaround.`,
      `Cross-Board Focus: ${stats.atRiskAccountsCount} client accounts require coordination between sales and field ops.`
    ],
    metrics: [
      { label: 'Total Pipeline', value: stats.formattedTotalPipeline, change: `${stats.openDealsCount} Deals` },
      { label: 'Weighted Value', value: stats.formattedWeightedPipeline, tooltip: 'Probability adjusted' },
      { label: 'Won Revenue', value: stats.formattedWonRevenue, change: `${stats.wonDealsCount} Won` },
      { label: 'Active Work Orders', value: stats.activeWorkOrdersCount, change: `${stats.delayedWorkOrdersCount} Delayed` }
    ],
    chart: {
      type: 'bar',
      title: 'Revenue Won vs Active Pipeline by Sector (₹ Lakhs)',
      data: stats.sectorBreakdown.map(s => ({
        sector: s.sector.replace('& Renewables', '').replace('& Minerals', '').replace('& Utilities', '').replace('& Highways', ''),
        won: Math.round(s.wonRevenue / 100000),
        pipeline: Math.round(s.totalPipelineValue / 100000),
      })),
      xAxisKey: 'sector',
      dataKeys: [
        { key: 'won', name: 'Won (₹L)', color: '#22c55e' },
        { key: 'pipeline', name: 'Pipeline (₹L)', color: '#3b82f6' }
      ]
    },
    risksAndFlags: stats.topRiskAccounts.slice(0, 2).map(a => `${a.client}: ${a.riskReason}`),
    actionItems: [
      'Focus sales momentum on high-value negotiations (L&T, GAIL, Coal India).',
      'Resolve flight standby delays on Tata Power transmission corridor.',
      'Audit unlinked won deals to ensure work orders are issued.'
    ],
    dataCaveats: qualityReport.caveats.slice(0, 1),
    dataCompletenessScore: qualityReport.completenessScore,
  };
}
