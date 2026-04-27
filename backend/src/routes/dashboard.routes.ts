import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import * as dashboardController from '@controllers/dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', requirePermission(Permission.DASHBOARD_READ), dashboardController.getDashboardStats);
router.get('/attendance-trends', requirePermission(Permission.DASHBOARD_READ), dashboardController.getAttendanceTrends);
router.get('/giving-summary', requirePermission(Permission.DASHBOARD_READ), dashboardController.getGivingSummary);
router.get('/recent-activity', requirePermission(Permission.DASHBOARD_READ), dashboardController.getRecentActivity);

export default router;

