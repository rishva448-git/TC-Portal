import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { processAiMessage } from '@/lib/tc-ai/orchestrator';
import type { ChatRequestPayload } from '@/lib/tc-ai/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 });
    }
    if (currentUser.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Approved account access required' }, { status: 403 });
    }
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MEMBER') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    if (currentUser.role === 'MEMBER' && currentUser.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Approved member access required' }, { status: 403 });
    }

    const body: ChatRequestPayload = await request.json();
    const { message, history = [], confirmation } = body;

    if (!message && !confirmation) {
      return NextResponse.json({ error: 'Message or confirmation payload is required' }, { status: 400 });
    }

    const response = await processAiMessage(
      { currentUser },
      message || '',
      history,
      confirmation
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('TC AI route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request with TC AI.',
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (currentUser.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Approved account access required' }, { status: 403 });
    }
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MEMBER') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      name: 'TC AI',
      status: 'online',
      user: {
        id: currentUser.id,
        role: currentUser.role,
        name: currentUser.profile?.fullName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to query TC AI status' }, { status: 500 });
  }
}
