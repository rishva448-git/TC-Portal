import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const emailLc = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: emailLc },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check account status
    if (user.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Your account is pending admin approval. You will receive access once approved by an administrator.' },
        { status: 403 }
      );
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      return NextResponse.json(
        { error: `Your account has been ${user.status.toLowerCase()}. Please contact Techveons support.` },
        { status: 403 }
      );
    }

    // Update last active time
    if (user.profile) {
      await db.memberProfile.update({
        where: { id: user.profile.id },
        data: { lastActiveTime: new Date() },
      });
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      memberId: user.profile?.memberId,
      fullName: user.profile?.fullName,
    };

    const token = signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
      },
    });

    // Set HttpOnly cookie
    response.cookies.set({
      name: 'techveons_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
