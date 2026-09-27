import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 300;

export async function GET() {
  try {
    const settingsList = await db.systemSetting.findMany({
      where: { NOT: { key: { startsWith: 'tc_ai_confirmation:' } } },
    });
    const settingsObject: Record<string, string> = {};

    settingsList.forEach((s) => {
      settingsObject[s.key] = s.value;
    });

    return NextResponse.json({ success: true, settings: settingsObject });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch platform settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json(); // Map of { key: value }
    if (Object.keys(body).some((key) => key.startsWith('tc_ai_confirmation:'))) {
      return NextResponse.json({ error: 'Internal confirmation settings cannot be changed.' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(body)) {
      await db.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'SETTINGS_UPDATED',
        target: 'Platform Settings',
        metadata: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
