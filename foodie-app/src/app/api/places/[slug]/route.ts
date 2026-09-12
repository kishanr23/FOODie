import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params; // Next.js 15 params are treated as promises in some contexts, but await is safer

    const place = await prisma.place.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
      },
      include: {
        city: true,
        category: true,
        cuisines: { include: { cuisine: true } },
        vibes: { 
          include: { vibe: true },
          orderBy: { count: 'desc' }
        },
        _count: {
          select: { visits: true, saves: true, posts: true },
        },
      },
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    // Calculate average ratings from visits
    const ratings = await prisma.rating.aggregate({
      where: { visit: { placeId: place.id } },
      _avg: {
        foodRating: true,
        vibeRating: true,
        serviceRating: true,
      },
      _count: true,
    });

    // Fetch recent top posts for this place
    const recentPosts = await prisma.post.findMany({
      where: { placeId: place.id, status: 'ACTIVE' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: true } },
        media: true,
        visit: { include: { rating: true } },
        vibes: { include: { vibe: true } },
        _count: { select: { likes: true, comments: true } }
      }
    });

    return NextResponse.json({ 
      place, 
      stats: {
        totalRatings: ratings._count,
        avgFood: ratings._avg.foodRating,
        avgVibe: ratings._avg.vibeRating,
        avgService: ratings._avg.serviceRating,
      },
      posts: recentPosts
    });
  } catch (error) {
    console.error('Fetch place error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
