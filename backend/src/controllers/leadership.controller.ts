import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse, paginatedResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// DEPARTMENTS
export const getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 50 } = req.query as any;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 50);
    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where: { deletedAt: null },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { members: true, leaders: true } },
        },
      }),
      prisma.department.count({ where: { deletedAt: null } }),
    ]);
    paginatedResponse(res, departments, total, pageNumber, limitNumber, 'Departments retrieved');
  } catch (error) { next(error); }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const department = await prisma.department.create({ data: req.body });
    successResponse(res, department, 'Department created', 201);
  } catch (error) { next(error); }
};

export const getDepartmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const department = await prisma.department.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        members: { where: { deletedAt: null }, select: { id: true, firstName: true, lastName: true } },
        leaders: { where: { deletedAt: null } },
      },
    });
    if (!department) throw new AppError('Department not found', 404);
    successResponse(res, department, 'Department retrieved');
  } catch (error) { next(error); }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
    });
    successResponse(res, department, 'Department updated');
  } catch (error) { next(error); }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.department.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    successResponse(res, null, 'Department deleted');
  } catch (error) { next(error); }
};

// LEADERS
export const getLeaders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, departmentId } = req.query as any;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 10);
    const where: any = { deletedAt: null };
    if (departmentId) where.departmentId = departmentId;

    const [leaders, total] = await Promise.all([
      prisma.leader.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: { department: true },
      }),
      prisma.leader.count({ where }),
    ]);
    paginatedResponse(res, leaders, total, pageNumber, limitNumber, 'Leaders retrieved');
  } catch (error) { next(error); }
};

export const createLeader = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leader = await prisma.leader.create({
      data: req.body,
      include: { department: true },
    });
    successResponse(res, leader, 'Leader created', 201);
  } catch (error) { next(error); }
};

export const getLeaderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leader = await prisma.leader.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { department: true },
    });
    if (!leader) throw new AppError('Leader not found', 404);
    successResponse(res, leader, 'Leader retrieved');
  } catch (error) { next(error); }
};

export const updateLeader = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leader = await prisma.leader.update({
      where: { id: req.params.id },
      data: req.body,
      include: { department: true },
    });
    successResponse(res, leader, 'Leader updated');
  } catch (error) { next(error); }
};

export const deleteLeader = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.leader.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    successResponse(res, null, 'Leader deleted');
  } catch (error) { next(error); }
};

