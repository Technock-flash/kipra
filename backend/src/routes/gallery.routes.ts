import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody, validateParams } from '@middleware/validateRequest';
import { AppError } from '@middleware/errorHandler';
import { galleryUpload } from '@middleware/gallery.upload';
import { galleryIdParamSchema, updateGalleryImageSchema } from '@validators/gallery.validator';
import * as galleryController from '@controllers/gallery.controller';

const router = Router();

router.use(authenticate);

const uploadSingle = (req: Request, res: Response, next: NextFunction): void => {
  galleryUpload.single('image')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      next(new AppError(message, 400));
      return;
    }
    next();
  });
};

router.get('/', requirePermission(Permission.GALLERY_READ), galleryController.listGalleryImages);

router.get(
  '/:id/file',
  validateParams(galleryIdParamSchema),
  requirePermission(Permission.GALLERY_READ),
  galleryController.streamGalleryFile
);

router.post(
  '/',
  requirePermission(Permission.GALLERY_MANAGE),
  uploadSingle,
  galleryController.uploadGalleryImage
);

router.patch(
  '/:id',
  validateParams(galleryIdParamSchema),
  validateBody(updateGalleryImageSchema),
  requirePermission(Permission.GALLERY_MANAGE),
  galleryController.updateGalleryImage
);

router.delete(
  '/:id',
  validateParams(galleryIdParamSchema),
  requirePermission(Permission.GALLERY_MANAGE),
  galleryController.deleteGalleryImage
);

export default router;
