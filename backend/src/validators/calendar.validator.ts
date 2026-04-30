import { z } from 'zod';

// ==========================================
// Event Validation Schemas
// ==========================================

export const eventSchema = z.object({
  title: z.string().min(2, 'Event title is required'),
  description: z.string().optional(),
  type: z.enum([
    'SERVICE',
    'MEETING',
    'CONFERENCE',
    'TRAINING',
    'SOCIAL',
    'OUTREACH',
    'YOUTH_PROGRAM',
    'DEPARTMENTAL',
    'LEADERSHIP_MEETING',
    'FASTING_PROGRAM',
    'HOLIDAY',
    'SPECIAL_OCCASION',
    'OTHER'
  ]).default('SERVICE'),
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED']).default('SCHEDULED'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  
  // Timing
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  allDay: z.boolean().default(false),
  recurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  
  // Location
  location: z.string().optional(),
  venue: z.string().optional(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().url().optional().or(z.literal('')),
  
  // Organization
  departmentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  leadershipGroup: z.string().optional(),
  organizerId: z.string().uuid().optional(),
  
  // Registration & Attendance
  registrationRequired: z.boolean().default(false),
  maxAttendees: z.number().int().positive().optional(),
  expectedAttendees: z.number().int().min(0).optional(),
  
  // External Sync
  syncExternalId: z.string().optional(),
  seriesId: z.string().uuid().optional(),
  
  // Color for calendar display
  color: z.string().optional(),
});

export const eventQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum([
    'SERVICE',
    'MEETING',
    'CONFERENCE',
    'TRAINING',
    'SOCIAL',
    'OUTREACH',
    'YOUTH_PROGRAM',
    'DEPARTMENTAL',
    'LEADERSHIP_MEETING',
    'FASTING_PROGRAM',
    'HOLIDAY',
    'SPECIAL_OCCASION',
    'OTHER'
  ]).optional(),
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED']).optional(),
  departmentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  leadershipGroup: z.string().optional(),
  search: z.string().optional(),
  view: z.enum(['month', 'year', 'agenda']).default('month'),
});

// ==========================================
// Event Series (Recurring Program) Schemas
// ==========================================

export const eventSeriesSchema = z.object({
  name: z.string().min(2, 'Series name is required'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  
  // Base template for recurring events
  title: z.string().min(2, 'Event title is required'),
  description: z.string().optional(),
  type: z.enum([
    'SERVICE',
    'MEETING',
    'CONFERENCE',
    'TRAINING',
    'SOCIAL',
    'OUTREACH',
    'YOUTH_PROGRAM',
    'DEPARTMENTAL',
    'LEADERSHIP_MEETING',
    'FASTING_PROGRAM',
    'HOLIDAY',
    'SPECIAL_OCCASION',
    'OTHER'
  ]).default('SERVICE'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  location: z.string().optional(),
  venue: z.string().optional(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().url().optional().or(z.literal('')),
  
  // Organization
  departmentId: z.string().uuid().optional(),
  organizerId: z.string().uuid().optional(),
  
  // Recurrence pattern (optional — server can derive from frequency / byDay / dates)
  recurrenceRule: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  count: z.number().int().positive().optional(),
  interval: z.number().int().min(1).default(1),
  byDay: z.string().optional(), // MO,TU,WE,TH,FR,SA,SU
  byMonthDay: z.number().int().min(1).max(31).optional(),
  byMonth: z.number().int().min(1).max(12).optional(),
  until: z.string().datetime().optional(),
  
  // Registration
  registrationRequired: z.boolean().default(false),
  maxAttendees: z.number().int().positive().optional(),
  
  // Color
  color: z.string().optional(),
});

export const eventSeriesQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  departmentId: z.string().uuid().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
});

// ==========================================
// Calendar View Schemas
// ==========================================

export const calendarViewSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  view: z.enum(['month', 'year', 'week', 'agenda']).default('month'),
  departmentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  type: z.enum([
    'SERVICE',
    'MEETING',
    'CONFERENCE',
    'TRAINING',
    'SOCIAL',
    'OUTREACH',
    'YOUTH_PROGRAM',
    'DEPARTMENTAL',
    'LEADERSHIP_MEETING',
    'FASTING_PROGRAM',
    'HOLIDAY',
    'SPECIAL_OCCASION',
    'OTHER'
  ]).optional(),
  leadershipGroup: z.string().optional(),
});

// ==========================================
// Yearly Calendar Generation Schema
// ==========================================

export const yearlyCalendarSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  departmentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  includeRecurring: z.boolean().default(true),
  includeOneTime: z.boolean().default(true),
  conflictDetection: z.boolean().default(true),
});

// ==========================================
// Reminder Schemas
// ==========================================

export const reminderSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(['EMAIL', 'SMS', 'PUSH', 'BOTH']).default('BOTH'),
  minutesBefore: z.number().int().min(5).max(10080).default(30), // 5 min to 7 days
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
});

/** Reminder body when `eventId` comes from the URL (`POST /calendar/:id/reminder`) */
export const reminderBodySchema = reminderSchema.omit({ eventId: true });

export const reminderQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  pending: z.boolean().optional(),
  sent: z.boolean().optional(),
});

// ==========================================
// Conflict Detection Schema
// ==========================================

export const conflictQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  location: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  leadershipGroup: z.string().optional(),
  excludeEventId: z.string().uuid().optional(),
});

// ==========================================
// Export Schemas
// ==========================================

export const exportOptionsSchema = z.object({
  format: z.enum(['PDF', 'EXCEL', 'ICS', 'CSV']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  departmentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  type: z.enum([
    'SERVICE',
    'MEETING',
    'CONFERENCE',
    'TRAINING',
    'SOCIAL',
    'OUTREACH',
    'YOUTH_PROGRAM',
    'DEPARTMENTAL',
    'LEADERSHIP_MEETING',
    'FASTING_PROGRAM',
    'HOLIDAY',
    'SPECIAL_OCCASION',
    'OTHER'
  ]).optional(),
  leadershipGroup: z.string().optional(),
  includeDescription: z.boolean().default(true),
  includeVenue: z.boolean().default(true),
  colorCoded: z.boolean().default(true),
  pageSize: z.enum(['A4', 'LETTER']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
});

// ==========================================
// Sync Schemas
// ==========================================

export const syncSettingsSchema = z.object({
  provider: z.enum(['GOOGLE', 'OUTLOOK']),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  tokenExpiry: z.string().datetime(),
  externalCalendarId: z.string().optional(),
  syncEnabled: z.boolean().default(true),
});

export const syncStatusQuerySchema = z.object({
  provider: z.enum(['GOOGLE', 'OUTLOOK']).optional(),
});

// ==========================================
// Filter Schemas
// ==========================================

export const calendarFiltersSchema = z.object({
  departments: z.boolean().default(true),
  branches: z.boolean().default(true),
  eventTypes: z.boolean().default(true),
  leadershipGroups: z.boolean().default(true),
});

// ==========================================
// Type Exports
// ==========================================

/** Partial updates for PUT /calendar/:id */
export const eventUpdateSchema = eventSchema.partial();

export type EventInput = z.infer<typeof eventSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type EventQuery = z.infer<typeof eventQuerySchema>;
export type EventSeriesInput = z.infer<typeof eventSeriesSchema>;
export type EventSeriesQuery = z.infer<typeof eventSeriesQuerySchema>;
export type CalendarViewInput = z.infer<typeof calendarViewSchema>;
export type YearlyCalendarInput = z.infer<typeof yearlyCalendarSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type ReminderQuery = z.infer<typeof reminderQuerySchema>;
export type ConflictQuery = z.infer<typeof conflictQuerySchema>;
export type ExportOptions = z.infer<typeof exportOptionsSchema>;
export type SyncSettings = z.infer<typeof syncSettingsSchema>;
export type SyncStatusQuery = z.infer<typeof syncStatusQuerySchema>;
export type CalendarFilters = z.infer<typeof calendarFiltersSchema>;
