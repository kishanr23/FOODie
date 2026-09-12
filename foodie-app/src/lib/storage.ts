import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role (never expose to client)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Buckets
export const BUCKETS = {
  AVATARS: 'avatars',
  POST_MEDIA: 'post-media',
  PLACE_COVERS: 'place-covers',
  VISIT_PHOTOS: 'visit-photos',
} as const;

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Magic bytes for image validation
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
};

export function validateFileType(buffer: Buffer, mimeType: string): boolean {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) return false;

  const magicBytes = MAGIC_BYTES[mimeType];
  if (!magicBytes) return true; // HEIC doesn't have simple magic bytes

  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) return false;
  }
  return true;
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

interface UploadResult {
  url: string;
  path: string;
}

export async function uploadFile(
  bucket: string,
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  // Validate
  if (!validateFileSize(file.length)) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  if (!validateFileType(file, mimeType)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, HEIC.');
  }

  // Generate unique filename
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const path = `${fileName}/${uniqueName}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path,
  };
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) {
    console.error(`Failed to delete file: ${error.message}`);
  }
}
