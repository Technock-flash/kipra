# Kingdom Power Royal Assembly (KiPRA) - Church Management System
## Comprehensive Implementation Plan

---

## 1. Information Gathered

- **Workspace**: Empty directory - greenfield project
- **Target**: Full-stack web application for church leadership
- **Users**: Super Admin, Admin, Treasurer, Secretary, Apostle, Other Leaders
- **Modules**: Auth, Dashboard, Attendance, Finance, Calendar, Leadership Management
- **Requirements**: RBAC, Real-time, Soft deletes, Audit logs, Mobile responsive

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Next.js     │  │  React Query │  │  Socket.io Client    │  │
│  │  (App Router)│  │  (State/Cache)│  │  (Real-time)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        API GATEWAY                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Express.js  │  │  JWT Auth    │  │  RBAC Middleware     │  │
│  │  REST API    │  │  + 2FA OTP   │  │  (Permission Matrix) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        SERVICE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Audit Log   │  │  Soft Delete │  │  Real-time Events    │  │
│  │  Service     │  │  Service     │  │  Service             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │  Prisma ORM  │  │  Redis (Sessions/    │  │
│  │  (Primary)   │  │  (Migrations)│  │  Cache/Real-time)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. File Structure Plan

```
kpra-system/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── PERMISSION_MATRIX.md
│   ├── API_ENDPOINTS.md
│   ├── SECURITY_MODEL.md
│   └── ROADMAP.md
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── sockets/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── finance/
│   │   ├── attendance/
│   │   ├── calendar/
│   │   ├── leadership/
│   │   └── admin/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── context/
│   ├── package.json
│   └── next.config.js
├── docker-compose.yml
├── README.md
└── TODO.md
```

---

## 4. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens), bcrypt, speakeasy (2FA) |
| Cache/Session | Redis |
| Validation | Zod |
| Testing | Jest, Supertest |
| Containerization | Docker, Docker Compose |

---

## 5. Database Schema (ERD Summary)

**Core Tables:**
- `users` - All system users with role enum
- `roles` - Role definitions
- `permissions` - Permission definitions
- `role_permissions` - Many-to-many mapping
- `audit_logs` - Activity tracking
- `deleted_records` - Soft delete recovery vault

**Church Module Tables:**
- `members` - Church member profiles
- `attendance` - Service/department attendance
- `visitors` - Visitor tracking
- `events` - Church calendar events
- `offerings` - Offering records
- `tithes` - Tithe records
- `pledges` - Pledge records
- `expenses` - Expense tracking
- `departments` - Church departments
- `leaders` - Leadership assignments
- `branches` - Multi-branch support

---

## 6. User Role Permission Matrix

| Permission | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|------------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **Users** |
| Create User | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit User | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete User | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Permissions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Members** |
| Create Member | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit Member | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete Member | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View Members | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Attendance** |
| Record Attendance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit Attendance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Finance** |
| Record Offering | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Record Tithe | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Record Pledge | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Financial | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Soft Delete Financial | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Restore Financial | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Calendar** |
| Create Event | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit Event | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete Event | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View Calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Leadership** |
| Manage Leaders | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Manage Depts | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **System** |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Deleted Records | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Restore Any Record | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dashboard Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Day 1)
1. Docker Compose setup (PostgreSQL + Redis)
2. Backend project scaffolding (Express + TypeScript)
3. Prisma schema design and migration
4. Frontend Next.js project setup with Tailwind

### Phase 2: Authentication & RBAC (Day 2)
1. User authentication (JWT + refresh tokens)
2. 2FA implementation with speakeasy
3. Role-based access control middleware
4. Permission matrix enforcement
5. Login/logout flows on frontend

### Phase 3: Core Modules (Days 3-4)
1. Member management CRUD
2. Attendance tracking system
3. Finance module (Offerings, Tithes, Pledges, Expenses)
4. Church calendar/events
5. Leadership management

### Phase 4: Data Integrity & Audit (Day 5)
1. Soft delete implementation across all modules
2. Deleted records recovery vault
3. Comprehensive audit logging
4. Financial transaction edit trail

### Phase 5: Real-time & Dashboard (Day 6)
1. Socket.io integration
2. Real-time dashboard analytics
3. Live attendance counters
4. Activity feeds
5. Notifications system

### Phase 6: UI/UX Polish (Day 7)
1. Responsive design
2. Charts and reports with export
3. Dark mode support
4. Role-based navigation
5. Data tables with sorting/filtering

---

## 8. Security Model

- **Authentication**: JWT access tokens (15min) + refresh tokens (7 days) in httpOnly cookies
- **Authorization**: RBAC with permission matrix checked at middleware level
- **Data Protection**: bcrypt password hashing (12 rounds), encrypted financial fields
- **Audit**: Every Create/Update/Delete logged with user, timestamp, old/new values
- **Soft Delete**: All records use `deletedAt` timestamp; Super Admin can restore from vault
- **Input Validation**: Zod schemas for all API inputs
- **Rate Limiting**: Express-rate-limit on auth endpoints
- **CORS**: Strict origin policy
- **Helmet**: Security headers

---

## 9. Plan Approval Request

This is a comprehensive plan for building the KiPRA Church Management System. The implementation will proceed in logical phases:

1. **Documentation**: Architecture, schema, permissions, API docs
2. **Backend API**: Complete REST API with authentication, RBAC, all CRUD modules, audit logs
3. **Frontend**: Next.js dashboard with role-based views, real-time features, reports
4. **Infrastructure**: Docker setup for easy deployment

**Estimated deliverables**: 40-50 files across backend, frontend, and documentation.

Please confirm this plan so I can proceed with implementation and create the TODO.md tracking file.

