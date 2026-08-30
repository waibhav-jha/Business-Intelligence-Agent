import { NextRequest, NextResponse } from 'next/server';
import { MondayClient } from '@/lib/monday/client';
import { updateStoreData, setMondayConfig, getStore } from '@/app/api/data/store';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({ success: true, message: 'Monday.com Sync API Ready' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, dealsBoardId, workOrdersBoardId, useDemoData } = body;

    if (useDemoData) {
      const current = getStore();
      const resetStore = updateStoreData(current.rawDeals, current.rawWorkOrders, false);
      return NextResponse.json({
        success: true,
        message: 'Switched to pre-configured Skylark Drones demo dataset',
        stats: resetStore.stats,
        qualityReport: resetStore.qualityReport,
      });
    }

    if (!apiKey || !dealsBoardId || !workOrdersBoardId) {
      return NextResponse.json(
        { success: false, error: 'API key, Deals Board ID, and Work Orders Board ID are required' },
        { status: 400 }
      );
    }

    const client = new MondayClient(apiKey);
    
    // Fetch Deals Board
    const dealsBoardData = await client.getBoardData(dealsBoardId);
    const rawDeals = client.parseDealsFromBoard(dealsBoardData);

    // Fetch Work Orders Board
    const woBoardData = await client.getBoardData(workOrdersBoardId);
    const rawWorkOrders = client.parseWorkOrdersFromBoard(woBoardData);

    setMondayConfig({
      apiKey,
      dealsBoardId,
      workOrdersBoardId,
      isLive: true,
    });

    const updatedStore = updateStoreData(rawDeals, rawWorkOrders, true);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${rawDeals.length} deals and ${rawWorkOrders.length} work orders from Monday.com`,
      dealsBoardName: dealsBoardData.name,
      workOrdersBoardName: woBoardData.name,
      stats: updatedStore.stats,
      qualityReport: updatedStore.qualityReport,
      cleanDealsCount: updatedStore.cleanDealsList.length,
      cleanWorkOrdersCount: updatedStore.cleanWorkOrdersList.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync Monday.com boards' },
      { status: 500 }
    );
  }
}
