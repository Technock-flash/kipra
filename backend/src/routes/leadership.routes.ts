import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import * as leadershipController from '@controllers/leadership.controller';

const router = Router();

router.use(authenticate);

router.get('/departments', requirePermission(Permission.LEADERSHIP_READ), leadershipController.getDepartments);
router.post('/departments', requirePermission(Permission.LEADERSHIP_CREATE), leadershipController.createDepartment);
router.get('/departments/:id', requirePermission(Permission.LEADERSHIP_READ), leadershipController.getDepartmentById);
router.put('/departments/:id', requirePermission(Permission.LEADERSHIP_UPDATE), leadershipController.updateDepartment);
router.delete('/departments/:id', requirePermission(Permission.LEADERSHIP_DELETE), leadershipController.deleteDepartment);

router.get('/leaders', requirePermission(Permission.LEADERSHIP_READ), leadershipController.getLeaders);
router.post('/leaders', requirePermission(Permission.LEADERSHIP_CREATE), leadershipController.createLeader);
router.get('/leaders/:id', requirePermission(Permission.LEADERSHIP_READ), leadershipController.getLeaderById);
router.put('/leaders/:id', requirePermission(Permission.LEADERSHIP_UPDATE), leadershipController.updateLeader);
router.delete('/leaders/:id', requirePermission(Permission.LEADERSHIP_DELETE), leadershipController.deleteLeader);

export default router;

