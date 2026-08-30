import { NextRequest, NextResponse } from 'next/server';
import { MondayClient } from '@/lib/monday/client';
import { setMondayConfig } from '@/app/api/data/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    const client = new MondayClient(apiKey);
    const result = await client.testConnection();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Connection failed. Please verify your Monday.com Personal API token in Developer settings.',
      });
    }

    const boards = await client.getBoards();
    setMondayConfig({ apiKey });

    return NextResponse.json({
      success: true,
      user: result.user,
      boards,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error testing connection' },
      { status: 500 }
    );
  }
}
