# Advanced Church Calendar Management Feature - Implementation Plan

## 📋 Information Gathered

### Current State Analysis
| Component | Status | Notes |
|-----------|--------|-------|
| Event Model | Basic | Title, date, type, recurring flag only |
| Calendar Routes | Minimal | GET/POST/PUT/DELETE only |
| Calendar Controller | Simple CRUD | No recurrence, conflict, reminders |
| Calendar Validator | Limited | No recurring rule validation |
| Calendar Frontend | Basic Form + List | No visual calendar view |
| PDF Export | Available (finance) | Can reuse jsPDF pattern |

### Tech Stack Identified
- **Backend**: Express + Prisma + TypeScript + Zod
- **Frontend**: Next.js 14 + Tailwind + shadcn/ui + React Query
- **Auth**: JWT with role-based permissions
- **Export**: jsPDF + jspdf-autotable (existing pattern)
- **Database**: PostgreSQL with Prisma ORM

### Key Dependencies to Add
| Package | Purpose | Scope |
|--------|---------|-------|
| rrule | Recurring event rule processing | Backend |
| date-fns | Date manipulation | Both |
| date-fns-tz | Timezone handling | Both |
| xlsx | Excel export | Frontend |
| ical.js | ICS calendar format | Backend |
| node-cron | Reminder scheduling | Backend |
| @fullcalendar/* | Calendar UI | Frontend |

---

## 🗂️ Plan: File-Level Updates

### Phase 1: Database Schema Enhancement
**Files to Create/Modify**: `backend/prisma/schema.prisma`

#### New Models
```
EventRecurrence          - Recurring event templates
EventReminder          - Event reminder settings  
EventAttendee         - Event attendance tracking
EventConflict         - Conflict detection records
CalendarExport        - Export history logs
CalendarSyncAccount  - Google/Outlook sync tokens
EventSeries          - Parent recurring event groups
```

#### Enhanced Existing Models
- **Event**: Add organizerId, color, branchId, leadershipGroup, maxAttendees, registrationRequired, syncExternalId, notifyBefore, notifyAfter, priority
- **Department**: Add branchId, colorForCalendar
- **User**: Add branchId (for multi-branch support)

---

### Phase 2: Backend API Enhancement

#### 2.1 New Validators
**File**: `backend/src/validators/calendar.validator.ts` (REPLACE)
- Enhanced eventSchema with recurrence rules
- Create recurringProgramSchema
- Create exportOptionsSchema
- Create conflictQuerySchema
- Create syncSettingsSchema

#### 2.2 New Services
**Files to Create**:
- `backend/src/services/calendar.service.ts` - Core calendar business logic
- `backend/src/services/recurrence.service.ts` - RRULE processing
- `backend/src/services/conflict.service.ts` - Overlap detection
- `backend/src/services/export.service.ts` - PDF/Excel/ICS generation
- `backend/src/services/calendar-sync.service.ts` - Google/Outlook integration
- `backend/src/services/reminder.service.ts` - Notification scheduling

#### 2.3 New Controllers
**File**: `backend/src/controllers/calendar.controller.ts` (ENHANCE)
- `getEvents` - Enhanced with filters, date ranges, pagination
- `createEvent` - With conflict detection
- `createRecurringProgram` - New endpoint
- `generateYearlyCalendar` - Auto-generate from recurring programs
- `getConflicts` - Detect overlapping events
- `getCalendarView` - Monthly/yearly view data
- `exportCalendar` - PDF/Excel/ICS export
- `syncCalendar` - External calendar sync
- `updateReminder` - Set event reminders
- `getUpcomingEvents` - With notification prep
- `getEventSeries` - Recurring event instances

#### 2.4 New Routes
**File**: `backend/src/routes/calendar.routes.ts` (ENHANCE)
```typescript
// Event Management
POST   /calendar/recurring-program    - Create recurring template
GET    /calendar/recurring-programs - List recurring programs
PUT    /calendar/recurring-programs/:id - Update recurring program
DELETE /calendar/recurring-programs/:id - Delete recurring program
POST   /calendar/generate-yearly   - Generate yearly calendar
GET    /calendar/view              - Calendar view data (monthly/yearly)
GET    /calendar/conflicts        - Check conflicts
GET    /calendar/series/:id       - Get event series instances

// Reminders
POST   /calendar/:id/reminder     - Set event reminder
DELETE /calendar/:id/reminder   - Remove event reminder

// Export
POST   /calendar/export/pdf     - Export as PDF
POST   /calendar/export/excel  - Export as Excel
POST   /calendar/export/ics   - Export as ICS (iCal)

// Sync
POST   /calendar/sync/google   - Sync with Google Calendar
POST   /calendar/sync/outlook   - Sync with Outlook
DELETE /calendar/sync/:id     - Disconnect sync account
GET    /calendar/sync/status   - Check sync status

// Filters
GET    /calendar/filters/departments  - Department filter options
GET    /calendar/filters/branches     - Branch filter options
GET    /calendar/filters/types       - Event type filter options
GET    /calendar/filters/leadership  - Leadership group filter options
```

---

### Phase 3: Permissions Update

**File**: `backend/src/utils/permissions.ts` (ENHANCE)
```typescript
enum Permission {
  // Add to existing:
  CALENDAR_EXPORT = 'calendar:export',
  CALENDAR_SYNC = 'calendar:sync',
  CALENDAR_RECURRING_MANAGE = 'calendar:recurring:manage',
  CALENDAR_YEARLY_GENERATE = 'calendar:yearly:generate',
}
```

---

### Phase 4: Frontend Components

#### 4.1 Calendar Components
**Files to Create** in `frontend/components/calendar/`:
```
CalendarView.tsx        - Main visual calendar (FullCalendar)
EventModal.tsx          - Create/Edit event modal
RecurringEventModal.tsx  - Recurring event setup
EventFilters.tsx       - Filter sidebar/panel
EventCard.tsx          - Individual event display
EventList.tsx          - List view alternative
ConflictWarning.tsx    - Conflict detection modal
ExportModal.tsx        - Export options modal
YearlyCalendarGen.tsx  - Yearly generation wizard
ReminderSettings.tsx  - Reminder configuration
SyncSettings.tsx       - Google/Outlook sync UI
MobileCalendar.tsx     - Mobile-optimized view
CalendarStats.tsx      - Statistics panel
UpcomingEvents.tsx     - Dashboard widget
```

#### 4.2 Calendar Types
**File**: `frontend/types/index.ts` (ENHANCE)
```typescript
interface CalendarEvent { /* full enhanced type */ }
interface RecurringProgram { /* recurring template type */ }
interface CalendarView { /* view data structure */ }
interface CalendarExport { /* export options */ }
interface CalendarFilter { /* filter state */ }
interface SyncAccount { /* external sync account */ }
```

#### 4.3 Calendar API Library
**File**: `frontend/lib/calendar-api.ts` (CREATE)
- CRUD operations
- Recurring program management
- Yearly calendar generation
- Export functions (PDF/Excel/ICS)
- Sync management
- Filter helpers

#### 4.4 Calendar Page
**File**: `frontend/app/dashboard/calendar/page.tsx` (REPLACE)
- Full visual calendar view
- Event management tabs
- Filter sidebar
- Export toolbar
- Mobile responsive

---

### Phase 5: PDF Export Service

**File**: `frontend/lib/generateCalendarReport.ts` (CREATE)
```typescript
// Based on existing generateFinanceReport.ts pattern
interface CalendarReportOptions {
  title: string;
  subtitle?: string;
  startDate: Date;
  endDate: Date;
  filters?: {
    department?: string[];
    branch?: string[];
    eventType?: string[];
    leadershipGroup?: string[];
  };
  includeDescriptions: boolean;
  includeVenues: boolean;
  colorCoded: boolean;
  pageSize: 'A4' | 'LETTER';
  orientation: 'portrait' | 'landscape';
}

// Features:
// - Church branding header
// - Logo integration
// - Color-coded events by department/type
// - Clean monthly/yearly layouts
// - Event details table
// - Page numbers and footer
// - Multi-page support for yearly
```

---

### Phase 6: Supporting Files

#### 6.1 Notification Integration
**Files to Create/Modify**:
- `backend/src/services/notification.service.ts` - Add reminder methods
- `backend/src/services/reminder.service.ts` - Cron job for reminders

#### 6.2 Excel Export Service
**File**: `frontend/lib/generateCalendarExcel.ts` (CREATE)
```typescript
// Using xlsx library (existing pattern from finance)
// Features:
// - Event list worksheet
// - Monthly breakdown worksheets
// - Charts for event distribution
// - Formatted headers and styling
```

---

## 📦 Dependent Files to Edit

| File | Changes |
|------|---------|
| `backend/prisma/schema.prisma` | Add 5+ new models, enhance Event |
| `backend/src/validators/calendar.validator.ts` | Complete rewrite |
| `backend/src/controllers/calendar.controller.ts` | Major enhancement (15+ new methods) |
| `backend/src/routes/calendar.routes.ts` | Add 15+ new routes |
| `backend/src/utils/permissions.ts` | Add 5 new permissions |
| `backend/src/server.ts` | Register new routes |
| `frontend/types/index.ts` | Add 5+ new interfaces |
| `frontend/components/calendar/` | Create 10+ components |
| `frontend/app/dashboard/calendar/page.tsx` | Complete rewrite |
| `frontend/lib/calendar-api.ts` | New API library |

---

## 🔧 Follow-up Steps

### After Implementation

1. **Install Dependencies**
```bash
# Backend
cd backend && npm install rrule date-fns date-fns-tz node-cron ical.js uuid

# Frontend  
cd frontend && npm install @fullcalendar/react @fullcalendar/daygrid 
@fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list
xlsx
```

2. **Database Migration**
```bash
cd backend && npx prisma migrate dev --name add_advanced_calendar
```

3. **Seed Recurring Programs** (Optional)
- Add seed data for standard church events (Sunday Service, Wednesday Prayer, etc.)

4. **Test Comprehensive Flow**
- Create single event
- Create recurring event
- Generate yearly calendar
- Check conflict detection
- Export PDF
- Export Excel
- Mobile responsiveness
- Filter functionality

5. **External Integrations Setup** (Future)
- Google Calendar API credentials
- Microsoft Graph API credentials
- Configure OAuth flows

---

## ✅ Validation Checklist

- [ ] Event CRUD with all fields
- [ ] Recurring events (daily/weekly/monthly/annual)
- [ ] Visual monthly calendar view
- [ ] Visual yearly calendar view
- [ ] Filters (department, branch, type, leadership)
- [ ] Conflict detection
- [ ] PDF export with branding
- [ ] Excel export
- [ ] ICS export
- [ ] Google Calendar sync
- [ ] Outlook sync
- [ ] Reminder notifications
- [ ] Mobile responsive
- [ ] Role-based access control
- [ ] Yearly calendar auto-generation
