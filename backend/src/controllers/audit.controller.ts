import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse, paginatedResponse } from '@utils/response';
import * as softDeleteService from '@services/softDelete.service';

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, entityType, action, userId, startDate, endDate } = req.query as any;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 20);
    const where: any = {};

    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    paginatedResponse(res, logs, total, pageNumber, limitNumber, 'Audit logs retrieved');
  } catch (error) { next(error); }
};

export const getDeletedRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, entityType } = req.query as any;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 20);
    const result = await softDeleteService.getDeletedRecords(entityType, pageNumber, limitNumber);
    paginatedResponse(res, result.records, result.total, result.page, result.limit, 'Deleted records retrieved');
  } catch (error) { next(error); }
};

export const restoreRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restored = await softDeleteService.restoreRecord(id, req.user?.id);
    successResponse(res, restored, 'Record restored successfully');
  } catch (error) { next(error); }
};

