import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const currentUser = await getCurrentUser();

    const profile = await prisma.profile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            role: true,
            _count: {
              select: {
                followers: true,
                following: true,
                posts: { where: { status: 'ACTIVE' } },
                saves: true,
              }
            }
          }
        },
        city: true
      }
    });

    if (!profile || profile.user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user is following this profile
    let isFollowing = false;
    if (currentUser && currentUser.id !== profile.user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: profile.user.id
          }
        }
      });
      isFollowing = !!follow;
    }

    // Fetch recent posts
    const recentPosts = await prisma.post.findMany({
      where: { userId: profile.user.id, status: 'ACTIVE' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        place: { select: { name: true, slug: true, category: true, priceLevel: true } },
        media: true,
        visit: { include: { rating: true } },
        vibes: { include: { vibe: true } },
        _count: { select: { likes: true, comments: true } }
      }
    });

    return NextResponse.json({
      profile: {
        id: profile.userId,
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        city: profile.city?.name,
        isPublic: profile.isPublic,
        role: profile.user.role,
      },
      stats: {
        followers: profile.user._count.followers,
        following: profile.user._count.following,
        posts: profile.user._count.posts,
        saves: profile.user._count.saves,
      },
      isFollowing,
      posts: recentPosts
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
