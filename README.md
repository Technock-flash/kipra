# Kingdom Power Royal Assembly (KiPRA) - Church Management System

<p align="center">
  <img src="https://via.placeholder.com/200x200/2563EB/FFFFFF?text=KiPRA" alt="KiPRA Logo" width="200"/>
</p>

<h1 align="center">KiPRA Church Management System</h1>

<p align="center">
  A modern, secure, and scalable church management platform designed for Kingdom Power Royal Assembly leadership.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Prisma-5.7-green" alt="Prisma"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Socket.IO-4.7-orange" alt="Socket.IO"/>
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Quick Start](#quick-start)
6. [Development Setup](#development-setup)
7. [User Roles](#user-roles)
8. [API Documentation](#api-documentation)
9. [Security](#security)
10. [Testing](#testing)
11. [Documentation](#documentation)
12. [Roadmap](#roadmap)
13. [License](#license)

---

## Overview

KiPRA is a comprehensive church management system built for Kingdom Power Royal Assembly leadership with role-based access control, real-time features, and complete audit trails. The system handles membership, attendance tracking, financial management, event scheduling, and leadership management with military-grade security and data integrity.

### Key Highlights
- **6 Distinct User Roles** with granular permissions
- **Real-time dashboards** with live data sync
- **Financial protection** - soft deletes only, full audit trails
- **Deleted record recovery** vault for administrators
- **Two-factor authentication** support
- **Mobile-responsive** dark mode enabled UI
- **Comprehensive audit logging** - every action tracked

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Next.js 14  │  │  Tailwind CSS│  │  React Query + Sockets│  │
│  │  App Router  │  │  shadcn/ui   │  │  Real-time State      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        API GATEWAY                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Express.js  │  │  JWT + 2FA   │  │  RBAC Middleware     │  │
│  │  REST API    │  │  Auth        │  │  Permission Matrix   │  │
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

## Features

### Core Modules

#### 1. Authentication & Security
- JWT-based authentication with refresh tokens
- Optional two-factor authentication (TOTP)
- Rate limiting on auth endpoints
- Secure password policies (bcrypt, 12 rounds)
- Token blacklisting on logout

#### 2. Dashboard
- Real-time analytics
- Attendance trends (12-week view)
- Giving summaries (monthly/yearly)
- Pledge tracking
- Upcoming events widget
- Activity feed

#### 3. Member Management
- Complete member profiles
- Department assignments
- Leader designation
- Visitor tracking
- Search and filtering
- Export to PDF/Excel

#### 4. Attendance Tracking
- Service attendance (men, women, children, youth, visitors)
- Department-wise attendance
- Historical trends and reports
- Visual analytics

#### 5. Finance Module
- **Offerings** - Multiple categories, payment methods
- **Tithes** - Member-linked, monthly tracking
- **Pledges** - Progress tracking, payment recording
- **Expenses** - Category-based budgeting
- **Reports** - Summary, trends, audit trails
- **Protection** - Soft delete only, edit logging

#### 6. Church Calendar
- Events, services, meetings
- Recurring events
- Reminder notifications
- Location and virtual links

#### 7. Leadership Management
- Department organization
- Leadership hierarchy
- Role assignments
- Profile management

#### 8. Admin Features
- Audit log viewer (Super Admin)
- Deleted records recovery vault
- System settings
- User permission management
- Activity monitoring

### Real-time Features
- Live dashboard updates via WebSockets
- Activity feed streaming
- Financial update broadcasts
- Notification system

### Data Integrity
- Soft delete across all entities
- Deleted record recovery (Super Admin only)
- Full audit history (who, what, when, where)
- Financial edit trails with old/new values
- Transaction logs for accountability

---

## Technology Stack

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 20.x |
| Express.js | API Framework | 4.18 |
| TypeScript | Language | 5.3 |
| Prisma | ORM | 5.7 |
| PostgreSQL | Database | 15 |
| Redis | Cache/Session | 7 |
| Socket.IO | Real-time | 4.7 |
| JWT | Authentication | 9.0 |
| Zod | Validation | 3.22 |
| Winston | Logging | 3.11 |

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | Framework | 14 |
| TypeScript | Language | 5.3 |
| Tailwind CSS | Styling | 3.4 |
| Radix UI | Components | Latest |
| React Query | State Management | 5.17 |
| Axios | HTTP Client | 1.6 |
| Recharts | Charts | 2.10 |
| Socket.IO Client | Real-time | 4.7 |
| date-fns | Date formatting | 3.0 |
| jspdf | PDF Export | 2.5 |
| xlsx | Excel Export | 0.18 |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd kipra-system

# Start infrastructure
docker-compose up -d postgres redis

# Setup backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Setup frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Health**: http://localhost:5001/health
- **Prisma Studio**: http://localhost:5555

### Default Login
```
Email: superadmin@kipra.org
Password: SuperAdmin@2024
```

---

## Development Setup

### Environment Configuration

Create `.env` file in backend directory:

```env
NODE_ENV=development
PORT=5001
API_PREFIX=/api

# Database
DATABASE_URL=postgresql://kipra_admin:kipra_secret_2024@localhost:5433/kipra_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed

# Reset database
npx prisma migrate reset
```

---

## User Roles

### Super Admin
- Full system access
- User and permission management
- Audit log viewing
- Deleted record restoration
- System settings

### Admin
- Full operational access
- Member, attendance, finance, calendar CRUD
- View deleted records vault
- Monitor treasurer and secretary actions

### Treasurer
- Finance module only (Offerings, Tithes, Pledges)
- Can edit financial records
- Cannot permanently delete (soft delete)
- View financial reports

### Secretary
- Member records CRUD
- Attendance tracking
- Calendar management
- Limited financial view

### Apostle
- Leadership management only
- Department and leader CRUD
- View dashboards and reports

### Leader (Other)
- View-only access to all data
- Department attendance recording
- Dashboard and reports viewing

---

## API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Authenticate |
| POST | `/api/auth/2fa/verify` | Verify 2FA |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/profile` | Get profile |

### Core Endpoints
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET/POST | `/api/members` | ✅ |
| GET/POST | `/api/attendance` | ✅ |
| GET/POST | `/api/finance/offerings` | ✅ |
| GET/POST | `/api/finance/tithes` | ✅ |
| GET/POST | `/api/finance/pledges` | ✅ |
| GET/POST | `/api/calendar` | ✅ |
| GET/POST | `/api/leadership/departments` | ✅ |
| GET/POST | `/api/leadership/leaders` | ✅ |

### Admin Endpoints
| Method | Endpoint | Role Required |
|--------|----------|---------------|
| GET | `/api/audit/logs` | SUPER_ADMIN |
| GET | `/api/audit/deleted-records` | ADMIN+ |
| POST | `/api/audit/deleted-records/:id/restore` | SUPER_ADMIN |

Full API documentation: [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)

---

## Security

### Implemented Measures
- JWT authentication with refresh tokens
- Optional two-factor authentication (TOTP)
- Role-based access control (6 roles, 40+ permissions)
- Rate limiting (5 login attempts / 15 min)
- Input validation with Zod schemas
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet.js)
- CORS configuration
- Encrypted financial records
- Soft delete (no permanent deletion)
- Comprehensive audit logging
- Token blacklisting on logout

### Data Protection
- bcrypt password hashing (12 rounds)
- AES-256 encryption for financial data
- Secure cookie configuration
- TLS 1.3 in production
- No secrets in version control

Security documentation: [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md)

---

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run specific test
npx jest auth.test.ts
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run type checker
npm run type-check
```

### Manual Testing Checklist
- [ ] Register user with each role
- [ ] Login/logout flows
- [ ] 2FA setup and verification
- [ ] CRUD for each module
- [ ] Soft delete and restore
- [ ] Role-based access restrictions
- [ ] Real-time dashboard updates
- [ ] Financial edit audit trails
- [ ] Export functionality (PDF/Excel)
- [ ] Mobile responsiveness

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and design |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Database schema and ERD |
| [docs/PERMISSION_MATRIX.md](docs/PERMISSION_MATRIX.md) | Role-permission matrix |
| [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md) | Complete API documentation |
| [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) | Security implementation details |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Implementation roadmap |

---

## Roadmap

### Completed ✅
- Foundation & infrastructure
- Authentication & RBAC
- Core modules ( backend API)
- Data integrity & audit
- Real-time features
- Frontend scaffolding & auth
- Comprehensive documentation

### Next Steps
- Complete frontend module pages
- Add comprehensive test suites
- Email/SMS notification integration
- Member contribution statements
- Automated backup system
- Mobile app development

Full roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)

---

## Project Structure

```
kpra-system/
├── backend/
│   ├── src/
│   │   ├── config/        # Database, Redis config
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, RBAC, validation, audit
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic
│   │   ├── validators/    # Zod validation schemas
│   │   ├── utils/         # Helpers, permissions, encryption
│   │   ├── sockets/       # Socket.IO handlers
│   │   └── server.ts      # Express server setup
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   └── tests/             # Test suites
├── frontend/
│   ├── app/               # Next.js app router
│   │   ├── auth/          # Auth pages
│   │   └── dashboard/     # Dashboard pages
│   ├── components/        # React components
│   ├── context/           # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── docs/                  # Documentation
├── docker-compose.yml     # Infrastructure
└── README.md
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Conventional commit messages
- Comprehensive JSDoc comments

---

## License

This project is proprietary software developed for Kingdom Power Royal Assembly. All rights reserved.

---

## Support

For technical support or questions:
- Email: tech@kipra.org
- Internal Documentation: Check `/docs` folder
- API Reference: See [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)

---

<p align="center">
  Built with ❤️ for Kingdom Power Royal Assembly
</p>

# kipra
