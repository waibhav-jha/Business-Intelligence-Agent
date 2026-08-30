import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/app/api/data/store';
import { executeBIQuery } from '@/lib/agent/query_engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A query string is required' },
        { status: 400 }
      );
    }

    const store = getStore();
    const result = executeBIQuery(query, {
      deals: store.cleanDealsList,
      workOrders: store.cleanWorkOrdersList,
      crossBoardMatches: store.crossBoardMatches,
      qualityReport: store.qualityReport,
      stats: store.stats,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing query' },
      { status: 500 }
    );
  }
}
