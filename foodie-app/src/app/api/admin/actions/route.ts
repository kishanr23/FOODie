import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const ActionSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(['DISMISS', 'HIDE_POST', 'SUSPEND_USER', 'DELETE_POST']),
  reason: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const result = ActionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { reportId, action, reason } = result.data;

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    // Use a transaction to ensure both the action and the report resolution happen together
    await prisma.$transaction(async (tx) => {
      
      // 1. Log the admin action
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action,
          targetType: report.targetType,
          targetId: report.targetId,
          reason
        }
      });

      // 2. Execute the action
      switch (action) {
        case 'HIDE_POST':
          if (report.targetType === 'POST') {
            await tx.post.update({
              where: { id: report.targetId },
              data: { status: 'HIDDEN' }
            });
          }
          break;
        case 'DELETE_POST':
          if (report.targetType === 'POST') {
            await tx.post.update({
              where: { id: report.targetId },
              data: { status: 'DELETED' }
            });
          }
          break;
        case 'SUSPEND_USER':
          if (report.targetType === 'USER' || report.targetType === 'POST') {
            // If the report was on a post, we need the user ID of the post
            let userIdToSuspend = report.targetId;
            if (report.targetType === 'POST') {
              const post = await tx.post.findUnique({ where: { id: report.targetId } });
              userIdToSuspend = post?.userId as string;
            }
            if (userIdToSuspend) {
              await tx.user.update({
                where: { id: userIdToSuspend },
                data: { status: 'SUSPENDED' }
              });
            }
          }
          break;
        case 'DISMISS':
          // No action taken on the target
          break;
      }

      // 3. Resolve the report
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: admin.id
        }
      });
      
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
