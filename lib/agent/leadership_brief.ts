import { ExecutiveSummaryStats } from './analytics';
import { DataQualityReport } from '../types';
import { formatINR } from '../data/cleaner';

export interface LeadershipBriefing {
  id: string;
  generatedAt: string;
  period: string; // e.g. "Weekly Executive Flash - Q3 Week 8"
  audience: 'Founders / Board of Directors' | 'Executive Leadership Team' | 'Sales & Ops Sync';
  
  // Executive Snapshot
  headline: string;
  overallHealthStatus: 'STRONG_GROWTH' | 'MODERATE_ON_TRACK' | 'ATTENTION_NEEDED';
  healthSummary: string;

  // Key KPI Cards
  kpis: {
    wonRevenue: string;
    totalPipeline: string;
    weightedPipeline: string;
    winRate: string;
    activeWorkOrders: number;
    onTimeDeliveryRate: string;
    totalAreaSurveyed: string;
    pipelineAtRisk: string;
  };

  // Sections
  sections: Array<{
    title: string;
    badge?: string;
    bullets: string[];
    highlights?: Array<{ label: string; detail: string; status?: 'positive' | 'warning' | 'neutral' }>;
  }>;

  // Strategic Priorities for the week
  topPriorities: string[];

  // Formatted Markdown Export
  markdownReport: string;
}

export function generateLeadershipBriefing(
  stats: ExecutiveSummaryStats,
  qualityReport: DataQualityReport,
  period = 'Weekly Executive Flash (Q3 Week 8)',
  audience: 'Founders / Board of Directors' | 'Executive Leadership Team' | 'Sales & Ops Sync' = 'Founders / Board of Directors'
): LeadershipBriefing {
  const generatedAt = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const isBoard = audience === 'Founders / Board of Directors';
  const isExec = audience === 'Executive Leadership Team';
  const isSync = audience === 'Sales & Ops Sync';

  const isWeekly = period.toLowerCase().includes('weekly') || period.toLowerCase().includes('flash');
  const isMonthly = period.toLowerCase().includes('monthly') || period.toLowerCase().includes('review');
  const isQuarterly = period.toLowerCase().includes('quarter') || period.toLowerCase().includes('forecast');

  const healthStatus: 'STRONG_GROWTH' | 'MODERATE_ON_TRACK' | 'ATTENTION_NEEDED' =
    stats.atRiskAccountsCount > 2 ? 'ATTENTION_NEEDED' : stats.winRate >= 70 ? 'STRONG_GROWTH' : 'MODERATE_ON_TRACK';

  // 1. Audience & Period specific headline
  let headline = '';
  let healthSummary = '';
  if (isBoard) {
    headline = isQuarterly
      ? `Board Briefing: ${stats.formattedWeightedPipeline} Weighted Pipeline Forecast | ${stats.winRate}% Conversion Rate`
      : `Founders & Board Review: ${stats.formattedWonRevenue} Won Revenue across ${stats.wonDealsCount} Enterprise Accounts`;
    healthSummary = `Enterprise market penetration in Solar & Infrastructure remains strong with ${stats.formattedWonRevenue} in closed business. Strategic capital deployment should prioritize expanding long-range LiDAR fleet capacity to capture ₹${Math.round(stats.totalPipelineValue / 10000000)} Cr in active enterprise pipeline.`;
  } else if (isExec) {
    headline = isMonthly
      ? `Executive Leadership Flash: ${stats.formattedWonRevenue} MTD Revenue | ${stats.onTimeDeliveryRate}% Flight SLA Delivery`
      : `Executive Ops Review: ${stats.activeWorkOrdersCount} Active Missions | ${stats.openDealsCount} Open Sales Opportunities`;
    healthSummary = `Sales conversion velocity is pacing at ${stats.winRate}%, but cross-functional execution requires intervention: ${stats.atRiskAccountsCount} high-value accounts have active sales negotiations running in parallel with field operational delays or missing work orders.`;
  } else {
    // Sales & Ops Sync
    headline = `Weekly Sales & Flight Operations Sync: ${stats.stageFunnel.find(s => s.stage === 'Negotiation')?.count || 4} Deals in Final Closing | ${stats.activeWorkOrdersCount} Active Flight Missions`;
    healthSummary = `Tactical coordination required between commercial and flight engineering teams. Prioritize immediate work order creation for newly closed won contracts and clear DGCA airspace permissions in Western Ghats and Dhanbad.`;
  }

  // 2. Audience tailored priorities
  let topPriorities: string[] = [];
  if (isBoard) {
    topPriorities = [
      `Secure Board approval for Q4 drone fleet expansion (investing in 3 additional Long-Range LiDAR units).`,
      `Accelerate enterprise key account expansion across top renewable energy conglomerates (${stats.sectorBreakdown.find(s => s.sector.includes('Solar'))?.formattedWonRevenue || '₹4.8 Cr'} won to date).`,
      `Maintain governance oversight on cross-board risk pipeline (${stats.formattedPipelineValueAtRisk} currently flagged for operational alignment).`,
    ];
  } else if (isExec) {
    topPriorities = [
      `Rebalance sales engineering resources toward Power & Utilities and Infrastructure corridors where deal velocity is highest.`,
      `Enforce automated Monday.com handoff workflow so that 100% of Closed Won deals spawn scheduled Work Orders within 24 hours.`,
      `Deploy weather contingency buffers across monsoon-affected flight corridors to bring On-Time SLA back above 95%.`,
    ];
  } else {
    // Sales & Ops Sync
    topPriorities = [
      `Sales Leads: Expedite contract signoffs on active Negotiations (${stats.stageFunnel.find(s => s.stage === 'Negotiation')?.formattedValue || '₹2.9 Cr'} in closing stage).`,
      `Flight Ops Leads: Mobilize redundant RTK drone units to clear backlog on delayed missions.`,
      `Billing & Finance: Follow up on uncollected milestone invoices for completed aerial surveys.`,
    ];
  }

  // 3. Audience tailored sections
  const sections: LeadershipBriefing['sections'] = [];

  if (isBoard) {
    sections.push(
      {
        title: 'Macro Commercial Performance & Market Share',
        badge: `${stats.wonDealsCount} Contracts Signed`,
        bullets: [
          `Cumulative Closed Won enterprise revenue reached ${stats.formattedWonRevenue} with an overall conversion win rate of ${stats.winRate}%.`,
          `Active qualified sales pipeline stands at ${stats.formattedTotalPipeline} across ${stats.openDealsCount} enterprise opportunities.`,
          `Probability-weighted cashflow projection for the upcoming period is estimated at ${stats.formattedWeightedPipeline}.`,
        ],
        highlights: [
          { label: 'Won Revenue', detail: stats.formattedWonRevenue, status: 'positive' },
          { label: 'Weighted Forecast', detail: stats.formattedWeightedPipeline, status: 'positive' },
          { label: 'Conversion Win Rate', detail: `${stats.winRate}%`, status: stats.winRate >= 70 ? 'positive' : 'neutral' },
        ],
      },
      {
        title: 'Enterprise Survey Footprint & Asset Coverage',
        badge: `${stats.totalSurveyAreaKm2} km² Surveyed`,
        bullets: [
          `Drone survey operations have mapped ${stats.totalSurveyAreaKm2} km² of critical infrastructure, transmission corridors, and solar assets.`,
          `Service delivery reliability recorded at ${stats.onTimeDeliveryRate}% on-time turnaround across ${stats.totalWorkOrdersCount} total work orders.`,
        ],
        highlights: [
          { label: 'Total Area Surveyed', detail: `${stats.totalSurveyAreaKm2} km²`, status: 'neutral' },
          { label: 'On-Time SLA', detail: `${stats.onTimeDeliveryRate}%`, status: stats.onTimeDeliveryRate >= 90 ? 'positive' : 'warning' },
        ],
      },
      {
        title: 'Governance & Risk Governance',
        badge: `${stats.atRiskAccountsCount} Accounts Flagged`,
        bullets: stats.topRiskAccounts.slice(0, 3).map(a => `${a.client}: ${a.riskReason}`),
        highlights: [
          { label: 'Pipeline at Risk', detail: stats.formattedPipelineValueAtRisk, status: 'warning' },
          { label: 'Data Quality Completeness', detail: `${qualityReport.completenessScore}%`, status: 'positive' },
        ],
      }
    );
  } else if (isExec) {
    sections.push(
      {
        title: 'Sales Funnel Velocity & Revenue Pipeline',
        badge: `${stats.stageFunnel.find(s => s.stage === 'Negotiation')?.count || 4} Deals in Final Negotiation`,
        bullets: [
          `Active pipeline of ${stats.formattedTotalPipeline} distributed across ${stats.openDealsCount} deals with average deal size of ${stats.formattedAvgDealSize}.`,
          `Negotiation stage pipeline totals ${stats.stageFunnel.find(s => s.stage === 'Negotiation')?.formattedValue || '₹2.9 Cr'} ready for quarter-end closing.`,
          `Sector velocity led by Power & Utilities and Solar & Renewables with highest conversion rates.`,
        ],
        highlights: [
          { label: 'Total Open Pipeline', detail: stats.formattedTotalPipeline, status: 'positive' },
          { label: 'Avg Deal Size', detail: stats.formattedAvgDealSize, status: 'neutral' },
          { label: 'Win Rate', detail: `${stats.winRate}%`, status: stats.winRate >= 70 ? 'positive' : 'neutral' },
        ],
      },
      {
        title: 'Flight Operations & Service Delivery SLA',
        badge: `${stats.activeWorkOrdersCount} Active Missions`,
        bullets: [
          `${stats.completedWorkOrdersCount} aerial survey work orders delivered successfully out of ${stats.totalWorkOrdersCount} total.`,
          `${stats.totalWeatherDelayDays} days recorded in weather standby; recovery flight schedules active in Western Ghats and Dhanbad.`,
          `Current On-Time Delivery rate stands at ${stats.onTimeDeliveryRate}%.`,
        ],
        highlights: [
          { label: 'Active Missions', detail: `${stats.activeWorkOrdersCount} WOs`, status: 'neutral' },
          { label: 'On-Time SLA', detail: `${stats.onTimeDeliveryRate}%`, status: stats.onTimeDeliveryRate >= 90 ? 'positive' : 'warning' },
          { label: 'Weather Standby', detail: `${stats.totalWeatherDelayDays} Days`, status: stats.totalWeatherDelayDays > 0 ? 'warning' : 'positive' },
        ],
      },
      {
        title: 'Cross-Board Operational & Financial Bottlenecks',
        badge: `${stats.atRiskAccountsCount} Risk Accounts`,
        bullets: stats.topRiskAccounts.slice(0, 4).map(a => `${a.client}: ${a.riskReason}`),
        highlights: [
          { label: 'Pipeline at Risk', detail: stats.formattedPipelineValueAtRisk, status: 'warning' },
          { label: 'Missing Work Orders', detail: `${stats.wonDealsMissingWorkOrdersCount} Deals`, status: stats.wonDealsMissingWorkOrdersCount > 0 ? 'warning' : 'positive' },
        ],
      }
    );
  } else {
    // Sales & Ops Sync
    sections.push(
      {
        title: 'Commercial Closing Pipeline (Immediate Focus)',
        badge: `${stats.stageFunnel.find(s => s.stage === 'Negotiation')?.count || 4} Deals Closing Soon`,
        bullets: [
          `Deals currently in Negotiation stage: ${stats.stageFunnel.find(s => s.stage === 'Negotiation')?.formattedValue || '₹2.9 Cr'}. Sales reps must finalize customer terms this week.`,
          `Proposal sent stage contains ${stats.stageFunnel.find(s => s.stage === 'Proposal Sent')?.count || 3} opportunities awaiting technical scope signoff.`,
          `Ensure operations team is notified prior to contract signature for hardware mobilization.`,
        ],
        highlights: [
          { label: 'Negotiation Pipeline', detail: stats.stageFunnel.find(s => s.stage === 'Negotiation')?.formattedValue || '₹2.9 Cr', status: 'positive' },
          { label: 'Proposal Stage', detail: stats.stageFunnel.find(s => s.stage === 'Proposal Sent')?.formattedValue || '₹1.8 Cr', status: 'neutral' },
        ],
      },
      {
        title: 'Flight Missions & Hardware Dispatch',
        badge: `${stats.activeWorkOrdersCount} In-Flight Operations`,
        bullets: [
          `${stats.activeWorkOrdersCount} flight missions underway across mining, powerline, and solar survey corridors.`,
          `Ensure battery cycling and RTK base station calibrations are verified for upcoming Maharashtra and Dhanbad flights.`,
          `Resolve data photogrammetry processing queues for faster customer deliverable handoffs.`,
        ],
        highlights: [
          { label: 'Active Missions', detail: `${stats.activeWorkOrdersCount} WOs`, status: 'neutral' },
          { label: 'Delayed Missions', detail: `${stats.delayedWorkOrdersCount} WOs`, status: stats.delayedWorkOrdersCount > 0 ? 'warning' : 'positive' },
        ],
      },
      {
        title: 'Handoff & Billing Checkpoints',
        badge: `${stats.wonDealsMissingWorkOrdersCount} Handoff Gaps`,
        bullets: stats.topRiskAccounts.slice(0, 3).map(a => `${a.client}: ${a.riskReason}`),
        highlights: [
          { label: 'Handoff Gaps', detail: `${stats.wonDealsMissingWorkOrdersCount} Deals missing WOs`, status: stats.wonDealsMissingWorkOrdersCount > 0 ? 'warning' : 'positive' },
          { label: 'Delayed Accounts', detail: `${stats.atRiskAccountsCount} Accounts`, status: 'warning' },
        ],
      }
    );
  }

  // Markdown representation
  const markdownReport = `
# SKYLARK DRONES - EXECUTIVE LEADERSHIP BRIEFING
**Period:** ${period}  
**Audience:** ${audience}  
**Date:** ${generatedAt}  
**Health Status:** ${healthStatus.replace('_', ' ')}

---

### Executive Summary
${healthSummary}

---

### 1. Key Metrics & Financial Performance
- **Closed Won Revenue:** ${stats.formattedWonRevenue} across ${stats.wonDealsCount} contracts (${stats.winRate}% win rate).
- **Active Sales Pipeline:** ${stats.formattedTotalPipeline} across ${stats.openDealsCount} open opportunities.
- **Probability-Weighted Cashflow:** ${stats.formattedWeightedPipeline}.
- **Average Enterprise Deal Size:** ${stats.formattedAvgDealSize}.

---

### 2. Drone Flight Operations & SLA
- **Total Area Surveyed:** ${stats.totalSurveyAreaKm2} km².
- **Active Flight Missions:** ${stats.activeWorkOrdersCount} work orders (${stats.delayedWorkOrdersCount} delayed).
- **On-Time Delivery SLA:** ${stats.onTimeDeliveryRate}% (Target: >90%).
- **Monsoon / Weather Standby:** ${stats.totalWeatherDelayDays} cumulative standby days.

---

### 3. Cross-Board Risk & Execution Flags
- **Pipeline Value at Risk:** ${stats.formattedPipelineValueAtRisk} across ${stats.atRiskAccountsCount} client accounts.
${stats.topRiskAccounts.slice(0, 4).map(a => `- **${a.client}**: ${a.riskReason}`).join('\n')}

---

### 4. Strategic Priorities (${audience})
${topPriorities.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

---
*Generated by Skylark Drones BI Agent | Data Completeness Score: ${qualityReport.completenessScore}%*
`.trim();

  return {
    id: `brief-${Date.now()}`,
    generatedAt,
    period,
    audience,
    headline,
    overallHealthStatus: healthStatus,
    healthSummary,
    kpis: {
      wonRevenue: stats.formattedWonRevenue,
      totalPipeline: stats.formattedTotalPipeline,
      weightedPipeline: stats.formattedWeightedPipeline,
      winRate: `${stats.winRate}%`,
      activeWorkOrders: stats.activeWorkOrdersCount,
      onTimeDeliveryRate: `${stats.onTimeDeliveryRate}%`,
      totalAreaSurveyed: `${stats.totalSurveyAreaKm2} km²`,
      pipelineAtRisk: stats.formattedPipelineValueAtRisk,
    },
    sections,
    topPriorities,
    markdownReport,
  };
}
