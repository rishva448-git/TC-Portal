import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { processAiMessage } from '@/lib/tc-ai/orchestrator';
import type { ChatRequestPayload } from '@/lib/tc-ai/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 });
    }

    // Role check: Only ADMIN or authenticated members (with read restrictions)
    // Most portal administration tools require ADMIN
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
