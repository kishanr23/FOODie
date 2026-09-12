import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const CollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  isList: z.boolean().default(false)
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { places: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Fetch collections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = CollectionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { name, description, isPublic, isList } = result.data;

    const collection = await prisma.collection.create({
      data: {
        userId: user.id,
        name,
        description,
        isPublic,
        isList: user.role === 'CREATOR' ? isList : false // Only creators can make 'lists'
      }
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
