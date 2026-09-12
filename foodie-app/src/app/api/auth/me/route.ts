import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.profile?.username,
        displayName: user.profile?.displayName,
        avatarUrl: user.profile?.avatarUrl,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
