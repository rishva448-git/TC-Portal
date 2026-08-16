import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    // Non-admin users should see videos assigned to ALL members (roleId == null) or their specific role, and Published
    if (!currentUser || currentUser.role !== 'ADMIN') {
      const userRoleId = currentUser?.profile?.roleId;
      const publicVideos = await db.video.findMany({
        where: {
          status: 'Published',
          OR: [
            { roleId: null },
            ...(userRoleId ? [{ roleId: userRoleId }] : []),
          ],
        },
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      });

      const formattedPublic = publicVideos.map((v) => ({
        ...v,
        roleName: v.role ? v.role.name : 'All Members',
      }));

      return NextResponse.json({ success: true, videos: formattedPublic });
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'Published';

    const whereClause: any = {};
    if (status !== 'ALL') {
      whereClause.status = status;
    }

    if (roleId && roleId !== 'ALL') {
      whereClause.OR = [
        { roleId: roleId },
        { roleId: null },
      ];
    }

    if (category && category !== 'ALL') whereClause.category = category;
    if (difficulty && difficulty !== 'ALL') whereClause.difficulty = difficulty;
    if (priority && priority !== 'ALL') whereClause.priority = priority;

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { purpose: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const videos = await db.video.findMany({
      where: whereClause,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    const formattedVideos = videos.map((v) => ({
      ...v,
      roleName: v.role ? v.role.name : 'All Members',
    }));

    return NextResponse.json({ success: true, videos: formattedVideos });
  } catch (error) {
    console.error('Fetch videos error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      youtubeUrl,
      purpose,
      description,
      roleId,
      category,
      difficulty,
      priority,
      status,
      duration,
    } = body;

    if (!title || !youtubeUrl || !purpose) {
      return NextResponse.json({ error: 'Title, YouTube URL, and Purpose are required' }, { status: 400 });
    }

    const youtubeVideoId = extractYouTubeId(youtubeUrl);
    if (!youtubeVideoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL. Please provide a valid YouTube watch or share URL.' }, { status: 400 });
    }

    const thumbnailUrl = getYouTubeThumbnail(youtubeVideoId);
    const assignedRoleId = roleId && roleId !== 'ALL' ? roleId : null;

    const newVideo = await db.video.create({
      data: {
        title,
        youtubeUrl,
        youtubeVideoId,
        thumbnailUrl,
        purpose,
        description: description || '',
        roleId: assignedRoleId,
        category: category || 'Technical',
        difficulty: difficulty || 'Intermediate',
        priority: priority || 'Normal',
        status: status || 'Published',
        duration: duration || '15m',
        createdBy: currentUser.profile?.fullName || 'Admin',
      },
      include: { role: true },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'VIDEO_ADDED',
        target: title,
        metadata: JSON.stringify({ videoId: newVideo.id, roleId: assignedRoleId }),
      },
    });

    return NextResponse.json({ success: true, video: newVideo });
  } catch (error) {
    console.error('Create video error:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
