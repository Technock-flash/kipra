import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody, validateQuery } from '@middleware/validateRequest';
import { eventSchema, eventQuerySchema } from '@validators/calendar.validator';
import * as calendarController from '@controllers/calendar.controller';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(eventQuerySchema), requirePermission(Permission.CALENDAR_READ), calendarController.getEvents);
router.post('/', validateBody(eventSchema), requirePermission(Permission.CALENDAR_CREATE), calendarController.createEvent);
router.get('/:id', requirePermission(Permission.CALENDAR_READ), calendarController.getEventById);
router.put('/:id', validateBody(eventSchema), requirePermission(Permission.CALENDAR_UPDATE), calendarController.updateEvent);
router.delete('/:id', requirePermission(Permission.CALENDAR_DELETE), calendarController.deleteEvent);

export default router;

