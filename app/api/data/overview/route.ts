import { NextResponse } from 'next/server';
import { getStore } from '@/app/api/data/store';

export async function GET() {
  try {
    const store = getStore();
    return NextResponse.json({
      success: true,
      stats: store.stats,
      qualityReport: store.qualityReport,
      cleanDeals: store.cleanDealsList,
      cleanWorkOrders: store.cleanWorkOrdersList,
      crossBoardMatches: store.crossBoardMatches,
      mondayConfig: store.mondayConfig,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
