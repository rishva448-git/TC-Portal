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

    const [members, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        include: {
          profile: true,
          _count: {
            select: { watchHistory: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where: whereClause }),
    ]);

    const roles = await db.role.findMany();
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    // Fetch watch stats - count completed vs total
    const watchHistoryData = await db.watchHistory.findMany({
      select: {
        userId: true,
        completed: true,
      },
    });

    // Group by userId and count completed
    const watchStatsMap = new Map<string, { total: number; completed: number }>();
    for (const record of watchHistoryData) {
      if (!watchStatsMap.has(record.userId)) {
        watchStatsMap.set(record.userId, { total: 0, completed: 0 });
      }
      const stats = watchStatsMap.get(record.userId)!;
      stats.total += 1;
      if (record.completed) {
        stats.completed += 1;
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
