import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status'); // "in_progress", "completed", "all"

    const whereClause: any = {
      userId: currentUser.id,
    };

    if (filterStatus === 'completed') {
      whereClause.completed = true;
    } else if (filterStatus === 'in_progress') {
      whereClause.completed = false;
      whereClause.progressPercentage = { gt: 0 };
    }

    const history = await db.watchHistory.findMany({
      where: whereClause,
      include: {
        video: {
          include: { role: true },
        },
      },
      orderBy: { lastWatchedAt: 'desc' },
    });

    const formattedHistory = history.map((h) => ({
      id: h.id,
      videoId: h.videoId,
      videoTitle: h.video.title,
      thumbnailUrl: h.video.thumbnailUrl,
      roleName: h.video.role ? h.video.role.name : 'All Members',
      duration: h.video.duration,
      category: h.video.category,
      difficulty: h.video.difficulty,
      purpose: h.video.purpose,
      progressPercentage: h.progressPercentage,
      completed: h.completed,
      startedAt: h.startedAt,
      lastWatchedAt: h.lastWatchedAt,
      completedAt: h.completedAt,
    }));

    return NextResponse.json({ success: true, history: formattedHistory });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch watch history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, progressPercentage } = body;

    if (!videoId || progressPercentage === undefined) {
      return NextResponse.json({ error: 'videoId and progressPercentage are required' }, { status: 400 });
    }

    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const newProgress = Math.min(100, Math.max(0, Math.round(Number(progressPercentage))));
    const isCompleted = newProgress >= 100;

    const existingHistory = await db.watchHistory.findUnique({
      where: {
        userId_videoId: {
          userId: currentUser.id,
          videoId,
        },
      },
    });

    let historyRecord;

    if (existingHistory) {
      // Do not downgrade progress if already completed
      const finalProgress = Math.max(existingHistory.progressPercentage, newProgress);
      const finalCompleted = existingHistory.completed || isCompleted;

      historyRecord = await db.watchHistory.update({
        where: { id: existingHistory.id },
        data: {
          progressPercentage: finalProgress,
          completed: finalCompleted,
          lastWatchedAt: new Date(),
          completedAt: finalCompleted && !existingHistory.completed ? new Date() : existingHistory.completedAt,
        },
      });
    } else {
      historyRecord = await db.watchHistory.create({
        data: {
          userId: currentUser.id,
          videoId,
          progressPercentage: newProgress,
          completed: isCompleted,
          startedAt: new Date(),
          lastWatchedAt: new Date(),
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      history: historyRecord,
      message: isCompleted ? 'Congratulations! Video marked as completed ✓' : `Progress updated to ${newProgress}%`,
    });
  } catch (error) {
    console.error('Update watch history error:', error);
    return NextResponse.json({ error: 'Failed to record watch history' }, { status: 500 });
  }
}
