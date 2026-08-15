import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Security: Only Admin or the member themselves can view complete profile detail
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id },
      include: {
        profile: true,
        watchHistory: {
          include: {
            video: true,
          },
          orderBy: { lastWatchedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    let roleName = 'Member';
    if (user.profile?.roleId) {
      const role = await db.role.findUnique({ where: { id: user.profile.roleId } });
      if (role) roleName = role.name;
    }

    const skills = JSON.parse(user.profile?.skills || '[]');
    const totalWatched = user.watchHistory.length;
    const completedCount = user.watchHistory.filter((w) => w.completed).length;

    return NextResponse.json({
      success: true,
      member: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: {
          ...user.profile,
          skills,
          roleName,
        },
        stats: {
          totalWatched,
          completedCount,
          inProgressCount: totalWatched - completedCount,
          completionRate: totalWatched > 0 ? Math.round((completedCount / totalWatched) * 100) : 0,
        },
        watchHistory: user.watchHistory,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch member details' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { fullName, phone, bio, skills, profilePhoto, position, roleId, status } = body;

    // Non-admin can only update their own editable fields (photo, name, phone, bio, skills)
    const isAdmin = currentUser.role === 'ADMIN';
    if (!isAdmin && currentUser.id !== id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userToUpdate = await db.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!userToUpdate || !userToUpdate.profile) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const profileData: any = {};
    if (fullName !== undefined) profileData.fullName = fullName;
    if (phone !== undefined) profileData.phone = phone;
    if (bio !== undefined) profileData.bio = bio;
    if (skills !== undefined) profileData.skills = typeof skills === 'string' ? skills : JSON.stringify(skills);
    if (profilePhoto !== undefined) profileData.profilePhoto = profilePhoto;

    // Restricted fields (only Admin can update position, roleId, status)
    if (isAdmin) {
      if (position !== undefined) profileData.position = position;
      if (roleId !== undefined) profileData.roleId = roleId;
      if (status !== undefined) {
        profileData.status = status;
        await db.user.update({
          where: { id },
          data: { status },
        });
      }
    }

    const updatedProfile = await db.memberProfile.update({
      where: { id: userToUpdate.profile.id },
      data: profileData,
    });

    if (isAdmin) {
      await db.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'MEMBER_UPDATED',
          target: `${updatedProfile.memberId} (${updatedProfile.fullName})`,
          metadata: JSON.stringify(body),
        },
      });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}
