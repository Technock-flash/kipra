import { NextFunction, Request, Response } from 'express';
import { prisma } from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { paginatedResponse, successResponse } from '@utils/response';

const db = prisma as any;

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getLinkedMemberId = (req: Request): string => {
  const memberId = (req.user as any)?.linkedMemberId;
  if (!memberId) {
    throw new AppError('No member profile linked to this account', 403);
  }
  return memberId;
};

export const getPortalDepartments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departments = await db.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true },
    });
    successResponse(res, departments, 'Departments retrieved');
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const profile = await db.member.findFirst({
      where: { id: memberId, deletedAt: null },
      include: {
        department: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!profile) {
      throw new AppError('Member profile not found', 404);
    }

    successResponse(res, profile, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const oldMember = await db.member.findUnique({ where: { id: memberId } });
    if (!oldMember || oldMember.deletedAt) {
      throw new AppError('Member profile not found', 404);
    }

    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: req.body,
    });

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'members',
        entityId: memberId,
        oldValues: oldMember,
        newValues: updatedMember,
        userId: req.user?.id,
        userRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    successResponse(res, updatedMember, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { page = 1, limit = 10, startDate, endDate, type } = req.query as Record<string, string>;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 10);

    const attendanceWhere: any = {};
    if (startDate || endDate) {
      attendanceWhere.date = {};
      if (startDate) attendanceWhere.date.gte = new Date(startDate);
      if (endDate) attendanceWhere.date.lte = new Date(endDate);
    }
    if (type) {
      attendanceWhere.type = type as any;
    }

    const where: any = {
      memberId,
      attendance: attendanceWhere,
    };

    const [records, total] = await Promise.all([
      db.individualAttendance.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          attendance: {
            select: {
              id: true,
              date: true,
              type: true,
              serviceName: true,
              department: { select: { id: true, name: true } },
              event: { select: { id: true, title: true } },
            },
          },
        },
      }),
      db.individualAttendance.count({ where }),
    ]);

    paginatedResponse(res, records, total, pageNumber, limitNumber, 'Attendance history retrieved');
  } catch (error) {
    next(error);
  }
};

export const getMyGiving = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { page = 1, limit = 10, startDate, endDate, type = 'all' } = req.query as Record<string, string>;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 10);
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const dateWhere = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    const shouldReturnTithes = type === 'all' || type === 'tithe';
    const shouldReturnPledges = type === 'all' || type === 'pledge';

    const [tithes, pledges] = await Promise.all([
      shouldReturnTithes
        ? db.tithe.findMany({
            where: { memberId, deletedAt: null, ...dateWhere },
            orderBy: { date: 'desc' },
          })
        : Promise.resolve([]),
      shouldReturnPledges
        ? db.pledge.findMany({
            where: { memberId, deletedAt: null, ...dateWhere },
            orderBy: { createdAt: 'desc' },
            include: { payments: true },
          })
        : Promise.resolve([]),
    ]);

    const transformed = [
      ...tithes.map((tithe: any) => ({
        id: tithe.id,
        date: tithe.date,
        amount: tithe.amount,
        currency: tithe.currency,
        paymentMethod: tithe.paymentMethod,
        category: 'TITHE',
        notes: tithe.notes,
      })),
      ...pledges.flatMap((pledge: any) =>
        pledge.payments.length > 0
          ? pledge.payments.map((payment: any) => ({
              id: payment.id,
              date: payment.paymentDate,
              amount: payment.amount,
              currency: pledge.currency,
              paymentMethod: payment.paymentMethod,
              category: 'PLEDGE',
              notes: payment.notes ?? pledge.title,
            }))
          : [
              {
                id: pledge.id,
                date: pledge.createdAt,
                amount: pledge.amountPaid,
                currency: pledge.currency,
                paymentMethod: 'OTHER',
                category: 'PLEDGE',
                notes: pledge.title,
              },
            ]
      ),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const total = transformed.length;
    const start = (pageNumber - 1) * limitNumber;
    const paged = transformed.slice(start, start + limitNumber);

    paginatedResponse(res, paged, total, pageNumber, limitNumber, 'Giving history retrieved');
  } catch (error) {
    next(error);
  }
};

export const generateGivingStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { startDate, endDate } = req.query as Record<string, string>;
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const dateWhere = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    const [member, tithes, pledgePayments] = await Promise.all([
      db.member.findFirst({
        where: { id: memberId, deletedAt: null },
        select: { id: true, memberNumber: true, firstName: true, lastName: true, email: true },
      }),
      db.tithe.findMany({
        where: { memberId, deletedAt: null, ...dateWhere },
        orderBy: { date: 'asc' },
      }),
      db.pledgePayment.findMany({
        where: {
          pledge: {
            memberId,
            deletedAt: null,
          },
          ...(Object.keys(dateFilter).length ? { paymentDate: dateFilter } : {}),
        },
        include: {
          pledge: { select: { title: true, currency: true } },
        },
        orderBy: { paymentDate: 'asc' },
      }),
    ]);

    if (!member) {
      throw new AppError('Member profile not found', 404);
    }

    const items = [
      ...tithes.map((item: any) => ({
        date: item.date,
        amount: item.amount,
        currency: item.currency,
        type: 'TITHE',
        description: item.notes ?? 'Tithe',
      })),
      ...pledgePayments.map((item: any) => ({
        date: item.paymentDate,
        amount: item.amount,
        currency: item.pledge.currency,
        type: 'PLEDGE',
        description: item.pledge.title,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    successResponse(
      res,
      {
        member,
        period: {
          startDate: startDate ?? null,
          endDate: endDate ?? null,
        },
        summary: {
          totalTransactions: items.length,
          totalAmount: items.reduce((sum, item) => sum + Number(item.amount.toString()), 0),
        },
        items,
      },
      'Giving statement generated'
    );
  } catch (error) {
    next(error);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { page = 1, limit = 10, status, type } = req.query as Record<string, string>;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 10);
    const now = new Date();

    const where: any = {
      deletedAt: null,
      startDate: { gte: now },
      status: status ? (status as any) : { in: ['SCHEDULED', 'ONGOING'] },
      ...(type ? { type: type as any } : {}),
    };

    const [events, total, registrations] = await Promise.all([
      db.event.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { startDate: 'asc' },
        include: {
          department: { select: { id: true, name: true, color: true } },
        },
      }),
      db.event.count({ where }),
      db.eventRegistration.findMany({
        where: { memberId, status: { not: 'CANCELLED' } },
        select: { eventId: true, status: true, confirmedAt: true },
      }),
    ]);

    const registrationMap = new Map(registrations.map((registration: any) => [registration.eventId, registration]));
    const payload = events.map((event: any) => ({
      ...event,
      registration: registrationMap.get(event.id) ?? null,
    }));

    paginatedResponse(res, payload, total, pageNumber, limitNumber, 'Upcoming events retrieved');
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { eventId } = req.body as { eventId: string };
    const event = await db.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }
    if (event.status === 'CANCELLED') {
      throw new AppError('Cannot register for a cancelled event', 400);
    }

    const registration = await db.eventRegistration.upsert({
      where: { memberId_eventId: { memberId, eventId } },
      update: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      create: {
        memberId,
        eventId,
        status: 'CONFIRMED',
      },
      include: {
        event: { select: { title: true, startDate: true, location: true } },
      },
    });

    await db.auditLog.create({
      data: {
        action: 'REGISTER_EVENT',
        entityType: 'event_registrations',
        entityId: registration.id,
        userId: req.user?.id,
        userRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValues: registration,
      },
    });

    successResponse(res, registration, 'Event registration successful', 201);
  } catch (error) {
    next(error);
  }
};

export const cancelEventRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { eventId } = req.params;

    const registration = await db.eventRegistration.findFirst({
      where: { eventId, memberId, status: { not: 'CANCELLED' } },
    });

    if (!registration) {
      throw new AppError('Active registration not found', 404);
    }

    const cancelled = await db.eventRegistration.update({
      where: { id: registration.id },
      data: { status: 'CANCELLED' },
    });

    successResponse(res, cancelled, 'Event registration cancelled');
  } catch (error) {
    next(error);
  }
};

export const submitPrayerRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const prayerRequest = await db.prayerRequest.create({
      data: {
        memberId,
        ...req.body,
      },
    });

    await db.auditLog.create({
      data: {
        action: 'SUBMIT_PRAYER',
        entityType: 'prayer_requests',
        entityId: prayerRequest.id,
        userId: req.user?.id,
        userRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValues: prayerRequest,
      },
    });

    successResponse(res, prayerRequest, 'Prayer request submitted', 201);
  } catch (error) {
    next(error);
  }
};

export const getMyPrayerRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { page = 1, limit = 10 } = req.query as Record<string, string>;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 10);

    const where = { memberId };
    const [requests, total] = await Promise.all([
      db.prayerRequest.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          respondedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      db.prayerRequest.count({ where }),
    ]);

    paginatedResponse(res, requests, total, pageNumber, limitNumber, 'Prayer requests retrieved');
  } catch (error) {
    next(error);
  }
};

export const requestMinistry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { departmentId } = req.body as { departmentId: string };
    const department = await db.department.findFirst({
      where: { id: departmentId, deletedAt: null },
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    const existing = await db.ministryRequest.findFirst({
      where: { memberId, departmentId, status: 'PENDING' },
    });
    if (existing) {
      throw new AppError('You already have a pending request for this department', 409);
    }

    const request = await db.ministryRequest.create({
      data: {
        memberId,
        departmentId,
        motivation: req.body.motivation,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    await db.auditLog.create({
      data: {
        action: 'REQUEST_MINISTRY',
        entityType: 'ministry_requests',
        entityId: request.id,
        userId: req.user?.id,
        userRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValues: request,
      },
    });

    successResponse(res, request, 'Ministry request submitted', 201);
  } catch (error) {
    next(error);
  }
};

export const getMyMinistryRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = getLinkedMemberId(req);
    const { page = 1, limit = 10 } = req.query as Record<string, string>;
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 10);
    const where = { memberId };

    const [requests, total] = await Promise.all([
      db.ministryRequest.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true, color: true } },
          reviewedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      db.ministryRequest.count({ where }),
    ]);

    paginatedResponse(res, requests, total, pageNumber, limitNumber, 'Ministry requests retrieved');
  } catch (error) {
    next(error);
  }
};
