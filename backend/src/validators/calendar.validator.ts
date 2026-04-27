import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(2, 'Event title is required'),
  description: z.string().optional(),
  type: z.enum(['SERVICE', 'MEETING', 'CONFERENCE', 'TRAINING', 'SOCIAL', 'OUTREACH', 'OTHER']).default('SERVICE'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  recurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().url().optional(),
  departmentId: z.string().uuid().optional(),
});

export const eventQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['SERVICE', 'MEETING', 'CONFERENCE', 'TRAINING', 'SOCIAL', 'OUTREACH', 'OTHER']).optional(),
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED']).optional(),
});

