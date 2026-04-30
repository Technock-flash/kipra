import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '@middleware/auth';
import { requirePermission, requireRole } from '@middleware/rbac';
import { validateBody, validateQuery } from '@middleware/validateRequest';
import { Permission } from '@utils/permissions';
import * as portalController from '@controllers/portal.controller';
import {
  attendanceQuerySchema,
  eventsQuerySchema,
  givingQuerySchema,
  ministryRequestSchema,
  prayerRequestSchema,
  registerEventSchema,
  updateProfileSchema,
} from '@validators/portal.validator';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.MEMBER));

router.get('/departments', requirePermission(Permission.PORTAL_READ), portalController.getPortalDepartments);

router.get('/profile', requirePermission(Permission.PORTAL_READ), portalController.getMyProfile);
router.patch(
  '/profile',
  validateBody(updateProfileSchema),
  requirePermission(Permission.PORTAL_UPDATE),
  portalController.updateMyProfile
);

router.get(
  '/attendance',
  validateQuery(attendanceQuerySchema),
  requirePermission(Permission.PORTAL_ATTENDANCE_READ),
  portalController.getMyAttendance
);

router.get(
  '/giving',
  validateQuery(givingQuerySchema),
  requirePermission(Permission.PORTAL_FINANCE_READ),
  portalController.getMyGiving
);
router.get(
  '/giving/statement',
  validateQuery(givingQuerySchema.partial()),
  requirePermission(Permission.PORTAL_FINANCE_READ),
  portalController.generateGivingStatement
);

router.get(
  '/events',
  validateQuery(eventsQuerySchema),
  requirePermission(Permission.PORTAL_READ),
  portalController.getUpcomingEvents
);
router.post(
  '/events/register',
  validateBody(registerEventSchema),
  requirePermission(Permission.PORTAL_EVENT_REGISTER),
  portalController.registerForEvent
);
router.delete(
  '/events/:eventId/register',
  requirePermission(Permission.PORTAL_EVENT_REGISTER),
  portalController.cancelEventRegistration
);

router.post(
  '/prayer',
  validateBody(prayerRequestSchema),
  requirePermission(Permission.PORTAL_PRAYER_CREATE),
  portalController.submitPrayerRequest
);
router.get('/prayer', requirePermission(Permission.PORTAL_READ), portalController.getMyPrayerRequests);

router.post(
  '/ministry',
  validateBody(ministryRequestSchema),
  requirePermission(Permission.PORTAL_MINISTRY_REQUEST),
  portalController.requestMinistry
);
router.get('/ministry', requirePermission(Permission.PORTAL_READ), portalController.getMyMinistryRequests);

export default router;
