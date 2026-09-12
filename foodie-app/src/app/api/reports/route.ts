import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

const ReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'USER', 'PLACE', 'VISIT']),
  targetId: z.string().uuid(),
  reason: z.enum(['SPAM', 'FAKE_CONTENT', 'HARASSMENT', 'INAPPROPRIATE', 'INCORRECT_PLACE', 'FRAUDULENT_VISIT', 'PROMOTIONAL', 'OTHER']),
  description: z.string().max(1000).optional()
});

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'reports');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many reports submitted recently' }, { status: 429 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = ReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid report data', details: result.error.format() }, { status: 400 });
    }

    const { targetType, targetId, reason, description } = result.data;

    // Check if user already reported this entity to prevent spamming
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: user.id,
        targetType,
        targetId,
        status: { in: ['PENDING', 'REVIEWED'] }
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this content' }, { status: 409 });
    }

    // Since targetId is polymorphic in the DB design, we just store it.
    // The relations are optional and we don't strictly connect them in the Prisma schema to avoid complex checks,
    // but we can connect the specific relation if needed. For MVP, just storing the ID and Type is enough.
    const reportData: any = {
      reporterId: user.id,
      targetType,
      targetId,
      reason,
      description,
    };

    // To satisfy Prisma's foreign key constraints for the optional relation fields
    if (targetType === 'USER') reportData.reportedUser = { connect: { id: targetId } };
    if (targetType === 'POST') reportData.post = { connect: { id: targetId } };
    if (targetType === 'PLACE') reportData.place = { connect: { id: targetId } };

    const report = await prisma.report.create({
      data: reportData
    });

    return NextResponse.json({ success: true, reportId: report.id }, { status: 201 });
  } catch (error) {
    console.error('Submit report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
