import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody } from '@middleware/validateRequest';
import { registerAdminUserSchema } from '@validators/auth.validator';
import { prisma } from '@config/database';
import { successResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.USER_READ), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    successResponse(res, users, 'Users retrieved');
  } catch (error) {
    next(error);
  }
});

router.post('/', requirePermission(Permission.USER_CREATE), validateBody(registerAdminUserSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role, linkedMemberId } = req.body;
    const requestedRole: UserRole = role || UserRole.LEADER;
    const currentUserRole = req.user?.role as UserRole;

    if (
      currentUserRole === UserRole.ADMIN &&
      ![UserRole.APOSTLE, UserRole.LEADER, UserRole.MEMBER].includes(requestedRole)
    ) {
      throw new AppError('Admin can only create Apostle, Leader, or Member portal accounts', 403);
    }

    if (currentUserRole !== UserRole.SUPER_ADMIN && requestedRole === UserRole.SUPER_ADMIN) {
      throw new AppError('Only Super Admin can create Super Admin accounts', 403);
    }

    if (requestedRole === UserRole.MEMBER) {
      if (!linkedMemberId) {
        throw new AppError('Member portal accounts must be linked to a member record (linkedMemberId)', 400);
      }
      const member = await prisma.member.findFirst({
        where: { id: linkedMemberId, deletedAt: null },
      });
      if (!member) {
        throw new AppError('Member record not found', 404);
      }
      const linked = await prisma.user.findFirst({
        where: { linkedMemberId, deletedAt: null },
      });
      if (linked) {
        throw new AppError('This member is already linked to another user account', 409);
      }
    } else if (linkedMemberId) {
      throw new AppError('linkedMemberId is only valid for MEMBER role', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
      throw new AppError('A user with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: requestedRole,
        status: 'ACTIVE',
        ...(requestedRole === UserRole.MEMBER && linkedMemberId ? { linkedMemberId } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    successResponse(res, user, 'User account created successfully', 201);
  } catch (error) {
    next(error);
  }
});

export default router;

