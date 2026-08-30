export type Sector = 
  | 'Solar & Renewables'
  | 'Mining & Minerals'
  | 'Power & Utilities'
  | 'Infrastructure & Highways'
  | 'Agriculture & Forestry'
  | 'Urban & Real Estate'
  | 'Oil & Gas / Pipeline'
  | 'Other';

export type DealStage = 
  | 'Lead'
  | 'Discovery'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export type FlightOpsStatus = 
  | 'Scheduled'
  | 'In Progress'
  | 'Data Processing'
  | 'Quality Review'
  | 'Delivered'
  | 'On Hold'
  | 'Cancelled';

export type BillingStatus = 
  | 'Pending Milestone'
  | 'Billed'
  | 'Paid'
  | 'Overdue'
  | 'Not Billed';

export interface RawDeal {
  id: string;
  name: string;
  client: string;
  sector: string;
  stage: string;
  value: string | number;
  expectedCloseDate: string;
  probability?: string | number;
  owner: string;
  region?: string;
  notes?: string;
}

export interface CleanDeal {
  id: string;
  name: string;
  client: string;
  normalizedClient: string;
  sector: Sector;
  rawSector: string;
  stage: DealStage;
  rawStage: string;
  value: number; // Normalized numeric amount in INR
  formattedValue: string;
  expectedCloseDate: string | null; // YYYY-MM-DD
  quarter: string | null; // e.g. Q3 2024, Q4 2024
  probability: number; // 0 to 1
  weightedValue: number; // value * probability
  owner: string;
  region: string;
  dataQualityIssues: string[];
  raw: RawDeal;
}

export interface RawWorkOrder {
  id: string;
  name: string;
  client: string;
  dealRef?: string;
  sector?: string;
  status: string;
  surveyAreaKm2?: string | number;
  flightDate?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  billingStatus?: string;
  opsLead: string;
  droneModel?: string;
  weatherDelayDays?: string | number;
  issuesLog?: string;
}

export interface CleanWorkOrder {
  id: string;
  name: string;
  client: string;
  normalizedClient: string;
  dealRef: string | null;
  matchedDealId: string | null;
  sector: Sector;
  status: FlightOpsStatus;
  rawStatus: string;
  surveyAreaKm2: number;
  flightDate: string | null; // YYYY-MM-DD
  deliveryDate: string | null; // YYYY-MM-DD
  expectedDeliveryDate: string | null; // YYYY-MM-DD
  isDelayed: boolean;
  delayDays: number;
  billingStatus: BillingStatus;
  opsLead: string;
  droneModel: string;
  weatherDelayDays: number;
  issuesLog: string | null;
  dataQualityIssues: string[];
  raw: RawWorkOrder;
}

export interface CrossBoardMatch {
  client: string;
  normalizedClient: string;
  deals: CleanDeal[];
  workOrders: CleanWorkOrder[];
  wonDealTotalValue: number;
  pipelineTotalValue: number;
  hasActiveWorkOrders: boolean;
  hasDelays: boolean;
  isAtRisk: boolean;
  riskReason?: string;
}

export interface DataQualityReport {
  totalDeals: number;
  totalWorkOrders: number;
  dealsWithIssuesCount: number;
  workOrdersWithIssuesCount: number;
  completenessScore: number; // 0 to 100
  issuesList: Array<{
    type: 'MISSING_DATE' | 'CURRENCY_NORMALIZED' | 'UNMATCHED_CLIENT' | 'AMBIGUOUS_SECTOR' | 'STAGE_INFERRED' | 'MISSING_VALUE';
    board: 'Deals' | 'Work Orders';
    itemId: string;
    itemTitle: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  caveats: string[];
}

export interface MondayBoardConfig {
  apiKey: string;
  dealsBoardId: string;
  workOrdersBoardId: string;
  isLive: boolean;
  lastSyncedAt?: string;
}

export interface BIQueryResponse {
  query: string;
  intent: string;
  isClarificationNeeded: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: string[];
  
  // Executive Structured Summary
  bottomLine: string;
  keyInsights: string[];
  metrics: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    tooltip?: string;
  }>;
  
  // Visual Chart Config
  chart?: {
    type: 'bar' | 'donut' | 'line' | 'funnel' | 'area';
    title: string;
    data: Array<Record<string, any>>;
    xAxisKey?: string;
    dataKeys: Array<{ key: string; name: string; color: string }>;
  };

  // Cross-Board Risks & Highlights
  risksAndFlags: string[];
  actionItems: string[];
  
  // Data Resilience Caveats
  dataCaveats: string[];
  dataCompletenessScore: number;
}
