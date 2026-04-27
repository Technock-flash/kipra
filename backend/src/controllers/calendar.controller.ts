import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse, paginatedResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';

export const getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, startDate, endDate, type, status } = req.query as any;
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }
    if (type) where.type = type;
    if (status) where.status = status;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          department: { select: { name: true, color: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    paginatedResponse(res, events, total, page, limit, 'Events retrieved');
  } catch (error) { next(error); }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await prisma.event.create({
      data: {
        ...req.body,
        createdById: req.user!.id,
      },
      include: {
        department: true,
      },
    });
    successResponse(res, event, 'Event created', 201);
  } catch (error) { next(error); }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        department: true,
        attendance: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!event) throw new AppError('Event not found', 404);
    successResponse(res, event, 'Event retrieved');
  } catch (error) { next(error); }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body,
      include: { department: true },
    });
    successResponse(res, event, 'Event updated');
  } catch (error) { next(error); }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.event.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    successResponse(res, null, 'Event deleted');
  } catch (error) { next(error); }
};

