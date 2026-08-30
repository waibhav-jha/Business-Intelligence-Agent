import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/app/api/data/store';
import { generateLeadershipBriefing } from '@/lib/agent/leadership_brief';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'Weekly Executive Flash (Current Quarter)';
    const audience = (searchParams.get('audience') as any) || 'Founders / Board of Directors';

    const store = getStore();
    const briefing = generateLeadershipBriefing(
      store.stats,
      store.qualityReport,
      period,
      audience
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
      period || 'Weekly Executive Flash (Current Quarter)',
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
