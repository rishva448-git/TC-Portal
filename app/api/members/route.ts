import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const roleFilter = searchParams.get('roleId');
    const searchQuery = searchParams.get('search');

    const whereClause: any = {};

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    if (roleFilter && roleFilter !== 'ALL') {
      whereClause.profile = { roleId: roleFilter };
    }

    if (searchQuery) {
      whereClause.OR = [
        { email: { contains: searchQuery } },
        { profile: { fullName: { contains: searchQuery } } },
        { profile: { memberId: { contains: searchQuery } } },
        { profile: { position: { contains: searchQuery } } },
      ];
    }

    const members = await db.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        watchHistory: {
          include: { video: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const roles = await db.role.findMany();
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    const formattedMembers = members.map((m) => {
      const skillsArray = JSON.parse(m.profile?.skills || '[]');
      const completedCount = m.watchHistory.filter((w) => w.completed).length;
      const totalWatched = m.watchHistory.length;

      return {
        id: m.id,
        email: m.email,
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
        profile: {
          ...m.profile,
          skills: skillsArray,
          roleName: m.profile?.roleId ? roleMap.get(m.profile.roleId) || 'Member' : 'Unassigned',
        },
        stats: {
          totalWatched,
          completedCount,
          inProgressCount: totalWatched - completedCount,
          completionRate: totalWatched > 0 ? Math.round((completedCount / totalWatched) * 100) : 0,
        },
      };
    });

    return NextResponse.json({ success: true, members: formattedMembers });
  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
