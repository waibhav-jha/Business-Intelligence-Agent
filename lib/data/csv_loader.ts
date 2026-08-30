import fs from 'fs';
import path from 'path';
import { RawDeal, RawWorkOrder } from '../types';

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Parse header line handling quotes
  const parseLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length < 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, index) => {
      row[h] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

export function loadCsvDatasets(): { rawDeals: RawDeal[]; rawWorkOrders: RawWorkOrder[] } {
  const dealsCsvPath = path.join(process.cwd(), 'data', 'Deal_funnel_Data.csv');
  const woCsvPath = path.join(process.cwd(), 'data', 'Work_Order_Tracker_Data.csv');

  let rawDeals: RawDeal[] = [];
  let rawWorkOrders: RawWorkOrder[] = [];

  if (fs.existsSync(dealsCsvPath)) {
    const dealsContent = fs.readFileSync(dealsCsvPath, 'utf-8');
    const parsedRows = parseCSV(dealsContent);
    rawDeals = parsedRows.map((r, idx) => ({
      id: `deal-${idx + 1}`,
      name: r['Deal Name'] ? `${r['Deal Name']} (${r['Client Code'] || 'Client'})` : `Deal ${idx + 1}`,
      client: r['Deal Name'] || r['Client Code'] || 'Unknown Client',
      sector: r['Sector/service'] || 'Other',
      stage: r['Deal Stage'] || r['Deal Status'] || 'Lead',
      value: r['Masked Deal value'] || 0,
      expectedCloseDate: r['Tentative Close Date'] || r['Close Date (A)'] || '',
      probability: r['Closure Probability'] || '',
      owner: r['Owner code'] || 'Unassigned',
      region: r['Product deal'] || 'National',
      notes: `Product: ${r['Product deal'] || 'N/A'}, Created: ${r['Created Date'] || 'N/A'}`
    }));
  }

  if (fs.existsSync(woCsvPath)) {
    const woContent = fs.readFileSync(woCsvPath, 'utf-8');
    const parsedRows = parseCSV(woContent);
    rawWorkOrders = parsedRows.map((r, idx) => ({
      id: r['Serial #'] || `wo-${idx + 1}`,
      name: `${r['Deal name masked'] || 'Work Order'} - ${r['Type of Work'] || r['Nature of Work'] || 'Survey'}`,
      client: r['Deal name masked'] || r['Customer Name Code'] || 'Unknown Client',
      dealRef: r['Serial #'] || '',
      sector: r['Sector'] || 'Other',
      status: r['Execution Status'] || r['WO Status (billed)'] || 'Scheduled',
      surveyAreaKm2: r['Quantity by Ops'] || r['Quantities as per PO'] || '0',
      flightDate: r['Probable Start Date'] || r['Date of PO/LOI'] || '',
      deliveryDate: r['Data Delivery Date'] || '',
      expectedDeliveryDate: r['Probable End Date'] || '',
      billingStatus: r['Billing Status'] || r['Invoice Status'] || 'Pending Milestone',
      opsLead: r['BD/KAM Personnel code'] || 'Ops Team',
      droneModel: r['Is any Skylark software platform part of the client deliverables in this deal?'] !== 'NONE' 
        ? `Skylark ${r['Is any Skylark software platform part of the client deliverables in this deal?']} Platform` 
        : 'Skylark Surveyor Pro',
      weatherDelayDays: 0,
      issuesLog: r['latest invoice no.'] ? `Invoice: ${r['latest invoice no.']}. Amount: ₹${r['Amount in Rupees (Incl of GST) (Masked)'] || '0'}` : undefined
    }));
  }

  return { rawDeals, rawWorkOrders };
}
