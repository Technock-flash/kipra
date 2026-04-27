import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody, validateQuery } from '@middleware/validateRequest';
import {
  notificationListQuerySchema,
  broadcastNotificationSchema,
} from '@validators/notification.validator';
import * as notificationController from '@controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/unread-count',
  requirePermission(Permission.NOTIFICATION_READ),
  notificationController.getUnreadCount
);
router.get(
  '/',
  validateQuery(notificationListQuerySchema),
  requirePermission(Permission.NOTIFICATION_READ),
  notificationController.getNotifications
);
router.post(
  '/broadcast',
  validateBody(broadcastNotificationSchema),
  requirePermission(Permission.NOTIFICATION_BROADCAST),
  notificationController.broadcastToAll
);
router.post(
  '/read-all',
  requirePermission(Permission.NOTIFICATION_READ),
  notificationController.markAllAsRead
);
router.patch(
  '/:id/read',
  requirePermission(Permission.NOTIFICATION_READ),
  notificationController.markAsRead
);

export default router;
