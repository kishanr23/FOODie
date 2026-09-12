import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SearchSchema } from '@/lib/validation';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'general');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Parse arrays and numbers
    const queryData = {
      ...params,
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined,
      priceLevel: params.priceLevel ? parseInt(params.priceLevel) : undefined,
      vibeIds: searchParams.getAll('vibeIds'),
      cuisineIds: searchParams.getAll('cuisineIds'),
    };

    const result = SearchSchema.safeParse(queryData);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: result.error.format() },
        { status: 400 }
      );
    }

    const { q, type = 'places', categoryId, vibeIds, cuisineIds, priceLevel, page = 1, limit = 20 } = result.data;
    const skip = (page - 1) * limit;

    if (type === 'places') {
      const where: any = {
        status: 'ACTIVE',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      };

      if (categoryId) where.categoryId = categoryId;
      if (priceLevel) where.priceLevel = priceLevel;
      
      if (vibeIds && vibeIds.length > 0) {
        where.vibes = { some: { vibeId: { in: vibeIds } } };
      }
      
      if (cuisineIds && cuisineIds.length > 0) {
        where.cuisines = { some: { cuisineId: { in: cuisineIds } } };
      }

      const [places, total] = await Promise.all([
        prisma.place.findMany({
          where,
          skip,
          take: limit,
          include: {
            category: true,
            vibes: { include: { vibe: true }, orderBy: { count: 'desc' } },
            cuisines: { include: { cuisine: true } }
          },
          orderBy: { name: 'asc' }
        }),
        prisma.place.count({ where })
      ]);

      return NextResponse.json({ 
        results: places, 
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } 
      });
    }

    // Support for other types (users, posts) can be added here
    return NextResponse.json({ results: [], pagination: { total: 0, page, limit, totalPages: 0 } });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
