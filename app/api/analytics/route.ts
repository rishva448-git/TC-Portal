import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parallelize all count queries
    const [memberCounts, videoCounts, watchCounts] = await Promise.all([
      db.user.groupBy({
        by: ['role', 'status'],
        _count: { id: true },
        where: { role: 'MEMBER' },
      }),
      db.video.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      db.watchHistory.groupBy({
        by: ['completed'],
        _count: { id: true },
      }),
    ]);

    const totalMembers = memberCounts.reduce((sum, m) => sum + m._count.id, 0);
    const activeMembers = memberCounts.find((m) => m.status === 'APPROVED')?._count.id || 0;
    const pendingMembers = memberCounts.find((m) => m.status === 'PENDING')?._count.id || 0;

    const totalVideos = videoCounts.reduce((sum, v) => sum + v._count.id, 0);
    const publishedVideos = videoCounts.find((v) => v.status === 'Published')?._count.id || 0;

    const totalWatches = watchCounts.reduce((sum, w) => sum + w._count.id, 0);
    const completedTrainings = watchCounts.find((w) => w.completed === true)?._count.id || 0;

    const avgCompletionRate = totalWatches > 0
      ? Math.round((completedTrainings / totalWatches) * 100)
      : 0;

    // Role breakdown metrics for charts - optimized
    const [roles, membersByRoleData, videosByRoleData] = await Promise.all([
      db.role.findMany(),
      db.memberProfile.groupBy({
        by: ['roleId'],
        _count: { id: true },
      }),
      db.video.groupBy({
        by: ['roleId'],
        _count: { id: true },
      }),
    ]);

    const membersByRoleMap = new Map(membersByRoleData.map((m) => [m.roleId, m._count.id]));
    const videosByRoleMap = new Map(videosByRoleData.map((v) => [v.roleId, v._count.id]));

    const membersByRole = roles.map((r) => ({
      roleName: r.name,
      memberCount: membersByRoleMap.get(r.id) || 0,
      videoCount: videosByRoleMap.get(r.id) || 0,
    }));

    // Parallel fetch recent logs and top videos
    const [recentLogs, topVideos] = await Promise.all([
      db.auditLog.findMany({
        take: 8,
        orderBy: { timestamp: 'desc' },
        include: { user: { include: { profile: true } } },
      }),
      db.video.findMany({
        include: {
          _count: {
            select: { watchHistory: true },
          },
          role: true,
        },
        take: 5,
        orderBy: {
          watchHistory: {
            _count: 'desc',
          },
        },
      }),
    ]);

    const formattedTopVideos = topVideos.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      roleName: v.role ? v.role.name : 'All Members',
      watchCount: v._count.watchHistory,
    }));

    const response = NextResponse.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        pendingMembers,
        totalVideos,
        publishedVideos,
        totalWatches,
        completedTrainings,
        avgCompletionRate,
      },
      membersByRole,
      topVideos: formattedTopVideos,
      recentActivity: recentLogs,
    });

    // Add cache header - cache for 1 minute for dashboard freshness
    response.headers.set('Cache-Control', 'private, max-age=60, s-maxage=60');
    return response;
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
