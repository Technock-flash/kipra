import { Request, Response, NextFunction } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@config/database';
import { successResponse, paginatedResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';
import * as softDeleteService from '@services/softDelete.service';

// Helper to convert string amount to Decimal
const toDecimal = (amount: string): Decimal => new Decimal(amount);
const decimalToNumber = (value: Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
};

// OFFERINGS
export const getOfferings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query as any;
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [offerings, total] = await Promise.all([
      prisma.offering.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: { recordedBy: { select: { firstName: true, lastName: true } } },
      }),
      prisma.offering.count({ where }),
    ]);

    paginatedResponse(res, offerings, total, page, limit, 'Offerings retrieved');
  } catch (error) { next(error); }
};

export const createOffering = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const offering = await prisma.offering.create({
      data: {
        ...req.body,
        amount: toDecimal(req.body.amount),
        recordedById: req.user!.id,
      },
    });
    successResponse(res, offering, 'Offering recorded', 201);
  } catch (error) { next(error); }
};

export const getOfferingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const offering = await prisma.offering.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { recordedBy: { select: { firstName: true, lastName: true } } },
    });
    if (!offering) throw new AppError('Offering not found', 404);
    successResponse(res, offering, 'Offering retrieved');
  } catch (error) { next(error); }
};

export const updateOffering = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: any = { ...req.body };
    if (data.amount) data.amount = toDecimal(data.amount);
    const offering = await prisma.offering.update({
      where: { id: req.params.id },
      data,
    });
    successResponse(res, offering, 'Offering updated');
  } catch (error) { next(error); }
};

export const deleteOffering = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await softDeleteService.softDelete({
      entityType: 'offering',
      entityId: req.params.id,
      deletedById: req.user?.id,
      deletedByRole: req.user?.role,
    });
    successResponse(res, null, 'Offering deleted');
  } catch (error) { next(error); }
};

export const restoreOffering = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restored = await softDeleteService.restoreRecord(req.params.id, req.user?.id);
    successResponse(res, restored, 'Offering restored');
  } catch (error) { next(error); }
};

// TITHES
export const getTithes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query as any;
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [tithes, total] = await Promise.all([
      prisma.tithe.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          member: { select: { firstName: true, lastName: true, memberNumber: true } },
          recordedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.tithe.count({ where }),
    ]);

    paginatedResponse(res, tithes, total, page, limit, 'Tithes retrieved');
  } catch (error) { next(error); }
};

export const createTithe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tithe = await prisma.tithe.create({
      data: {
        ...req.body,
        amount: toDecimal(req.body.amount),
        recordedById: req.user!.id,
      },
    });
    successResponse(res, tithe, 'Tithe recorded', 201);
  } catch (error) { next(error); }
};

export const getTitheById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tithe = await prisma.tithe.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        member: { select: { firstName: true, lastName: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!tithe) throw new AppError('Tithe not found', 404);
    successResponse(res, tithe, 'Tithe retrieved');
  } catch (error) { next(error); }
};

export const updateTithe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: any = { ...req.body };
    if (data.amount) data.amount = toDecimal(data.amount);
    const tithe = await prisma.tithe.update({ where: { id: req.params.id }, data });
    successResponse(res, tithe, 'Tithe updated');
  } catch (error) { next(error); }
};

export const deleteTithe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await softDeleteService.softDelete({
      entityType: 'tithe',
      entityId: req.params.id,
      deletedById: req.user?.id,
      deletedByRole: req.user?.role,
    });
    successResponse(res, null, 'Tithe deleted');
  } catch (error) { next(error); }
};

// PLEDGES
export const getPledges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query as any;
    const [pledges, total] = await Promise.all([
      prisma.pledge.findMany({
        where: { deletedAt: null },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: { select: { firstName: true, lastName: true } },
          payments: true,
          recordedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.pledge.count({ where: { deletedAt: null } }),
    ]);
    paginatedResponse(res, pledges, total, page, limit, 'Pledges retrieved');
  } catch (error) { next(error); }
};

export const createPledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pledge = await prisma.pledge.create({
      data: {
        ...req.body,
        targetAmount: toDecimal(req.body.targetAmount),
        recordedById: req.user!.id,
      },
    });
    successResponse(res, pledge, 'Pledge created', 201);
  } catch (error) { next(error); }
};

export const getPledgeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pledge = await prisma.pledge.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        member: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!pledge) throw new AppError('Pledge not found', 404);
    successResponse(res, pledge, 'Pledge retrieved');
  } catch (error) { next(error); }
};

export const updatePledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: any = { ...req.body };
    if (data.targetAmount) data.targetAmount = toDecimal(data.targetAmount);
    const pledge = await prisma.pledge.update({ where: { id: req.params.id }, data });
    successResponse(res, pledge, 'Pledge updated');
  } catch (error) { next(error); }
};

export const deletePledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await softDeleteService.softDelete({
      entityType: 'pledge',
      entityId: req.params.id,
      deletedById: req.user?.id,
      deletedByRole: req.user?.role,
    });
    successResponse(res, null, 'Pledge deleted');
  } catch (error) { next(error); }
};

export const addPledgePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await prisma.pledgePayment.create({
      data: {
        ...req.body,
        pledgeId: id,
        amount: toDecimal(req.body.amount),
      },
    });

    // Update pledge amount paid
    await prisma.pledge.update({
      where: { id },
      data: {
        amountPaid: { increment: toDecimal(req.body.amount) },
        status: req.body.status || 'COMPLETED',
      },
    });

    successResponse(res, payment, 'Payment added', 201);
  } catch (error) { next(error); }
};

// EXPENSES
export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query as any;
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: { recordedBy: { select: { firstName: true, lastName: true } } },
      }),
      prisma.expense.count({ where }),
    ]);

    paginatedResponse(res, expenses, total, page, limit, 'Expenses retrieved');
  } catch (error) { next(error); }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expense = await prisma.expense.create({
      data: {
        ...req.body,
        amount: toDecimal(req.body.amount),
        recordedById: req.user!.id,
      },
    });
    successResponse(res, expense, 'Expense recorded', 201);
  } catch (error) { next(error); }
};

export const getExpenseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { recordedBy: { select: { firstName: true, lastName: true } } },
    });
    if (!expense) throw new AppError('Expense not found', 404);
    successResponse(res, expense, 'Expense retrieved');
  } catch (error) { next(error); }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: any = { ...req.body };
    if (data.amount) data.amount = toDecimal(data.amount);
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data });
    successResponse(res, expense, 'Expense updated');
  } catch (error) { next(error); }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await softDeleteService.softDelete({
      entityType: 'expense',
      entityId: req.params.id,
      deletedById: req.user?.id,
      deletedByRole: req.user?.role,
    });
    successResponse(res, null, 'Expense deleted');
  } catch (error) { next(error); }
};

// REPORTS
export const getFinancialSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as any;
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = Object.keys(dateFilter).length > 0 ? { date: dateFilter, deletedAt: null } : { deletedAt: null };

    const [offerings, tithes, expenses, pledges] = await Promise.all([
      prisma.offering.aggregate({ where, _sum: { amount: true }, _count: true }),
      prisma.tithe.aggregate({ where, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
      prisma.pledge.aggregate({ where: { ...where, status: 'COMPLETED' }, _sum: { amountPaid: true } }),
    ]);

    const totalOfferings = decimalToNumber(offerings._sum.amount);
    const totalTithes = decimalToNumber(tithes._sum.amount);
    const totalPledgesPaid = decimalToNumber(pledges._sum.amountPaid);
    const totalExpenses = decimalToNumber(expenses._sum.amount);
    const totalIncome = totalOfferings + totalTithes + totalPledgesPaid;

    successResponse(res, {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      offerings: { total: totalOfferings, count: offerings._count },
      tithes: { total: totalTithes, count: tithes._count },
      pledges: { totalPaid: totalPledgesPaid },
      expenses: { total: totalExpenses, count: expenses._count },
    }, 'Financial summary retrieved');
  } catch (error) { next(error); }
};

export const getFinancialTrends = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [monthlyOfferings, monthlyTithes, monthlyExpenses] = await Promise.all([
      prisma.offering.groupBy({
        by: ['date'],
        where: { date: { gte: sixMonthsAgo }, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.tithe.groupBy({
        by: ['date'],
        where: { date: { gte: sixMonthsAgo }, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['date'],
        where: { date: { gte: sixMonthsAgo }, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    successResponse(res, {
      offerings: monthlyOfferings,
      tithes: monthlyTithes,
      expenses: monthlyExpenses,
    }, 'Financial trends retrieved');
  } catch (error) { next(error); }
};

