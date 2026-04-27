import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse, paginatedResponse, errorResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';
import * as softDeleteService from '@services/softDelete.service';

export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, departmentId, gender, isLeader, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (departmentId) where.departmentId = departmentId;
    if (gender) where.gender = gender;
    if (isLeader !== undefined) where.isLeader = isLeader;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.member.count({ where }),
    ]);

    paginatedResponse(res, members, total, page, limit, 'Members retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memberNumber = `KPRA-${Date.now()}`;
    
    const member = await prisma.member.create({
      data: {
        ...req.body,
        memberNumber,
        createdById: req.user?.id,
      },
      include: {
        department: true,
      },
    });

    successResponse(res, member, 'Member created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const member = await prisma.member.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        attendances: {
          take: 10,
          orderBy: { date: 'desc' },
        },
        tithes: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    successResponse(res, member, 'Member retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.member.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new AppError('Member not found', 404);
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...req.body,
        updatedById: req.user?.id,
      },
      include: {
        department: true,
      },
    });

    successResponse(res, member, 'Member updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    await softDeleteService.softDelete({
      entityType: 'member',
      entityId: id,
      deletedById: req.user?.id,
      deletedByRole: req.user?.role,
    });

    successResponse(res, null, 'Member deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const restoreMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const restored = await softDeleteService.restoreRecord(id, req.user?.id);
    successResponse(res, restored, 'Member restored successfully');
  } catch (error) {
    next(error);
  }
};

