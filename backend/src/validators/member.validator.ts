import { z } from 'zod';

export const createMemberSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  phoneSecondary: z.string().optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE']).optional().nullable(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default('Ghana'),
  occupation: z.string().optional().nullable(),
  employer: z.string().optional().nullable(),
  joinDate: z.string().datetime().optional().nullable(),
  baptized: z.boolean().default(false),
  baptizedDate: z.string().datetime().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  isLeader: z.boolean().default(false),
  leaderRole: z.string().optional().nullable(),
  emergencyName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
});

export const updateMemberSchema = createMemberSchema.partial();

export const memberQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  isLeader: z.string().transform((val) => val === 'true').optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

