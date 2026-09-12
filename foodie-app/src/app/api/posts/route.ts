import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'posts');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      placeId, 
      latitude, 
      longitude, 
      isVerified,
      foodRating, 
      vibeRating, 
      serviceRating,
      caption,
      mediaUrls = [], // Array of URLs returned from /api/upload
      vibeIds = [] // Array of vibe IDs
    } = body;

    if (!placeId || !foodRating || !vibeRating || !serviceRating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // We do all this in a transaction so if any part fails, nothing is created.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Visit
      const visit = await tx.visit.create({
        data: {
          userId: user.id,
          placeId,
          verificationStatus: isVerified ? 'VERIFIED' : 'PENDING',
        }
      });

      // 2. Create the Rating
      await tx.rating.create({
        data: {
          visitId: visit.id,
          foodRating,
          vibeRating,
          serviceRating,
        }
      });

      // 3. Create the Post
      const post = await tx.post.create({
        data: {
          userId: user.id,
          placeId,
          visitId: visit.id,
          caption,
          vibes: {
            create: vibeIds.map((vibeId: string) => ({
              vibe: { connect: { id: vibeId } }
            }))
          },
          media: {
            create: mediaUrls.map((url: string, index: number) => ({
              url,
              type: 'IMAGE',
              sortOrder: index
            }))
          }
        },
        include: {
          media: true,
          vibes: { include: { vibe: true } }
        }
      });

      // 4. Update the Place Vibe counts based on the new tags
      for (const vibeId of vibeIds) {
        const existingPlaceVibe = await tx.placeVibe.findUnique({
          where: { placeId_vibeId: { placeId, vibeId } }
        });

        if (existingPlaceVibe) {
          await tx.placeVibe.update({
            where: { placeId_vibeId: { placeId, vibeId } },
            data: { count: { increment: 1 } }
          });
        } else {
          await tx.placeVibe.create({
            data: { placeId, vibeId, count: 1 }
          });
        }
      }

      return post;
    });

    return NextResponse.json({ success: true, post: result }, { status: 201 });

  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
