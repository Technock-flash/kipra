import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody } from '@middleware/validateRequest';
import { registerSchema } from '@validators/auth.validator';
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

router.post('/', requirePermission(Permission.USER_CREATE), validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    const requestedRole: UserRole = role || UserRole.LEADER;
    const currentUserRole = req.user?.role as UserRole;

    if (currentUserRole === UserRole.ADMIN && ![UserRole.APOSTLE, UserRole.LEADER].includes(requestedRole)) {
      throw new AppError('Admin can only create Apostle and Leader accounts', 403);
    }

    if (currentUserRole !== UserRole.SUPER_ADMIN && requestedRole === UserRole.SUPER_ADMIN) {
      throw new AppError('Only Super Admin can create Super Admin accounts', 403);
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

