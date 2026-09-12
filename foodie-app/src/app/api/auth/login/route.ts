import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth';
import { LoginSchema } from '@/lib/validation';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'auth/login');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts, please try again later' }, { status: 429 });
    }

    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = await createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    await setAuthCookies(accessToken, refreshToken);

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

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
