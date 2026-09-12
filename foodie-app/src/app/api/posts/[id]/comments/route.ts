import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const CommentSchema = z.object({
  content: z.string().min(1).max(1000)
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const comments = await prisma.comment.findMany({
      where: { postId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, profile: { select: { username: true, displayName: true, avatarUrl: true } } } }
      }
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: postId } = await params;
    const body = await req.json();
    const result = CommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const comment = await prisma.comment.create({
      data: {
        content: result.data.content,
        userId: user.id,
        postId
      },
      include: {
        user: { select: { id: true, profile: { select: { username: true, displayName: true, avatarUrl: true } } } }
      }
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
