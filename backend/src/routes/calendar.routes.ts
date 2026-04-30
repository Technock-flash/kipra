import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody, validateQuery } from '@middleware/validateRequest';
import {
  eventSchema,
  eventUpdateSchema,
  eventQuerySchema,
  eventSeriesSchema,
  eventSeriesQuerySchema,
  calendarViewSchema,
  yearlyCalendarSchema,
  reminderBodySchema,
  conflictQuerySchema,
  exportOptionsSchema,
  syncSettingsSchema,
  syncStatusQuerySchema,
} from '@validators/calendar.validator';
import * as calendarController from '@controllers/calendar.controller';

const router = Router();

router.use(authenticate);

// --- Static paths first (avoid being captured by "/:id") ---
router.get(
  '/filters/departments',
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getFilterDepartments
);
router.get(
  '/filters/branches',
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getFilterBranches
);
router.get(
  '/filters/types',
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getFilterEventTypes
);
router.get(
  '/filters/leadership',
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getFilterLeadershipGroups
);

router.get(
  '/view',
  validateQuery(calendarViewSchema),
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getCalendarView
);
router.get(
  '/conflicts',
  validateQuery(conflictQuerySchema),
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getConflicts
);

router.post(
  '/recurring-program',
  validateBody(eventSeriesSchema),
  requirePermission(Permission.CALENDAR_RECURRING_MANAGE),
  calendarController.createRecurringProgram
);
router.get(
  '/recurring-programs',
  validateQuery(eventSeriesQuerySchema),
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getRecurringPrograms
);
router.get(
  '/recurring-programs/:programId',
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getRecurringProgramById
);
router.put(
  '/recurring-programs/:programId',
  validateBody(eventSeriesSchema.partial()),
  requirePermission(Permission.CALENDAR_RECURRING_MANAGE),
  calendarController.updateRecurringProgram
);
router.delete(
  '/recurring-programs/:programId',
  requirePermission(Permission.CALENDAR_RECURRING_MANAGE),
  calendarController.deleteRecurringProgram
);

router.get(
  '/series/:id',
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getRecurringProgramById
);

router.post(
  '/generate-yearly',
  validateBody(yearlyCalendarSchema),
  requirePermission(Permission.CALENDAR_YEARLY_GENERATE),
  calendarController.generateYearlyCalendar
);

router.post(
  '/export',
  validateBody(exportOptionsSchema),
  requirePermission(Permission.CALENDAR_EXPORT),
  calendarController.exportCalendar
);

router.post(
  '/sync/connect',
  validateBody(syncSettingsSchema),
  requirePermission(Permission.CALENDAR_SYNC),
  calendarController.connectSyncAccount
);
router.get(
  '/sync/status',
  validateQuery(syncStatusQuerySchema),
  requirePermission(Permission.CALENDAR_SYNC),
  calendarController.getSyncStatus
);
router.delete(
  '/sync/:id',
  requirePermission(Permission.CALENDAR_SYNC),
  calendarController.disconnectSyncAccount
);

// --- Event CRUD (list + create) ---
router.get(
  '/',
  validateQuery(eventQuerySchema),
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getEvents
);
router.post(
  '/',
  validateBody(eventSchema),
  requirePermission(Permission.CALENDAR_CREATE),
  calendarController.createEvent
);

// --- Per-event routes (":id" is an event UUID) ---
router.post(
  '/:id/reminder',
  validateBody(reminderBodySchema),
  requirePermission(Permission.CALENDAR_UPDATE),
  calendarController.setEventReminder
);
router.get(
  '/:id/reminders',
  requirePermission(Permission.CALENDAR_READ),
  calendarController.getEventReminders
);
router.delete(
  '/:id/reminder',
  requirePermission(Permission.CALENDAR_UPDATE),
  calendarController.deleteEventReminder
);

router.get('/:id', requirePermission(Permission.CALENDAR_READ), calendarController.getEventById);
router.put(
  '/:id',
  validateBody(eventUpdateSchema),
  requirePermission(Permission.CALENDAR_UPDATE),
  calendarController.updateEvent
);
router.delete('/:id', requirePermission(Permission.CALENDAR_DELETE), calendarController.deleteEvent);

export default router;
