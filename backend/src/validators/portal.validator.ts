import { z } from 'zod';

// Profile update schema
export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  phoneSecondary: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

// Attendance query schema
export const attendanceQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.string().optional(),
});

// Giving query schema
export const givingQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['tithe', 'pledge', 'offering', 'all']).default('all'),
});

// Events query schema
export const eventsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  status: z.string().optional(),
  type: z.string().optional(),
});

// Event registration schema
export const registerEventSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
});

// Prayer request schema
export const prayerRequestSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  request: z.string().min(10, 'Please provide more details'),
  isPrivate: z.boolean().default(true),
  isCounseling: z.boolean().default(false),
});

// Ministry request schema
export const ministryRequestSchema = z.object({
  departmentId: z.string().uuid('Invalid department ID'),
  motivation: z.string().min(10, 'Please explain why you want to join this ministry'),
});

// Link member account schema
export const linkMemberSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
});
