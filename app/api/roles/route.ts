import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const roles = await db.role.findMany({
      orderBy: { name: 'asc' },
    });

    const formattedRoles = roles.map((r) => ({
      ...r,
      recommendedSkills: JSON.parse(r.recommendedSkills || '[]'),
    }));

    return NextResponse.json({ success: true, roles: formattedRoles });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, recommendedSkills } = body;

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const skillsString = Array.isArray(recommendedSkills)
      ? JSON.stringify(recommendedSkills)
      : typeof recommendedSkills === 'string'
      ? JSON.stringify(recommendedSkills.split(',').map((s: string) => s.trim()))
      : '[]';

    const newRole = await db.role.create({
      data: {
        name,
        description: description || '',
        recommendedSkills: skillsString,
      },
    });

    await db.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'ROLE_CREATED',
        target: name,
        metadata: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      role: {
        ...newRole,
        recommendedSkills: JSON.parse(newRole.recommendedSkills),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
