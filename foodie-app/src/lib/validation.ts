import { z } from 'zod';

// ─── Auth ───

export const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(1, 'Display name is required').max(50).trim(),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// ─── Profile ───

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  cityId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().optional(),
});

// ─── Places ───

export const CreatePlaceSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  address: z.string().min(1).max(500).trim(),
  cityId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  categoryId: z.string().uuid(),
  description: z.string().max(2000).trim().optional(),
  priceLevel: z.number().int().min(1).max(4).optional(),
  phone: z.string().max(20).optional(),
  websiteUrl: z.string().url().max(500).optional(),
  cuisineIds: z.array(z.string().uuid()).max(10).optional(),
});

// ─── Posts ───

export const CreatePostSchema = z.object({
  placeId: z.string().uuid(),
  caption: z.string().min(1, 'Write something about your experience').max(2000).trim(),
  foodRating: z.number().min(1).max(5).multipleOf(0.5),
  vibeRating: z.number().min(1).max(5).multipleOf(0.5),
  serviceRating: z.number().min(1).max(5).multipleOf(0.5),
  vibeIds: z.array(z.string().uuid()).max(5).optional(),
});

// ─── Visits ───

export const LogVisitSchema = z.object({
  placeId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  foodRating: z.number().min(1).max(5).multipleOf(0.5),
  vibeRating: z.number().min(1).max(5).multipleOf(0.5),
  serviceRating: z.number().min(1).max(5).multipleOf(0.5),
  caption: z.string().max(2000).trim().optional(),
  vibeIds: z.array(z.string().uuid()).max(5).optional(),
});

// ─── Comments ───

export const CreateCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(1000).trim(),
});

// ─── Collections ───

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  isPublic: z.boolean().optional(),
  isList: z.boolean().optional(),
});

export const AddToCollectionSchema = z.object({
  placeId: z.string().uuid(),
  note: z.string().max(500).trim().optional(),
});

// ─── Reports ───

export const CreateReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'USER', 'PLACE', 'VISIT']),
  targetId: z.string().uuid(),
  reason: z.enum([
    'SPAM',
    'FAKE_CONTENT',
    'HARASSMENT',
    'INAPPROPRIATE',
    'INCORRECT_PLACE',
    'FRAUDULENT_VISIT',
    'PROMOTIONAL',
    'OTHER',
  ]),
  description: z.string().max(1000).trim().optional(),
});

// ─── Search ───

export const SearchSchema = z.object({
  q: z.string().min(1).max(200).trim(),
  type: z.enum(['places', 'posts', 'users', 'vibes', 'lists']).optional(),
  categoryId: z.string().uuid().optional(),
  vibeIds: z.array(z.string().uuid()).optional(),
  cuisineIds: z.array(z.string().uuid()).optional(),
  priceLevel: z.number().int().min(1).max(4).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius: z.number().min(100).max(50000).optional(), // meters
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

// ─── Pagination ───

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
