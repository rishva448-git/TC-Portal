import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const totalMembers = await db.user.count({ where: { role: 'MEMBER' } });
    const activeMembers = await db.user.count({ where: { role: 'MEMBER', status: 'APPROVED' } });
    const pendingMembers = await db.user.count({ where: { role: 'MEMBER', status: 'PENDING' } });

    const totalVideos = await db.video.count();
    const publishedVideos = await db.video.count({ where: { status: 'Published' } });

    const totalWatches = await db.watchHistory.count();
    const completedTrainings = await db.watchHistory.count({ where: { completed: true } });

    const avgCompletionRate = totalWatches > 0
      ? Math.round((completedTrainings / totalWatches) * 100)
      : 0;

    // Role breakdown metrics for charts
    const roles = await db.role.findMany({
      include: {
        videos: true,
      },
    });

    const profiles = await db.memberProfile.findMany({
      select: { roleId: true },
    });

    const membersByRole = roles.map((r) => {
      const count = profiles.filter((p) => p.roleId === r.id).length;
      return {
        roleName: r.name,
        memberCount: count,
        videoCount: r.videos.length,
      };
    });

    // Recent activity audit logs
    const recentLogs = await db.auditLog.findMany({
      take: 8,
      orderBy: { timestamp: 'desc' },
      include: { user: { include: { profile: true } } },
    });

    // Top watched videos
    const topVideos = await db.video.findMany({
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
    });

    const formattedTopVideos = topVideos.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      roleName: v.role ? v.role.name : 'All Members',
      watchCount: v._count.watchHistory,
    }));

    return NextResponse.json({
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
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
