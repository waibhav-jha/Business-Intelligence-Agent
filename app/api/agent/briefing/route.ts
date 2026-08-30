import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/app/api/data/store';
import { generateLeadershipBriefing } from '@/lib/agent/leadership_brief';

export const dynamic = 'force-static';

export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const briefing = generateLeadershipBriefing(
      store.stats,
      store.qualityReport,
      'Weekly Executive Flash (Q3 Week 8)',
      'Founders / Board of Directors'
    );

    return NextResponse.json({
      success: true,
      data: briefing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error generating leadership briefing' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { period, audience } = body;

    const store = getStore();
    const briefing = generateLeadershipBriefing(
      store.stats,
      store.qualityReport,
      period || 'Weekly Executive Flash (Q3 Week 8)',
      audience || 'Founders / Board of Directors'
    );

    return NextResponse.json({
      success: true,
      data: briefing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error generating leadership briefing' },
      { status: 500 }
    );
  }
}
