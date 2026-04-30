-- Repair: run when migration is marked applied but `gallery_images` is missing,
-- or when the app's DATABASE_URL differs from where you ran `migrate deploy`.
-- Usage: npx prisma db execute --file prisma/repair-gallery-images.sql

CREATE TABLE IF NOT EXISTS "gallery_images" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "gallery_images_sortOrder_idx" ON "gallery_images"("sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gallery_images_uploadedById_fkey'
  ) THEN
    ALTER TABLE "gallery_images"
      ADD CONSTRAINT "gallery_images_uploadedById_fkey"
      FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
