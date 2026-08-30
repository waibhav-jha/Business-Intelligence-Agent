import { loadCsvDatasets } from '../lib/data/csv_loader';
import * as fs from 'fs';
import * as path from 'path';

console.log('Generating embedded CSV data module for browser/GitHub Pages compatibility...');

const { rawDeals, rawWorkOrders } = loadCsvDatasets();

const outputPath = path.join(__dirname, '..', 'data', 'csv_embedded.ts');

const content = `// Auto-generated embedded dataset for browser and GitHub Pages static hosting
import { RawDeal, RawWorkOrder } from '../lib/types';

export const EMBEDDED_RAW_DEALS: RawDeal[] = ${JSON.stringify(rawDeals, null, 2)};

export const EMBEDDED_RAW_WORK_ORDERS: RawWorkOrder[] = ${JSON.stringify(rawWorkOrders, null, 2)};
`;

fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`Generated ${outputPath} with ${rawDeals.length} deals and ${rawWorkOrders.length} work orders.`);
