import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '@config/database';
import { successResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';
import { updateGalleryImageSchema } from '@validators/gallery.validator';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const galleryDir = (): string => {
  const root = process.env.UPLOAD_DIR || 'uploads';
  return path.join(process.cwd(), root, 'gallery');
};

const filePathFor = (fileName: string): string => path.join(galleryDir(), fileName);

export const listGalleryImages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await prisma.galleryImage.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    successResponse(res, items, 'Gallery images retrieved');
  } catch (error) {
    next(error);
  }
};

export const uploadGalleryImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    const file = req.file;
    if (!file) {
      next(new AppError('Image file is required (field name: image)', 400));
      return;
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      next(new AppError('Invalid image type', 400));
      return;
    }

    const captionRaw = req.body?.caption;
    const caption =
      typeof captionRaw === 'string' && captionRaw.trim().length > 0
        ? captionRaw.trim().slice(0, 500)
        : null;

    const maxOrder = await prisma.galleryImage.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const row = await prisma.galleryImage.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname.slice(0, 255),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        caption,
        sortOrder,
        uploadedById: req.user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    successResponse(res, row, 'Image uploaded', 201);
  } catch (error) {
    next(error);
  }
};

export const updateGalleryImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = updateGalleryImageSchema.parse(req.body);
    const existing = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      next(new AppError('Image not found', 404));
      return;
    }
    const row = await prisma.galleryImage.update({
      where: { id: req.params.id },
      data: {
        ...(body.caption !== undefined ? { caption: body.caption } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    successResponse(res, row, 'Image updated');
  } catch (error) {
    next(error);
  }
};

export const deleteGalleryImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      next(new AppError('Image not found', 404));
      return;
    }
    const abs = filePathFor(existing.fileName);
    try {
      fs.unlinkSync(abs);
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') throw e;
    }
    await prisma.galleryImage.delete({ where: { id: req.params.id } });
    successResponse(res, null, 'Image removed');
  } catch (error) {
    next(error);
  }
};

export const streamGalleryFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const row = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
    if (!row) {
      next(new AppError('Image not found', 404));
      return;
    }
    const abs = filePathFor(row.fileName);
    if (!fs.existsSync(abs)) {
      next(new AppError('File missing on server', 404));
      return;
    }
    res.setHeader('Content-Type', row.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(abs, (err) => {
      if (err) next(new AppError('Failed to send file', 500));
    });
  } catch (error) {
    next(error);
  }
};
