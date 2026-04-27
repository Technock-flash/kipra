import { z } from 'zod';
import { NotificationType } from '@prisma/client';

const notificationTypeEnum = z.nativeEnum(NotificationType);

const toPositiveInt = (v: unknown, fallback: number) => {
  if (v === undefined || v === null || v === '') return fallback;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const notificationListQuerySchema = z.object({
  page: z.preprocess((v) => toPositiveInt(v, 1), z.number().int().min(1)),
  limit: z.preprocess(
    (v) => Math.min(100, toPositiveInt(v, 20)),
    z.number().int().min(1).max(100)
  ),
  isRead: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(10000),
  type: notificationTypeEnum.optional().default(NotificationType.INFO),
});
