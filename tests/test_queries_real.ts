import { initializeStore } from '../app/api/data/store';
import { executeBIQuery } from '../lib/agent/query_engine';
import { generateLeadershipBriefing } from '../lib/agent/leadership_brief';

const store = initializeStore(true);

console.log('Testing Queries:');
const queries = [
  "How's our pipeline looking for energy sector this quarter?",
  "Which clients have delayed work orders and open deals in negotiation?",
  "Show revenue, win rates, and pipeline distribution by sector",
  "What are our flight operations metrics and weather delays?",
  "How are we doing?",
  "Give me a complete leadership briefing"
];

for (const q of queries) {
  try {
    const res = executeBIQuery(q, {
      deals: store.cleanDealsList,
      workOrders: store.cleanWorkOrdersList,
      crossBoardMatches: store.crossBoardMatches,
      qualityReport: store.qualityReport,
      stats: store.stats,
    });
    console.log(`✓ Query success for: "${q}" -> Intent: ${res.intent}`);
  } catch (err) {
    console.error(`❌ Query failed for: "${q}"`, err);
  }
}

try {
  const brief = generateLeadershipBriefing(store.stats, store.qualityReport);
  console.log(`✓ Leadership briefing generated successfully: ${brief.headline}`);
} catch (err) {
  console.error('❌ Briefing failed', err);
}
