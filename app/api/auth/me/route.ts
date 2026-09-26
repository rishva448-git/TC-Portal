import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const [notifications, role] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          message: true,
          read: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      user.profile?.roleId
        ? db.role.findUnique({
            where: { id: user.profile.roleId },
            select: { id: true, name: true },
          })
        : Promise.resolve(null),
    ]);

    let roleName = 'Member';
    if (role) roleName = role.name;

    const compact = new URL(request.url).searchParams.get('compact') === 'true';
    const profile = {
      ...user.profile,
      skills: JSON.parse(user.profile?.skills || '[]'),
      roleName,
      ...(compact ? { profilePhoto: undefined } : {}),
    };

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile,
        notifications,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user session' }, { status: 500 });
  }
}
