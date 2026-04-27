import { Request, Response, NextFunction } from 'express';
import { AuditAction } from '@prisma/client';
import { prisma } from '@config/database';
import logger from '@utils/logger';

interface AuditContext {
  action: AuditAction;
  entityType: string;
  getEntityId?: (req: Request) => string;
  getOldValues?: (req: Request) => Promise<any>;
  getChanges?: (req: Request) => any;
}

export const auditLog = (context: AuditContext) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method to capture response
    const originalJson = res.json.bind(res);
    let responseBody: any;

    res.json = (body: any) => {
      responseBody = body;
      return originalJson(body);
    };

    // For update/delete, fetch old values before operation
    let oldValues: any = null;
    if (context.getOldValues && (context.action === 'UPDATE' || context.action === 'DELETE')) {
      try {
        oldValues = await context.getOldValues(req);
      } catch (error) {
        logger.error('Failed to fetch old values for audit:', error);
      }
    }

    // Continue with request
    res.on('finish', async () => {
      try {
        // Only log successful operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const entityId = context.getEntityId 
            ? context.getEntityId(req) 
            : req.params.id || 'unknown';

          const newValues = context.action === 'CREATE' || context.action === 'UPDATE' 
            ? req.body 
            : null;

          const changes = context.getChanges ? context.getChanges(req) : null;

          await prisma.auditLog.create({
            data: {
              action: context.action,
              entityType: context.entityType,
              entityId,
              oldValues: oldValues || undefined,
              newValues: newValues || undefined,
              changes: changes || undefined,
              userId: req.user?.id,
              userRole: req.user?.role,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });
        }
      } catch (error) {
        logger.error('Failed to create audit log:', error);
      }
    });

    next();
  };
};

export const logLogin = async (
  userId: string,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  success: boolean
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action: success ? 'LOGIN' : 'LOGIN',
        entityType: 'users',
        entityId: userId,
        userId,
        ipAddress,
        userAgent,
        newValues: { success },
      },
    });
  } catch (error) {
    logger.error('Failed to log login attempt:', error);
  }
};

export const logLogout = async (
  userId: string,
  ipAddress: string | undefined,
  userAgent: string | undefined
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        entityType: 'users',
        entityId: userId,
        userId,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    logger.error('Failed to log logout:', error);
  }
};

