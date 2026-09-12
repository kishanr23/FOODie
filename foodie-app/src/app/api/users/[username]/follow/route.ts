import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await params;
    
    // Find target user
    const targetProfile = await prisma.profile.findUnique({
      where: { username },
      select: { userId: true }
    });

    if (!targetProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (targetProfile.userId === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetProfile.userId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: targetProfile.userId
          }
        }
      });
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: targetProfile.userId
        }
      });
      
      // Optionally create a notification here in the future
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Toggle follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
