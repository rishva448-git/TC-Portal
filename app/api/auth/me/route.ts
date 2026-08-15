import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fetch user's notifications & role info
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let roleName = 'Member';
    if (user.profile?.roleId) {
      const role = await db.role.findUnique({ where: { id: user.profile.roleId } });
      if (role) roleName = role.name;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: {
          ...user.profile,
          skills: JSON.parse(user.profile?.skills || '[]'),
          roleName,
        },
        notifications,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user session' }, { status: 500 });
  }
}
