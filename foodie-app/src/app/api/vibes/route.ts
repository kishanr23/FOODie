import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const vibes = await prisma.vibe.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    return NextResponse.json({ vibes });
  } catch (error) {
    console.error('Fetch vibes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
