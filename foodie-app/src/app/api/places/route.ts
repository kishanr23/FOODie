import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'general');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const categoryId = searchParams.get('categoryId');
    const cuisineId = searchParams.get('cuisineId');

    const where: any = {
      status: 'ACTIVE',
    };

    if (categoryId) where.categoryId = categoryId;
    if (cuisineId) where.cuisines = { some: { cuisineId } };

    const places = await prisma.place.findMany({
      where,
      take: limit,
      include: {
        category: true,
        cuisines: { include: { cuisine: true } },
        vibes: { include: { vibe: true } },
        _count: {
          select: { visits: true, saves: true, posts: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Fetch places error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
