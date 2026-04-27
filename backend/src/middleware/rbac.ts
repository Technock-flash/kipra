import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { Permission, hasPermission } from '@utils/permissions';
import { AppError } from './errorHandler';

export const requirePermission = (permission: Permission) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!hasPermission(userRole, permission)) {
      next(
        new AppError(
          'You do not have permission to perform this action',
          403
        )
      );
      return;
    }

    next();
  };
};

export const requireAnyPermission = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const userRole = req.user.role as UserRole;
    const hasAny = permissions.some((p) => hasPermission(userRole, p));

    if (!hasAny) {
      next(
        new AppError(
          'You do not have permission to perform this action',
          403
        )
      );
      return;
    }

    next();
  };
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      next(
        new AppError(
          'You do not have the required role for this action',
          403
        )
      );
      return;
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);
export const requireAdmin = requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN);

