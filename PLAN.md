# Member Portal Implementation Plan

## Phase 1: Database Schema Updates

### New Models to Add to schema.prisma:

```prisma
// Prayer Requests
model PrayerRequest {
  id              String   @id @default(uuid())
  memberId        String
  member          Member  @relation(fields: [memberId], references: [id])
  title           String
  request         String
  isPrivate       Boolean  @default(true)
  status          PrayerRequestStatus @default(PENDING)
  response        String?
  respondedById   String?
  respondedBy     User?   @relation("PrayerRequestRespondedBy", fields: [respondedById], references: [id])
  isCounseling    Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("prayer_requests")
}

enum PrayerRequestStatus {
  PENDING
  ANSWERED
  IN_PROGRESS
  ARCHIVED
}

// Ministry/Department Requests
model MinistryRequest {
  id              String   @id @default(uuid())
  memberId        String
  member          Member   @relation(fields: [memberId], references: [id])
  departmentId    String
  department      Department @relation(fields: [departmentId], references: [id])
  status          RequestStatus @default(PENDING)
  motivation      String?
  notes           String?
  reviewedById    String?
  reviewedBy      User?    @relation("MinistryRequestReviewedBy", fields: [reviewedById], references: [id])
  reviewedAt      DateTime?
  createdAt      DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("ministry_requests")
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

// Event Registrations
model EventRegistration {
  id              String   @id @default(uuid())
  memberId        String
  member          Member   @relation(fields: [memberId], references: [id])
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id])
  status          RequestStatus @default(CONFIRMED)
  confirmedAt     DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@map("event_registrations")
}
```

## Phase 2: Backend API

### New Validators:
1. `portal.validator.ts` - For all member portal operations

### New Controllers:
1. `portal.controller.ts` - Main member portal operations:
   - `getMyProfile` - Get logged-in member's profile
   - `updateMyProfile` - Update own profile details
   - `getMyAttendance` - Get attendance history with filters
   - `getMyGiving` - Get personal giving history
   - `generateGivingStatement` - Generate PDF giving statement
   - `getUpcomingEvents` - Get events available for registration
   - `registerForEvent` - Register for event
   - `cancelEventRegistration` - Cancel registration
   - `submitPrayerRequest` - Submit prayer request
   - `getMyPrayerRequests` - Get own prayer requests
   - `requestMinistry` - Request to join ministry
   - `getMyMinistryRequests` - Get ministry requests

### New Routes:
1. `portal.routes.ts` - Mount at `/api/portal`

### Permissions to Add:
- portal:read
- portal:update
- portal:attendance:read
- portal:finance:read
- portal:event:register
- portal:prayer:create
- portal:ministry:request

### Server Registration:
- Add to server.ts: `import portalRoutes from '@routes/portal.routes';`
- Add middleware: `app.use(\`${apiPrefix}/portal\`, authenticate, portalRoutes);`

## Phase 3: Frontend

### New Pages:
1. `/portal/page.tsx` - Member portal dashboard
2. `/portal/profile/page.tsx` - Profile management
3. `/portal/attendance/page.tsx` - Attendance history
4. `/portal/giving/page.tsx` - Giving statements
5. `/portal/events/page.tsx` - Events & registration
6. `/portal/prayer/page.tsx` - Prayer requests
7. `/portal/ministry/page.tsx` - Ministry requests

### Components:
1. `portal-nav.tsx` - Portal navigation sidebar
2. `attendance-chart.tsx` - Attendance visualization
3. `giving-statement.tsx` - PDF generation
4. `event-card.tsx` - Event display
5. `prayer-form.tsx` - Prayer request form

### Auth Context Updates:
- Add MEMBER role and permissions
- Store linked member ID with user

### Layout Updates:
- Add "Member Portal" link in sidebar
- Create separate layout for portal (redirects to /portal)

## Phase 4: Security & Integration

### Security:
- All portal routes require authentication
- Members can only access their own data
- Audit logging on all profile updates
- Rate limiting on prayer requests

### Notifications:
- Event registration confirmation
- Ministry request status update
- Prayer request response

### Integration:
- Use existing auth system
- Use existing database
- Reuse notification system

## Implementation Order

1. Update database schema
2. Create validators
3. Create controller functions
4. Define routes
5. Register in server
6. Add frontend components
7. Add frontend pages
8. Update auth context
9. Test integration

## File Structure to Create/Modify

### New Backend Files:
- `backend/src/validators/portal.validator.ts`
- `backend/src/controllers/portal.controller.ts`
- `backend/src/routes/portal.routes.ts`
- `backend/src/utils/pdf-generator.ts` - For giving statements

### Modified Backend Files:
- `backend/prisma/schema.prisma` - Add new models
- `backend/src/server.ts` - Register routes
- `backend/src/utils/permissions.ts` - Add new permissions
- `backend/src/middleware/rbac.ts` - Update if needed

### New Frontend Files:
- `frontend/app/portal/layout.tsx`
- `frontend/app/portal/page.tsx`
- `frontend/app/portal/profile/page.tsx`
- `frontend/app/portal/attendance/page.tsx`
- `frontend/app/portal/giving/page.tsx`
- `frontend/app/portal/events/page.tsx`
- `frontend/app/portal/prayer/page.tsx`
- `frontend/app/portal/ministry/page.tsx`
- `frontend/components/portal/` - Shared components

### Modified Frontend Files:
- `frontend/context/auth-context.tsx` - Update permissions
- `frontend/types/index.ts` - Add types
- `frontend/lib/api.ts` - Update if needed

## Summary

This plan outlines a complete Member Portal feature that:
- ✅ Allows members to manage their profile
- ✅ Shows attendance history with charts
- ✅ Allows downloading giving statements
- ✅ Event registration functionality
- ✅ Prayer request submission
- ✅ Ministry/Department joining requests
- ✅ Mobile responsive (reuses existing design system)
- ✅ Integrated with existing auth
- ✅ Connected to main database
- ✅ Has audit logging
- ✅ Has notifications
