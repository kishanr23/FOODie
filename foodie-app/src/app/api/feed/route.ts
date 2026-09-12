import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'general');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await getCurrentUser();
    
    // For MVP, we'll fetch a mix of posts:
    // 1. Posts from people the user follows (if logged in)
    // 2. Recent global posts
    
    let feedPosts: any[] = [];
    
    if (user) {
      // Get IDs of users the current user is following
      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
      });
      
      const followingIds = following.map(f => f.followingId);
      // Include the user's own posts too
      followingIds.push(user.id);

      const followedPosts = await prisma.post.findMany({
        where: { 
          userId: { in: followingIds },
          status: 'ACTIVE' 
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
          place: { select: { name: true, slug: true, category: true, priceLevel: true } },
          media: true,
          vibes: { include: { vibe: true } },
          _count: { select: { likes: true, comments: true } }
        }
      });
      
      feedPosts = [...followedPosts];
      
      // If feed is thin, backfill with global recent posts
      if (feedPosts.length < 10) {
        const backfill = await prisma.post.findMany({
          where: { 
            userId: { notIn: followingIds },
            status: 'ACTIVE' 
          },
          take: 10 - feedPosts.length,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { include: { profile: true } },
            place: { select: { name: true, slug: true, category: true, priceLevel: true } },
            media: true,
            vibes: { include: { vibe: true } },
            _count: { select: { likes: true, comments: true } }
          }
        });
        feedPosts = [...feedPosts, ...backfill];
      }
    } else {
      // Unauthenticated feed: just recent global posts
      feedPosts = await prisma.post.findMany({
        where: { status: 'ACTIVE' },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
          place: { select: { name: true, slug: true, category: true, priceLevel: true } },
          media: true,
          vibes: { include: { vibe: true } },
          _count: { select: { likes: true, comments: true } }
        }
      });
    }

    // Sort the combined feed by date descending
    feedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // In a real app, we would add pagination logic here
    
    // Add isLikedByMe flag for authenticated users
    if (user && feedPosts.length > 0) {
      const postIds = feedPosts.map(p => p.id);
      const likes = await prisma.like.findMany({
        where: {
          userId: user.id,
          postId: { in: postIds }
        }
      });
      
      const likedPostIds = new Set(likes.map(l => l.postId));
      feedPosts = feedPosts.map(p => ({
        ...p,
        isLikedByMe: likedPostIds.has(p.id)
      }));
    }

    return NextResponse.json({ posts: feedPosts });
  } catch (error) {
    console.error('Fetch feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
