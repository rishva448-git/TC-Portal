import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = params;

    const video = await db.video.findUnique({
      where: { id },
      include: {
        role: true,
        watchHistory: currentUser ? { where: { userId: currentUser.id } } : false,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // If admin, return full details
    const userHistory = video.watchHistory && video.watchHistory.length > 0 ? video.watchHistory[0] : null;
    if (currentUser && currentUser.role === 'ADMIN') {
      return NextResponse.json({
        success: true,
        video: {
          ...video,
          roleName: video.role ? video.role.name : 'All Members',
          userProgress: userHistory
            ? { progressPercentage: userHistory.progressPercentage, completed: userHistory.completed, startedAt: userHistory.startedAt, lastWatchedAt: userHistory.lastWatchedAt }
            : { progressPercentage: 0, completed: false, startedAt: null, lastWatchedAt: null },
        },
      });
    }

    // Published videos assigned to all members (roleId == null) are viewable by everyone
    const isPublicForAll = !video.roleId && video.status === 'Published';
    if (isPublicForAll) {
      return NextResponse.json({
        success: true,
        video: {
          ...video,
          roleName: 'All Members',
          userProgress: { progressPercentage: 0, completed: false, startedAt: null, lastWatchedAt: null },
        },
      });
    }

    // If logged-in member, check role match
    if (currentUser) {
      const memberProfile = await db.memberProfile.findUnique({ where: { id: currentUser.profile?.id } });
      if (memberProfile && video.roleId && memberProfile.roleId === video.roleId && video.status === 'Published') {
        return NextResponse.json({
          success: true,
          video: {
            ...video,
            roleName: video.role ? video.role.name : 'All Members',
            userProgress: userHistory
              ? { progressPercentage: userHistory.progressPercentage, completed: userHistory.completed, startedAt: userHistory.startedAt, lastWatchedAt: userHistory.lastWatchedAt }
              : { progressPercentage: 0, completed: false, startedAt: null, lastWatchedAt: null },
          },
        });
      }
    }

    return NextResponse.json({ error: 'Forbidden: You do not have access to this video' }, { status: 403 });
  } catch (error) {
    console.error('Fetch single video error:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, youtubeUrl, purpose, description, roleId, category, difficulty, priority, status, duration } = body;

    const existingVideo = await db.video.findUnique({ where: { id } });
    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (duration !== undefined) updateData.duration = duration;
    if (roleId !== undefined) updateData.roleId = roleId === 'ALL' ? null : roleId;

    if (youtubeUrl) {
      const vidId = extractYouTubeId(youtubeUrl);
      if (vidId) {
        updateData.youtubeUrl = youtubeUrl;
        updateData.youtubeVideoId = vidId;
        updateData.thumbnailUrl = getYouTubeThumbnail(vidId);
      }
    }

    const updatedVideo = await db.video.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'VIDEO_EDITED',
        target: updatedVideo.title,
        metadata: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true, video: updatedVideo });
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const video = await db.video.findUnique({ where: { id } });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    await db.video.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'VIDEO_DELETED',
        target: video.title,
        metadata: JSON.stringify({ videoId: id }),
      },
    });

    return NextResponse.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
