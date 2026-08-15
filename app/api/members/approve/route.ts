import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, status } = body; // status can be "APPROVED", "SUSPENDED", "REJECTED"

    if (!userId || !['APPROVED', 'SUSPENDED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Valid userId and status are required' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update User status
    await db.user.update({
      where: { id: userId },
      data: { status },
    });

    // Update MemberProfile status
    if (targetUser.profile) {
      await db.memberProfile.update({
        where: { id: targetUser.profile.id },
        data: { status },
      });
    }

    // Create Notification for the member
    if (status === 'APPROVED') {
      await db.notification.create({
        data: {
          userId,
          title: 'Account Approved! 🎉',
          message: 'Your Techveons digital identity account has been approved by the admin. You now have full access to your personalized role dashboard and training videos!',
        },
      });
    }

    // Log Audit Event
    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: `MEMBER_STATUS_${status}`,
        target: `${targetUser.profile?.memberId || targetUser.email}`,
        metadata: JSON.stringify({ oldStatus: targetUser.status, newStatus: status }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Member status updated to ${status}`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member approval status' }, { status: 500 });
  }
}
