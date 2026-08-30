// Standalone pure JS test runner for cleaner and analytics logic
import {
  normalizeCurrency,
  normalizeDate,
  normalizeSector,
  normalizeDealStage,
  isClientMatch,
  cleanDeals,
  cleanWorkOrders,
  buildCrossBoardMatches,
} from './lib_data_cleaner_bundle.mjs';

console.log('Testing bundle...');
