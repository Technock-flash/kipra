# KiPRA - System Architecture

## Overview

Kingdom Power Royal Assembly (KiPRA) Church Management System is a full-stack web application with role-based access control (RBAC), real-time data synchronization, comprehensive audit logging, and soft delete recovery capabilities.

## Architecture Layers

### 1. Presentation Layer (Frontend)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (TanStack Query) for server state
- **Real-time**: Socket.io Client
- **Authentication**: JWT tokens with httpOnly cookies
- **Charts**: Recharts for data visualization
- **Export**: jspdf + jspdf-autotable for PDF, xlsx for Excel

### 2. Application Layer (Backend API)
- **Framework**: Express.js + TypeScript
- **Architecture**: MVC pattern with Service layer
- **API Style**: RESTful JSON API
- **Request Flow**: Route → Middleware (Auth/RBAC/Validation) → Controller → Service → Prisma → Database
- **Error Handling**: Centralized error handler with custom AppError class
- **Logging**: Winston logger with file rotation

### 3. Data Layer
- **Primary Database**: PostgreSQL 15
- **ORM**: Prisma
- **Cache/Session**: Redis 7
- **Real-time**: Socket.io with Redis adapter (scalable)
- **File Storage**: Multer with local disk (configurable for cloud)

## Security Architecture

```
┌────────────────────────────────────────────────────┐
│                     CLIENT                          │
│         (HTTPS + JWT + 2FA Optional)                │
└──────────────────┬─────────────────────────────────┘
                   │ HTTPS/WSS
┌──────────────────▼─────────────────────────────────┐
│                   NGINX                             │
│         (SSL Termination + Rate Limit)              │
└──────────────────┬─────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────┐
│              EXPRESS.JS SERVER                      │
│  ┌──────────────┬──────────────┬─────────────┐    │
│  │   Helmet     │  Rate Limit  │    CORS     │    │
│  │  (Headers)   │  (Brute     │  (Origin    │    │
│  │              │   Force)     │   Control)  │    │
│  └──────────────┴──────────────┴─────────────┘    │
│  ┌──────────────┬──────────────┬─────────────┐    │
│  │     JWT      │    RBAC      │    Zod      │    │
│  │     Auth     │  Middleware  │  Validation │    │
│  └──────────────┴──────────────┴─────────────┘    │
│  ┌──────────────┬──────────────┬─────────────┐    │
│  │   Audit Log  │  Soft Delete │  Encrypt    │    │
│  │   Service    │   Service    │  Financial  │    │
│  └──────────────┴──────────────┴─────────────┘    │
└──────────────────┬─────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────┐
│                   DATA                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │PostgreSQL│  │  Redis   │  │ File Storage   │  │
│  │(Prisma)  │  │(Session/ │  │ (Uploads)      │  │
│  │          │  │  Cache)  │  │                │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
└────────────────────────────────────────────────────┘
```

## Authentication Flow

1. **Registration**: Password hashed with bcrypt (12 rounds)
2. **Login**: JWT access token (15 min) + refresh token (7 days)
3. **2FA (Optional)**: TOTP with speakeasy + QR code generation
4. **Token Refresh**: Refresh token rotates on each use
5. **Logout**: Token blacklisted in Redis
6. **Session Tracking**: Redis stores active sessions per user

## Permission System

```
UserRole (Enum)
    └── RolePermission Matrix
            └── Permission (Enum: 30+ permissions)
                    └── Middleware Check
                            └── Controller Execution
```

## Soft Delete Mechanism

All entities use Prisma's `deletedAt` field:
- **Delete**: Set `deletedAt = now()` + create `DeletedRecord` entry
- **Query**: Default filter excludes `deletedAt IS NOT NULL`
- **History**: Super Admin/Admin can view `DeletedRecord` vault
- **Restore**: Update `deletedAt = null` + log restoration in audit

## Real-time Features

1. **Socket.io Rooms**:
   - `user:{id}` - User-specific notifications
   - `role:{role}` - Role-based broadcasts
   - `global_updates` - System-wide updates
   - `activity_feed` - Real-time activity stream

2. **Events**:
   - `attendance_update` - New attendance recorded
   - `financial_update` - Financial record changed
   - `dashboard_update` - Dashboard metrics refresh
   - `notification` - User-specific alerts

## Scalability Considerations

1. **Database**: Prisma connection pooling, read replicas
2. **Caching**: Redis for sessions, tokens, and rate limiting
3. **File Uploads**: Configurable for S3/CloudFront
4. **API**: Rate limiting per endpoint per IP
5. **Real-time**: Socket.io with Redis adapter for horizontal scaling
6. **Multi-branch**: All entities reference `branchId` for future expansion

## Deployment Architecture

```
Production:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   NGINX      │────▶│   Next.js    │
│   (CDN)      │     │   (SSL +     │     │   (Vercel)   │
└──────────────┘     │   Proxy)     │     └──────────────┘
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐     ┌──────────────┐
                     │   Express    │────▶│  PostgreSQL  │
                     │   (Docker)   │     │  (RDS/Managed)│
                     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │    Redis     │
                     │  (ElastiCache)│
                     └──────────────┘
```

