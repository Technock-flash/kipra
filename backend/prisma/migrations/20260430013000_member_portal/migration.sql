-- Member portal: enums, user link column, and portal tables
-- Safe to re-run on partially-migrated databases (uses IF NOT EXISTS / guarded ALTERs)

-- AuditAction: new values used by portal flows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuditAction' AND e.enumlabel = 'REGISTER_EVENT'
  ) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'REGISTER_EVENT';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuditAction' AND e.enumlabel = 'SUBMIT_PRAYER'
  ) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'SUBMIT_PRAYER';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuditAction' AND e.enumlabel = 'REQUEST_MINISTRY'
  ) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'REQUEST_MINISTRY';
  END IF;
END $$;

-- PrayerRequestStatus enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PrayerRequestStatus') THEN
    CREATE TYPE "PrayerRequestStatus" AS ENUM ('PENDING', 'ANSWERED', 'IN_PROGRESS', 'ARCHIVED');
  END IF;
END $$;

-- RequestStatus enum (ministry + event registration)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RequestStatus') THEN
    CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONFIRMED', 'CANCELLED');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RequestStatus') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'RequestStatus' AND e.enumlabel = 'CONFIRMED'
    ) THEN
      ALTER TYPE "RequestStatus" ADD VALUE 'CONFIRMED';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'RequestStatus' AND e.enumlabel = 'CANCELLED'
    ) THEN
      ALTER TYPE "RequestStatus" ADD VALUE 'CANCELLED';
    END IF;
  END IF;
END $$;

-- Link user accounts to members (one-to-one)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "linkedMemberId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_linkedMemberId_key" ON "users"("linkedMemberId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_linkedMemberId_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_linkedMemberId_fkey"
      FOREIGN KEY ("linkedMemberId") REFERENCES "members"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Prayer requests
CREATE TABLE IF NOT EXISTS "prayer_requests" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "status" "PrayerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "respondedById" TEXT,
    "isCounseling" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_requests_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prayer_requests_memberId_fkey') THEN
    ALTER TABLE "prayer_requests"
      ADD CONSTRAINT "prayer_requests_memberId_fkey"
      FOREIGN KEY ("memberId") REFERENCES "members"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prayer_requests_respondedById_fkey') THEN
    ALTER TABLE "prayer_requests"
      ADD CONSTRAINT "prayer_requests_respondedById_fkey"
      FOREIGN KEY ("respondedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Ministry requests
CREATE TABLE IF NOT EXISTS "ministry_requests" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "motivation" TEXT,
    "notes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ministry_requests_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ministry_requests_memberId_fkey') THEN
    ALTER TABLE "ministry_requests"
      ADD CONSTRAINT "ministry_requests_memberId_fkey"
      FOREIGN KEY ("memberId") REFERENCES "members"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ministry_requests_departmentId_fkey') THEN
    ALTER TABLE "ministry_requests"
      ADD CONSTRAINT "ministry_requests_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ministry_requests_reviewedById_fkey') THEN
    ALTER TABLE "ministry_requests"
      ADD CONSTRAINT "ministry_requests_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Event registrations
CREATE TABLE IF NOT EXISTS "event_registrations" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_registrations_memberId_eventId_key" ON "event_registrations"("memberId", "eventId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_registrations_memberId_fkey') THEN
    ALTER TABLE "event_registrations"
      ADD CONSTRAINT "event_registrations_memberId_fkey"
      FOREIGN KEY ("memberId") REFERENCES "members"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_registrations_eventId_fkey') THEN
    ALTER TABLE "event_registrations"
      ADD CONSTRAINT "event_registrations_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "events"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
