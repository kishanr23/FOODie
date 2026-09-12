import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth';
import { SignupSchema } from '@/lib/validation';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'auth/signup');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, password, username, displayName } = result.data;

    // Check if email or username exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { profile: { username } }
        ]
      },
      include: { profile: true }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          profile: {
            create: {
              username,
              displayName,
            }
          }
        },
        include: { profile: true }
      });
      return newUser;
    });

    const accessToken = await createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.profile?.username,
        displayName: user.profile?.displayName,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
