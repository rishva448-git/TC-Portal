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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const whereClause: any = { role: 'MEMBER' };

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

    const skip = (page - 1) * limit;

    const [members, total, roles] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          profile: {
            select: {
              id: true,
              memberId: true,
              fullName: true,
              position: true,
              roleId: true,
              profilePhoto: true,
              skills: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where: whereClause }),
      db.role.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const roleMap = new Map(roles.map((r) => [r.id, r.name]));
    const watchStatsMap = new Map<string, { total: number; completed: number }>();

    if (members.length > 0) {
      const memberIds = members.map((member) => member.id);
      const historyStats = await db.watchHistory.groupBy({
        by: ['userId', 'completed'],
        _count: { id: true },
        where: { userId: { in: memberIds } },
      });

      for (const record of historyStats) {
        const existing = watchStatsMap.get(record.userId) ?? { total: 0, completed: 0 };
        existing.total += record._count.id;
        if (record.completed) {
          existing.completed += record._count.id;
        }
        watchStatsMap.set(record.userId, existing);
      }
    }

    const formattedMembers = members.map((m) => {
      const skillsArray = JSON.parse(m.profile?.skills || '[]');
      const stats = watchStatsMap.get(m.id) || { total: 0, completed: 0 };

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
          totalWatched: stats.total,
          completedCount: stats.completed,
          inProgressCount: stats.total - stats.completed,
          completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        },
      };
    });

    return NextResponse.json({ success: true, members: formattedMembers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
