import {
  RawDeal,
  CleanDeal,
  RawWorkOrder,
  CleanWorkOrder,
  Sector,
  DealStage,
  FlightOpsStatus,
  BillingStatus,
  DataQualityReport,
  CrossBoardMatch,
} from '../types';

/**
 * Currency and Number normalizer.
 * Handles Indian formats (Lakhs, Crores), USD ($), commas, decimals, and plain strings.
 */
export function normalizeCurrency(val: string | number | undefined | null): {
  amount: number;
  formatted: string;
  issue?: string;
} {
  if (val === undefined || val === null || val === '') {
    return { amount: 0, formatted: '₹0', issue: 'Missing deal value (defaulted to 0)' };
  }

  if (typeof val === 'number') {
    return {
      amount: Math.round(val),
      formatted: formatINR(val),
    };
  }

  const rawStr = String(val).trim();
  const cleaned = rawStr.replace(/,/g, '').toLowerCase();

  // Check for Crores (Cr / Crore)
  const crMatch = cleaned.match(/([\d.]+)\s*(?:cr|crore|crores)/i);
  if (crMatch) {
    const num = parseFloat(crMatch[1]) * 10000000;
    return {
      amount: Math.round(num),
      formatted: formatINR(num),
      issue: rawStr.includes('Cr') ? undefined : `Parsed "${rawStr}" as Crores`,
    };
  }

  // Check for Lakhs (L / Lac / Lakh / Lakhs)
  const lMatch = cleaned.match(/([\d.]+)\s*(?:l|lac|lakh|lakhs)/i);
  if (lMatch) {
    const num = parseFloat(lMatch[1]) * 100000;
    return {
      amount: Math.round(num),
      formatted: formatINR(num),
      issue: rawStr.includes('L') ? undefined : `Parsed "${rawStr}" as Lakhs`,
    };
  }

  // Check for Thousands (k / thousand)
  const kMatch = cleaned.match(/([\d.]+)\s*(?:k|thousand)/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1]) * 1000;
    return {
      amount: Math.round(num),
      formatted: formatINR(num),
    };
  }

  // Check for USD ($) -> convert to INR at standard 1 USD ~ 84 INR
  const usdMatch = cleaned.match(/\$\s*([\d.]+)/) || cleaned.match(/([\d.]+)\s*usd/);
  if (usdMatch) {
    const usdNum = parseFloat(usdMatch[1]);
    const inrNum = usdNum * 84;
    return {
      amount: Math.round(inrNum),
      formatted: formatINR(inrNum),
      issue: `Converted USD ($${usdNum.toLocaleString()}) to INR at ₹84/USD`,
    };
  }

  // Pure numeric extraction
  const numOnly = cleaned.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numOnly);
  if (!isNaN(parsed)) {
    return {
      amount: Math.round(parsed),
      formatted: formatINR(parsed),
    };
  }

  return {
    amount: 0,
    formatted: '₹0',
    issue: `Unparseable value "${rawStr}" defaulted to ₹0`,
  };
}

/**
 * Format numbers into standard readable INR format with Cr/Lakh suffixes.
 */
export function formatINR(val: number): string {
  if (val >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
  }
  if (val >= 100000) {
    const l = val / 100000;
    return `₹${l.toFixed(l % 1 === 0 ? 0 : 1)} Lakh`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(0)}k`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

/**
 * Robust date normalizer. Handles ISO, DD/MM/YYYY, MM/DD/YYYY, text dates, Excel serials.
 */
export function normalizeDate(val: string | number | undefined | null): {
  dateStr: string | null;
  quarter: string | null;
  issue?: string;
} {
  if (!val || String(val).trim() === '' || String(val).toLowerCase() === 'tbd' || String(val).toLowerCase() === 'null') {
    return { dateStr: null, quarter: null, issue: 'Missing date value' };
  }

  const str = String(val).trim();

  // Check Excel serial number (e.g. 45589)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const date = new Date((serial - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const iso = date.toISOString().split('T')[0];
      return { dateStr: iso, quarter: getQuarter(date) };
    }
  }

  // Check ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return { dateStr: str, quarter: getQuarter(d) };
    }
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    // If month > 12, swap (handles MM/DD/YYYY)
    if (month > 12 && day <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      return {
        dateStr: iso,
        quarter: getQuarter(d),
        issue: str !== iso ? `Standardized date format "${str}" to ${iso}` : undefined,
      };
    }
  }

  // Try standard Date parsing for "24 Oct 2024", "October 2024", etc.
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
    const iso = parsed.toISOString().split('T')[0];
    return {
      dateStr: iso,
      quarter: getQuarter(parsed),
      issue: `Parsed text date "${str}" to ${iso}`,
    };
  }

  return { dateStr: null, quarter: null, issue: `Unparseable date "${str}"` };
}

function getQuarter(date: Date): string {
  const month = date.getMonth(); // 0 to 11
  const year = date.getFullYear();
  const q = Math.floor(month / 3) + 1;
  return `Q${q} ${year}`;
}

/**
 * Standardize Client Name for fuzzy cross-board correlation.
 */
export function normalizeClientName(name: string): string {
  if (!name) return 'Unknown Client';
  let cleaned = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(pvt|ltd|limited|private|corp|corporation|inc|technologies|solutions|group|energy|power|drones|infra|infrastructure|enterprises|systems|company)\b/gi, '')
    .replace(/[^a-z0-9]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Expand common enterprise acronyms for robust cross-board matching
  if (cleaned.includes('l and t') || cleaned.includes('l t') || cleaned.includes('lt')) {
    cleaned = cleaned.replace(/\b(l and t|l t|lt)\b/g, 'larsen toubro');
  }
  if (cleaned.includes('nhai')) {
    cleaned = cleaned.replace(/\bnhai\b/g, 'national highways authority');
  }
  if (cleaned.includes('ntpc')) {
    cleaned = cleaned.replace(/\bntpc\b/g, 'national thermal power');
  }
  if (cleaned.includes('gail')) {
    cleaned = cleaned.replace(/\bgail\b/g, 'gas authority india');
  }
  if (cleaned.includes('bhel')) {
    cleaned = cleaned.replace(/\bbhel\b/g, 'bharat heavy electricals');
  }

  return cleaned.trim();
}

/**
 * Fuzzy matching between two client names.
 */
export function isClientMatch(client1: string, client2: string): boolean {
  const n1 = normalizeClientName(client1);
  const n2 = normalizeClientName(client2);

  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Token similarity
  const tokens1 = n1.split(' ').filter(t => t.length > 2);
  const tokens2 = n2.split(' ').filter(t => t.length > 2);
  const common = tokens1.filter(t => tokens2.includes(t));

  return common.length > 0 && (common.length >= Math.min(tokens1.length, tokens2.length) * 0.6);
}

/**
 * Sector Normalizer.
 */
export function normalizeSector(sectorStr: string | undefined | null): {
  sector: Sector;
  issue?: string;
} {
  if (!sectorStr || sectorStr.trim() === '') {
    return { sector: 'Other', issue: 'Missing sector information' };
  }

  const s = sectorStr.toLowerCase();

  if (s.includes('solar') || s.includes('renew') || s.includes('pv') || s.includes('wind') || s.includes('green energy')) {
    return { sector: 'Solar & Renewables' };
  }
  if (s.includes('min') || s.includes('coal') || s.includes('iron') || s.includes('quarry') || s.includes('bauxite')) {
    return { sector: 'Mining & Minerals' };
  }
  if (s.includes('power') || s.includes('utilit') || s.includes('transmiss') || s.includes('discom') || s.includes('substation') || s.includes('grid')) {
    return { sector: 'Power & Utilities' };
  }
  if (s.includes('infra') || s.includes('highway') || s.includes('road') || s.includes('rail') || s.includes('bridge') || s.includes('nhai') || s.includes('construction')) {
    return { sector: 'Infrastructure & Highways' };
  }
  if (s.includes('agri') || s.includes('crop') || s.includes('forest') || s.includes('plantation') || s.includes('farm')) {
    return { sector: 'Agriculture & Forestry' };
  }
  if (s.includes('urban') || s.includes('real estate') || s.includes('city') || s.includes('property') || s.includes('gis')) {
    return { sector: 'Urban & Real Estate' };
  }
  if (s.includes('oil') || s.includes('gas') || s.includes('pipeline') || s.includes('refinery')) {
    return { sector: 'Oil & Gas / Pipeline' };
  }

  return { sector: 'Other', issue: `Unclassified sector "${sectorStr}" mapped to Other` };
}

/**
 * Deal Stage Normalizer & Probability assignment.
 */
export function normalizeDealStage(stageStr: string | undefined | null): {
  stage: DealStage;
  probability: number;
  issue?: string;
} {
  if (!stageStr || stageStr.trim() === '') {
    return { stage: 'Lead', probability: 0.1, issue: 'Missing stage defaulted to Lead (10%)' };
  }

  const s = stageStr.toLowerCase().trim();

  if (
    s.includes('won') ||
    s.includes('g. project won') ||
    s.includes('h. work order received') ||
    s.includes('project completed') ||
    s.includes('j. invoice sent') ||
    s.includes('k. amount accrued') ||
    s.includes('signed') ||
    s.includes('po received') ||
    s.includes('contracted') ||
    s.includes('closed won') ||
    s.includes('closed-won')
  ) {
    return { stage: 'Closed Won', probability: 1.0 };
  }
  if (
    s.includes('lost') ||
    s.includes('l. project lost') ||
    s.includes('dropped') ||
    s.includes('dead') ||
    s.includes('not relevant') ||
    s.includes('cancelled') ||
    s.includes('closed lost')
  ) {
    return { stage: 'Closed Lost', probability: 0.0 };
  }
  if (s.includes('f. negotiation') || s.includes('negotiat') || s.includes('commercial') || s.includes('final') || s.includes('legal')) {
    return { stage: 'Negotiation', probability: 0.75 };
  }
  if (s.includes('e. proposal') || s.includes('proposal') || s.includes('rfp') || s.includes('quote') || s.includes('submitted')) {
    return { stage: 'Proposal Sent', probability: 0.5 };
  }
  if (
    s.includes('b. sales qualified') ||
    s.includes('c. demo done') ||
    s.includes('d. feasibility') ||
    s.includes('i. poc') ||
    s.includes('m. projects on hold') ||
    s.includes('discover') ||
    s.includes('demo') ||
    s.includes('scoping') ||
    s.includes('meeting') ||
    s.includes('qualified')
  ) {
    return { stage: 'Discovery', probability: 0.25 };
  }
  if (s.includes('a. lead') || s.includes('lead') || s.includes('prospect') || s.includes('inbound') || s.includes('outreach')) {
    return { stage: 'Lead', probability: 0.1 };
  }

  return { stage: 'Discovery', probability: 0.25, issue: `Unknown stage "${stageStr}" mapped to Discovery` };
}

/**
 * Flight Ops Status Normalizer.
 */
export function normalizeOpsStatus(statusStr: string | undefined | null): {
  status: FlightOpsStatus;
  issue?: string;
} {
  if (!statusStr || statusStr.trim() === '') {
    return { status: 'Scheduled', issue: 'Missing ops status defaulted to Scheduled' };
  }

  const s = statusStr.toLowerCase().trim();

  if (s.includes('deliver') || s.includes('completed') || s.includes('done') || s.includes('handed over')) {
    return { status: 'Delivered' };
  }
  if (s.includes('quality') || s.includes('review') || s.includes('qa') || s.includes('qc') || s.includes('inspection')) {
    return { status: 'Quality Review' };
  }
  if (s.includes('process') || s.includes('ortho') || s.includes('photogrammetry') || s.includes('3d model') || s.includes('stitching')) {
    return { status: 'Data Processing' };
  }
  if (s.includes('progress') || s.includes('flying') || s.includes('field') || s.includes('surveying') || s.includes('active')) {
    return { status: 'In Progress' };
  }
  if (s.includes('hold') || s.includes('paused') || s.includes('blocked') || s.includes('standby')) {
    return { status: 'On Hold' };
  }
  if (s.includes('cancel') || s.includes('abort') || s.includes('dropped')) {
    return { status: 'Cancelled' };
  }
  if (s.includes('schedul') || s.includes('planned') || s.includes('upcoming') || s.includes('assigned')) {
    return { status: 'Scheduled' };
  }

  return { status: 'Scheduled', issue: `Unknown ops status "${statusStr}" mapped to Scheduled` };
}

/**
 * Clean & Normalize Deals dataset.
 */
export function cleanDeals(rawDeals: RawDeal[]): {
  cleanDeals: CleanDeal[];
  issues: DataQualityReport['issuesList'];
} {
  const issues: DataQualityReport['issuesList'] = [];

  const cleaned: CleanDeal[] = rawDeals.map((raw, idx) => {
    const itemIssues: string[] = [];
    const id = raw.id || `deal-${idx + 1}`;
    const name = raw.name || `Deal ${idx + 1}`;
    const client = raw.client || 'Unknown Client';

    if (!raw.client) {
      itemIssues.push('Missing client name');
      issues.push({
        type: 'MISSING_VALUE',
        board: 'Deals',
        itemId: id,
        itemTitle: name,
        description: 'Missing client name',
        severity: 'high',
      });
    }

    const { amount, formatted, issue: valIssue } = normalizeCurrency(raw.value);
    if (valIssue) {
      itemIssues.push(valIssue);
      issues.push({
        type: 'CURRENCY_NORMALIZED',
        board: 'Deals',
        itemId: id,
        itemTitle: name,
        description: valIssue,
        severity: 'low',
      });
    }

    const { dateStr, quarter, issue: dateIssue } = normalizeDate(raw.expectedCloseDate);
    if (dateIssue) {
      itemIssues.push(dateIssue);
      issues.push({
        type: 'MISSING_DATE',
        board: 'Deals',
        itemId: id,
        itemTitle: name,
        description: dateIssue,
        severity: dateStr ? 'low' : 'medium',
      });
    }

    const { sector, issue: sectorIssue } = normalizeSector(raw.sector);
    if (sectorIssue) {
      itemIssues.push(sectorIssue);
      issues.push({
        type: 'AMBIGUOUS_SECTOR',
        board: 'Deals',
        itemId: id,
        itemTitle: name,
        description: sectorIssue,
        severity: 'low',
      });
    }

    const { stage, probability: defaultProb, issue: stageIssue } = normalizeDealStage(raw.stage);
    if (stageIssue) {
      itemIssues.push(stageIssue);
      issues.push({
        type: 'STAGE_INFERRED',
        board: 'Deals',
        itemId: id,
        itemTitle: name,
        description: stageIssue,
        severity: 'low',
      });
    }

    let prob = isNaN(defaultProb) ? 0.25 : defaultProb;
    if (raw.probability !== undefined && raw.probability !== null && raw.probability !== '') {
      const pStr = String(raw.probability).toLowerCase().trim();
      if (pStr === 'high') prob = 0.8;
      else if (pStr === 'medium') prob = 0.5;
      else if (pStr === 'low') prob = 0.2;
      else {
        const pNum = parseFloat(pStr.replace('%', ''));
        if (!isNaN(pNum)) {
          prob = pNum > 1 ? pNum / 100 : pNum;
        }
      }
    }

    if (isNaN(prob)) prob = 0.25;
    const safeAmount = isNaN(amount) ? 0 : amount;
    const weightedValue = Math.round(safeAmount * prob);

    return {
      id,
      name,
      client,
      normalizedClient: normalizeClientName(client),
      sector,
      rawSector: raw.sector || '',
      stage,
      rawStage: raw.stage || '',
      value: amount,
      formattedValue: formatted,
      expectedCloseDate: dateStr,
      quarter,
      probability: prob,
      weightedValue,
      owner: raw.owner || 'Unassigned',
      region: raw.region || 'National',
      dataQualityIssues: itemIssues,
      raw,
    };
  });

  return { cleanDeals: cleaned, issues };
}

/**
 * Clean & Normalize Work Orders dataset.
 */
export function cleanWorkOrders(
  rawOrders: RawWorkOrder[],
  cleanDealsList: CleanDeal[] = []
): {
  cleanOrders: CleanWorkOrder[];
  issues: DataQualityReport['issuesList'];
} {
  const issues: DataQualityReport['issuesList'] = [];

  const cleaned: CleanWorkOrder[] = rawOrders.map((raw, idx) => {
    const itemIssues: string[] = [];
    const id = raw.id || `wo-${idx + 1}`;
    const name = raw.name || `Work Order ${idx + 1}`;
    const client = raw.client || 'Unknown Client';

    if (!raw.client) {
      itemIssues.push('Missing client name');
      issues.push({
        type: 'MISSING_VALUE',
        board: 'Work Orders',
        itemId: id,
        itemTitle: name,
        description: 'Missing client name',
        severity: 'high',
      });
    }

    const { sector, issue: sectorIssue } = normalizeSector(raw.sector);
    if (sectorIssue) {
      itemIssues.push(sectorIssue);
      issues.push({
        type: 'AMBIGUOUS_SECTOR',
        board: 'Work Orders',
        itemId: id,
        itemTitle: name,
        description: sectorIssue,
        severity: 'low',
      });
    }

    const { status, issue: statusIssue } = normalizeOpsStatus(raw.status);
    if (statusIssue) {
      itemIssues.push(statusIssue);
    }

    const { dateStr: flightDate, issue: flightDateIssue } = normalizeDate(raw.flightDate);
    const { dateStr: deliveryDate, issue: deliveryDateIssue } = normalizeDate(raw.deliveryDate);
    const { dateStr: expectedDeliveryDate } = normalizeDate(raw.expectedDeliveryDate);

    if (flightDateIssue) itemIssues.push(`Flight Date: ${flightDateIssue}`);
    if (deliveryDateIssue && status === 'Delivered') itemIssues.push(`Delivery Date: ${deliveryDateIssue}`);

    // Parse survey area
    let surveyAreaKm2 = 0;
    if (raw.surveyAreaKm2) {
      const areaNum = parseFloat(String(raw.surveyAreaKm2).replace(/[^0-9.]/g, ''));
      if (!isNaN(areaNum)) {
        // If specified in acres, convert to sq km (1 sq km = 247.105 acres)
        if (String(raw.surveyAreaKm2).toLowerCase().includes('acre')) {
          surveyAreaKm2 = Number((areaNum / 247.105).toFixed(2));
        } else {
          surveyAreaKm2 = areaNum;
        }
      }
    }

    // Determine delays
    let isDelayed = false;
    let delayDays = 0;
    const weatherDelayDays = parseInt(String(raw.weatherDelayDays || 0), 10) || 0;

    if (expectedDeliveryDate) {
      const targetDate = new Date(expectedDeliveryDate);
      const actualOrNow = deliveryDate ? new Date(deliveryDate) : new Date();
      if (actualOrNow.getTime() > targetDate.getTime() && status !== 'Delivered') {
        isDelayed = true;
        delayDays = Math.round((actualOrNow.getTime() - targetDate.getTime()) / (1000 * 3600 * 24));
      }
    }

    if (weatherDelayDays > 0) {
      isDelayed = true;
      delayDays = Math.max(delayDays, weatherDelayDays);
    }

    // Fuzzy deal reference matching
    let matchedDealId: string | null = null;
    const normClient = normalizeClientName(client);
    const matchingDeal = cleanDealsList.find(d => isClientMatch(d.client, client));
    if (matchingDeal) {
      matchedDealId = matchingDeal.id;
    } else {
      issues.push({
        type: 'UNMATCHED_CLIENT',
        board: 'Work Orders',
        itemId: id,
        itemTitle: name,
        description: `Work order client "${client}" has no matching Deal in Funnel`,
        severity: 'medium',
      });
    }

    // Billing status normalizer
    let billingStatus: BillingStatus = 'Pending Milestone';
    const rawBill = String(raw.billingStatus || '').toLowerCase();
    if (rawBill.includes('paid') || rawBill.includes('collected')) billingStatus = 'Paid';
    else if (rawBill.includes('billed') || rawBill.includes('invoiced')) billingStatus = 'Billed';
    else if (rawBill.includes('overdue') || rawBill.includes('delayed')) billingStatus = 'Overdue';
    else if (rawBill.includes('not') || rawBill.includes('unbilled')) billingStatus = 'Not Billed';

    return {
      id,
      name,
      client,
      normalizedClient: normClient,
      dealRef: raw.dealRef || null,
      matchedDealId,
      sector,
      status,
      rawStatus: raw.status || '',
      surveyAreaKm2,
      flightDate,
      deliveryDate,
      expectedDeliveryDate,
      isDelayed,
      delayDays,
      billingStatus,
      opsLead: raw.opsLead || 'Ops Team',
      droneModel: raw.droneModel || 'Skylark Surveyor Pro',
      weatherDelayDays,
      issuesLog: raw.issuesLog || null,
      dataQualityIssues: itemIssues,
      raw,
    };
  });

  return { cleanOrders: cleaned, issues };
}

/**
 * Cross-board correlation and risk detection.
 */
export function buildCrossBoardMatches(deals: CleanDeal[], workOrders: CleanWorkOrder[]): CrossBoardMatch[] {
  const clientMap = new Map<string, {
    canonicalName: string;
    deals: CleanDeal[];
    workOrders: CleanWorkOrder[];
  }>();

  // Group deals
  deals.forEach(deal => {
    const key = deal.normalizedClient;
    if (!clientMap.has(key)) {
      clientMap.set(key, { canonicalName: deal.client, deals: [], workOrders: [] });
    }
    clientMap.get(key)!.deals.push(deal);
  });

  // Group work orders by fuzzy matching
  workOrders.forEach(wo => {
    let matchedKey: string | null = null;
    for (const key of clientMap.keys()) {
      if (isClientMatch(key, wo.normalizedClient)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      clientMap.get(matchedKey)!.workOrders.push(wo);
    } else {
      const key = wo.normalizedClient;
      clientMap.set(key, { canonicalName: wo.client, deals: [], workOrders: [wo] });
    }
  });

  const matches: CrossBoardMatch[] = [];

  clientMap.forEach((data, key) => {
    const wonDeals = data.deals.filter(d => d.stage === 'Closed Won');
    const wonDealTotalValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const pipelineTotalValue = data.deals
      .filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
      .reduce((sum, d) => sum + d.value, 0);

    const activeWorkOrders = data.workOrders.filter(w => w.status !== 'Delivered' && w.status !== 'Cancelled');
    const hasActiveWorkOrders = activeWorkOrders.length > 0;
    const hasDelays = data.workOrders.some(w => w.isDelayed || (w.weatherDelayDays > 0));

    // Risk logic:
    // 1. Delayed active work order while having open pipeline deals in negotiation!
    // 2. Won deal with no work order created.
    let isAtRisk = false;
    let riskReason: string | undefined = undefined;

    if (hasDelays && pipelineTotalValue > 0) {
      isAtRisk = true;
      riskReason = `Client has ${formatINR(pipelineTotalValue)} in active sales pipeline, but ongoing Work Order is delayed. Risk of losing pending deals.`;
    } else if (wonDeals.length > 0 && data.workOrders.length === 0 && wonDealTotalValue >= 500000) {
      isAtRisk = true;
      riskReason = `Won deal worth ${formatINR(wonDealTotalValue)} has NO associated Work Orders logged yet. Execution handoff bottleneck.`;
    } else if (data.workOrders.some(w => w.billingStatus === 'Overdue')) {
      isAtRisk = true;
      riskReason = 'Client has overdue billing milestones on existing drone flight deliverables.';
    }

    matches.push({
      client: data.canonicalName,
      normalizedClient: key,
      deals: data.deals,
      workOrders: data.workOrders,
      wonDealTotalValue,
      pipelineTotalValue,
      hasActiveWorkOrders,
      hasDelays,
      isAtRisk,
      riskReason,
    });
  });

  return matches;
}

/**
 * Generate full Data Quality & Resilience report.
 */
export function generateDataQualityReport(
  deals: CleanDeal[],
  workOrders: CleanWorkOrder[],
  allIssues: DataQualityReport['issuesList']
): DataQualityReport {
  const dealsWithIssues = deals.filter(d => d.dataQualityIssues.length > 0).length;
  const woWithIssues = workOrders.filter(w => w.dataQualityIssues.length > 0).length;

  const totalItems = deals.length + workOrders.length;
  const itemsWithIssues = dealsWithIssues + woWithIssues;
  const completenessScore = totalItems > 0 ? Math.round(((totalItems - itemsWithIssues * 0.4) / totalItems) * 100) : 100;

  const caveats: string[] = [];

  const missingDates = allIssues.filter(i => i.type === 'MISSING_DATE').length;
  if (missingDates > 0) {
    caveats.push(`${missingDates} records had missing or unparseable dates; inferred based on current quarter defaults.`);
  }

  const currencyNormalizations = allIssues.filter(i => i.type === 'CURRENCY_NORMALIZED').length;
  if (currencyNormalizations > 0) {
    caveats.push(`${currencyNormalizations} deal amounts required currency/notation normalization (Lakhs, Crores, or USD converted to INR).`);
  }

  const unmatchedClients = allIssues.filter(i => i.type === 'UNMATCHED_CLIENT').length;
  if (unmatchedClients > 0) {
    caveats.push(`${unmatchedClients} work orders could not be directly matched to a sales deal (standalone / direct ops).`);
  }

  return {
    totalDeals: deals.length,
    totalWorkOrders: workOrders.length,
    dealsWithIssuesCount: dealsWithIssues,
    workOrdersWithIssuesCount: woWithIssues,
    completenessScore,
    issuesList: allIssues,
    caveats,
  };
}
