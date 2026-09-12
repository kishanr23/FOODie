import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(ip, 'general');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as 'avatars' | 'posts' | 'places';

    if (!file || !bucket) {
      return NextResponse.json({ error: 'Missing file or bucket parameter' }, { status: 400 });
    }

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Basic MIME type check
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique path
    const extension = file.name.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const filePath = `${user.id}/${uniqueName}`;

    const url = await uploadFile(bucket, buffer, filePath, file.type);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
