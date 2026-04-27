import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody, validateQuery } from '@middleware/validateRequest';
import { attendanceSchema, attendanceQuerySchema } from '@validators/attendance.validator';
import * as attendanceController from '@controllers/attendance.controller';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(attendanceQuerySchema), requirePermission(Permission.ATTENDANCE_READ), attendanceController.getAttendance);
router.post('/', validateBody(attendanceSchema), requirePermission(Permission.ATTENDANCE_CREATE), attendanceController.createAttendance);
router.get('/:id', requirePermission(Permission.ATTENDANCE_READ), attendanceController.getAttendanceById);
router.put('/:id', validateBody(attendanceSchema), requirePermission(Permission.ATTENDANCE_UPDATE), attendanceController.updateAttendance);
router.delete('/:id', requirePermission(Permission.ATTENDANCE_DELETE), attendanceController.deleteAttendance);

export default router;

