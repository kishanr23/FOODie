import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const place = await prisma.place.findFirst({ where: { slug } });
    if (!place) return NextResponse.json({ error: 'Place not found' }, { status: 404 });

    const existingSave = await prisma.save.findUnique({
      where: { userId_placeId: { userId: user.id, placeId: place.id } }
    });

    if (existingSave) {
      // Unsave
      await prisma.save.delete({
        where: { userId_placeId: { userId: user.id, placeId: place.id } }
      });
      return NextResponse.json({ saved: false });
    } else {
      // Save
      await prisma.save.create({
        data: { userId: user.id, placeId: place.id }
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Toggle save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
