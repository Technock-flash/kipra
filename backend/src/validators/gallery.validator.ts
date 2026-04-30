import { z } from 'zod';

export const galleryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateGalleryImageSchema = z
  .object({
    caption: z.string().max(500).optional().nullable(),
    sortOrder: z.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((data) => data.caption !== undefined || data.sortOrder !== undefined, {
    message: 'Provide caption and/or sortOrder',
  });
