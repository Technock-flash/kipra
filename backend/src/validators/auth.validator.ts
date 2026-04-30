import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const twoFactorSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6, 'Token must be 6 digits'),
});

const registerBaseSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
});

/** Public self-registration (no member portal accounts). */
export const registerPublicSchema = registerBaseSchema.extend({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'SECRETARY', 'APOSTLE', 'LEADER']).optional(),
});

/** Admin API: create users including linked MEMBER portal accounts. */
export const registerAdminUserSchema = registerBaseSchema.extend({
  role: z
    .enum(['SUPER_ADMIN', 'ADMIN', 'TREASURER', 'SECRETARY', 'APOSTLE', 'LEADER', 'MEMBER'])
    .optional(),
  linkedMemberId: z.string().uuid('Invalid member ID').optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

export const setupTwoFactorSchema = z.object({
  enable: z.boolean(),
});

