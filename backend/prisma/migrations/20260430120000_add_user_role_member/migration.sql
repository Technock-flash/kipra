-- Add MEMBER role for church members (member portal only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'MEMBER'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'MEMBER';
  END IF;
END $$;
