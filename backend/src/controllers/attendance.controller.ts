import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse, paginatedResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';

export const getAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, startDate, endDate, type, departmentId } = req.query as any;
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (type) where.type = type;
    if (departmentId) where.departmentId = departmentId;

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          department: { select: { name: true } },
          event: { select: { title: true } },
          recordedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    paginatedResponse(res, attendance, total, page, limit, 'Attendance records retrieved');
  } catch (error) { next(error); }
};

export const createAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { individualRecords, ...attendanceData } = req.body;
    
    const totalCount = 
      (attendanceData.menCount || 0) +
      (attendanceData.womenCount || 0) +
      (attendanceData.childrenCount || 0) +
      (attendanceData.youthCount || 0) +
      (attendanceData.visitorCount || 0);

    const attendance = await prisma.attendance.create({
      data: {
        ...attendanceData,
        totalCount,
        recordedById: req.user!.id,
        individualRecords: individualRecords ? {
          create: individualRecords,
        } : undefined,
      },
      include: {
        individualRecords: true,
        department: true,
      },
    });

    successResponse(res, attendance, 'Attendance recorded', 201);
  } catch (error) { next(error); }
};

export const getAttendanceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const attendance = await prisma.attendance.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        individualRecords: true,
        department: true,
        event: true,
        recordedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!attendance) throw new AppError('Attendance record not found', 404);
    successResponse(res, attendance, 'Attendance record retrieved');
  } catch (error) { next(error); }
};

export const updateAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { individualRecords, ...attendanceData } = req.body;
    
    const totalCount = 
      (attendanceData.menCount || 0) +
      (attendanceData.womenCount || 0) +
      (attendanceData.childrenCount || 0) +
      (attendanceData.youthCount || 0) +
      (attendanceData.visitorCount || 0);

    const attendance = await prisma.attendance.update({
      where: { id: req.params.id },
      data: {
        ...attendanceData,
        totalCount,
      },
      include: {
        individualRecords: true,
        department: true,
      },
    });

    successResponse(res, attendance, 'Attendance updated');
  } catch (error) { next(error); }
};

export const deleteAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.attendance.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    successResponse(res, null, 'Attendance record deleted');
  } catch (error) { next(error); }
};

