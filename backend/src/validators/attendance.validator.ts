import { z } from 'zod';

export const attendanceSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(['SUNDAY_SERVICE', 'MIDWEEK_SERVICE', 'PRAYER_MEETING', 'DEPARTMENTAL', 'SPECIAL_EVENT', 'VISITOR']),
  serviceName: z.string().optional(),
  menCount: z.number().int().min(0).default(0),
  womenCount: z.number().int().min(0).default(0),
  childrenCount: z.number().int().min(0).default(0),
  youthCount: z.number().int().min(0).default(0),
  visitorCount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  individualRecords: z.array(z.object({
    memberId: z.string().uuid().optional(),
    visitorName: z.string().optional(),
    visitorPhone: z.string().optional(),
    visitorEmail: z.string().email().optional(),
    isFirstTime: z.boolean().default(false),
    notes: z.string().optional(),
  })).optional(),
});

export const attendanceQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['SUNDAY_SERVICE', 'MIDWEEK_SERVICE', 'PRAYER_MEETING', 'DEPARTMENTAL', 'SPECIAL_EVENT', 'VISITOR']).optional(),
  departmentId: z.string().uuid().optional(),
});

