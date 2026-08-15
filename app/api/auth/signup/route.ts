import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateMemberId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password, phone, roleId, position } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Full name, email, and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const memberId = await generateMemberId();

    // Default status for new registrations is PENDING
    const newUser = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'MEMBER',
        status: 'PENDING',
        profile: {
          create: {
            memberId,
            fullName,
            phone: phone || '',
            email: normalizedEmail,
            position: position || 'Team Member',
            roleId: roleId || null,
            company: 'Techveons Creations',
            bio: `New member at Techveons Creations.`,
            skills: JSON.stringify([]),
            status: 'PENDING',
          },
        },
      },
      include: { profile: true },
    });

    // Create Audit Log entry
    await db.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'MEMBER_REGISTERED',
        target: `${memberId} (${fullName})`,
        metadata: JSON.stringify({ email: normalizedEmail, position }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.',
      memberId,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
