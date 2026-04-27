import { prisma } from '@config/database';
import logger from '@utils/logger';

interface SoftDeleteOptions {
  entityType: string;
  entityId: string;
  deletedById?: string;
  deletedByRole?: string;
  reason?: string;
}

export const softDelete = async (options: SoftDeleteOptions): Promise<boolean> => {
  const { entityType, entityId, deletedById, deletedByRole, reason } = options;

  try {
    // Get the record before deletion
    const record = await (prisma as any)[entityType.toLowerCase()].findUnique({
      where: { id: entityId },
    });

    if (!record) {
      throw new Error(`Record not found: ${entityType} ${entityId}`);
    }

    if (record.deletedAt) {
      throw new Error('Record already deleted');
    }

    // Perform soft delete
    await (prisma as any)[entityType.toLowerCase()].update({
      where: { id: entityId },
      data: { deletedAt: new Date() },
    });

    // Store in deleted records vault
    await prisma.deletedRecord.create({
      data: {
        entityType,
        entityId,
        data: record,
        deletedById,
        deletedByRole,
        reason,
      },
    });

    return true;
  } catch (error) {
    logger.error('Soft delete error:', error);
    throw error;
  }
};

export const restoreRecord = async (deletedRecordId: string, restoredById?: string): Promise<any> => {
  try {
    const deletedRecord = await prisma.deletedRecord.findUnique({
      where: { id: deletedRecordId },
    });

    if (!deletedRecord) {
      throw new Error('Deleted record not found in vault');
    }

    if (deletedRecord.restoredAt) {
      throw new Error('Record already restored');
    }

    const { entityType, entityId, data } = deletedRecord;

    // Restore the record by clearing deletedAt
    const restored = await (prisma as any)[entityType.toLowerCase()].update({
      where: { id: entityId },
      data: { deletedAt: null },
    });

    // Update vault record
    await prisma.deletedRecord.update({
      where: { id: deletedRecordId },
      data: {
        restoredAt: new Date(),
        restoredById,
      },
    });

    return restored;
  } catch (error) {
    logger.error('Restore error:', error);
    throw error;
  }
};

export const getDeletedRecords = async (entityType?: string, page: number = 1, limit: number = 10) => {
  const where = entityType ? { entityType } : {};
  
  const [records, total] = await Promise.all([
    prisma.deletedRecord.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.deletedRecord.count({ where }),
  ]);

  return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
};

