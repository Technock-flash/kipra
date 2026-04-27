import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody, validateQuery } from '@middleware/validateRequest';
import { createMemberSchema, updateMemberSchema, memberQuerySchema } from '@validators/member.validator';
import * as memberController from '@controllers/member.controller';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(memberQuerySchema), requirePermission(Permission.MEMBER_READ), memberController.getMembers);
router.post('/', validateBody(createMemberSchema), requirePermission(Permission.MEMBER_CREATE), memberController.createMember);
router.get('/:id', requirePermission(Permission.MEMBER_READ), memberController.getMemberById);
router.put('/:id', validateBody(updateMemberSchema), requirePermission(Permission.MEMBER_UPDATE), memberController.updateMember);
router.delete('/:id', requirePermission(Permission.MEMBER_DELETE), memberController.deleteMember);
router.post('/:id/restore', requirePermission(Permission.DELETED_RECORDS_RESTORE), memberController.restoreMember);

export default router;

