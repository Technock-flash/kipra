import { z } from 'zod';

export const offeringSchema = z.object({
  date: z.string().datetime(),
  serviceType: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  currency: z.string().default('GHS'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER']).default('CASH'),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const titheSchema = z.object({
  date: z.string().datetime(),
  memberId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default('GHS'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER']).default('CASH'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  notes: z.string().optional(),
});

export const pledgeSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  memberId: z.string().uuid(),
  targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default('GHS'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const pledgePaymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  paymentDate: z.string().datetime(),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER']),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  date: z.string().datetime(),
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default('GHS'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER']).default('CASH'),
  vendor: z.string().optional(),
  receiptNumber: z.string().optional(),
  approvedBy: z.string().optional(),
});

export const financeQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['OFFERING', 'TITHE', 'PLEDGE', 'EXPENSE', 'DONATION', 'SPECIAL_OFFERING']).optional(),
  sortBy: z.string().default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

