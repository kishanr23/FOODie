import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';

    const reports = await prisma.report.findMany({
      where: {
        status: status as any
      },
      orderBy: { createdAt: 'asc' },
      include: {
        reporter: { select: { email: true, profile: { select: { username: true } } } },
        // Include related content based on polymorphic type
        post: {
          select: {
            id: true,
            caption: true,
            media: true,
            status: true,
            user: { select: { profile: { select: { username: true } } } }
          }
        },
        reportedUser: {
          select: { id: true, status: true, profile: { select: { username: true } } }
        },
        place: {
          select: { id: true, name: true, status: true }
        }
      }
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
