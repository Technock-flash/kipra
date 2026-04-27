import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import * as auditController from '@controllers/audit.controller';

const router = Router();

router.use(authenticate);

router.get('/logs', requirePermission(Permission.AUDIT_READ), auditController.getAuditLogs);
router.get('/deleted-records', requirePermission(Permission.DELETED_RECORDS_READ), auditController.getDeletedRecords);
router.post('/deleted-records/:id/restore', requirePermission(Permission.DELETED_RECORDS_RESTORE), auditController.restoreRecord);

export default router;

