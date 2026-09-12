import { NextResponse } from 'next/server';
import { clearAuthCookies, getCurrentUser, revokeAllRefreshTokens } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    // Remove specific refresh token from database if present
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Optionally check if they wanted a global logout
    const url = new URL(req.url);
    const global = url.searchParams.get('global') === 'true';

    if (global) {
      const user = await getCurrentUser();
      if (user) {
        await revokeAllRefreshTokens(user.id);
      }
    }

    await clearAuthCookies();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if DB fails, clear cookies so user isn't stuck
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  }
}
