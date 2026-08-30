import { loadCsvDatasets } from '../lib/data/csv_loader';
import { cleanDeals, cleanWorkOrders, buildCrossBoardMatches, generateDataQualityReport } from '../lib/data/cleaner';
import { computeExecutiveAnalytics } from '../lib/agent/analytics';

const { rawDeals, rawWorkOrders } = loadCsvDatasets();
console.log(`Loaded ${rawDeals.length} deals from CSV`);
console.log(`Loaded ${rawWorkOrders.length} work orders from CSV`);

const { cleanDeals: cleanedDeals, issues: dealIssues } = cleanDeals(rawDeals);
const { cleanOrders: cleanedOrders, issues: woIssues } = cleanWorkOrders(rawWorkOrders, cleanedDeals);
const crossBoardMatches = buildCrossBoardMatches(cleanedDeals, cleanedOrders);
const allIssues = [...dealIssues, ...woIssues];
const qualityReport = generateDataQualityReport(cleanedDeals, cleanedOrders, allIssues);
const stats = computeExecutiveAnalytics(cleanedDeals, cleanedOrders, crossBoardMatches);

console.log(`\n--- Analytics Summary on Real Assignment CSVs ---`);
console.log(`Total Pipeline Value: ₹${(stats.totalPipelineValue / 10000000).toFixed(2)} Cr`);
console.log(`Closed Won Revenue: ₹${(stats.wonRevenue / 10000000).toFixed(2)} Cr`);
console.log(`Weighted Pipeline: ₹${(stats.weightedPipelineValue / 10000000).toFixed(2)} Cr`);
console.log(`Win Rate: ${stats.winRate}%`);
console.log(`Cross-Board Matches: ${crossBoardMatches.length}`);
console.log(`Risk Accounts Detected: ${stats.atRiskAccountsCount}`);
console.log(`Survey Area Surveyed: ${stats.totalSurveyAreaKm2.toLocaleString()} units`);
console.log(`Data Completeness Score: ${qualityReport.completenessScore}%`);
