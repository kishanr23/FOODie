import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { placeId, note } = body;

    if (!placeId) return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });

    // Verify ownership
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.userId !== user.id) {
      return NextResponse.json({ error: 'Collection not found or unauthorized' }, { status: 404 });
    }

    const existingPlace = await prisma.collectionPlace.findUnique({
      where: { collectionId_placeId: { collectionId: id, placeId } }
    });

    if (existingPlace) {
      // Remove place from collection
      await prisma.collectionPlace.delete({
        where: { collectionId_placeId: { collectionId: id, placeId } }
      });
      return NextResponse.json({ added: false });
    } else {
      // Add place to collection
      await prisma.collectionPlace.create({
        data: { collectionId: id, placeId, note }
      });
      return NextResponse.json({ added: true });
    }
  } catch (error) {
    console.error('Toggle collection place error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
