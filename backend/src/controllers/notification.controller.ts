import { Request, Response, NextFunction } from 'express';
import { NotificationType } from '@prisma/client';
import type { Server } from 'socket.io';
import { prisma } from '@config/database';
import { successResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';
import { emitNotificationToUserRooms } from '@sockets/socket.handler';

const CHUNK = 500;

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query as unknown as { page: number; limit: number; isRead?: boolean };
    const p = q.page;
    const l = q.limit;
    const userId = req.user!.id;

    const where: { userId: string; isRead?: boolean } = { userId };
    if (typeof q.isRead === 'boolean') {
      where.isRead = q.isRead;
    }

    const [rows, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved',
      data: rows,
      meta: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l) || 0,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });
    successResponse(res, { count }, 'Unread count');
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Notification not found', 404);
    }

    if (!existing.isRead) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });
    }

    successResponse(res, { id }, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    successResponse(res, { updated: result.count }, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const broadcastToAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, message, type } = req.body as { title: string; message: string; type: NotificationType };

    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    if (users.length === 0) {
      throw new AppError('No active users to notify', 400);
    }

    const userIds = users.map((u) => u.id);
    const data = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      entityType: 'broadcast',
    }));

    for (let i = 0; i < data.length; i += CHUNK) {
      await prisma.notification.createMany({ data: data.slice(i, i + CHUNK) });
    }

    const io = req.app.get('io') as Server | undefined;
    if (io) {
      emitNotificationToUserRooms(io, userIds, { title, message, type });
    }

    successResponse(
      res,
      { recipientCount: userIds.length },
      'Notification sent to all users',
      201
    );
  } catch (error) {
    next(error);
  }
};
