import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'techveons-super-secret-jwt-key-2026';
const COOKIE_NAME = 'techveons_session';

export interface UserSession {
  userId: string;
  email: string;
  role: string;
  status: string;
  memberId?: string;
  fullName?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      profile: true,
    },
  });

  if (!user) return null;
  return user;
}

export async function generateMemberId(): Promise<string> {
  const count = await db.memberProfile.count();
  const nextNum = count + 1;
  const formatted = String(nextNum).padStart(3, '0');
  return `TV-${formatted}`;
}
