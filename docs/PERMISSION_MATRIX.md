# KiPRA - User Role Permission Matrix

## Access Level Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Full Access (CRUD) |
| 📝 | Create & Read Only |
| 👁️ | Read Only |
| ❌ | No Access |

---

## Module: Authentication & Users

| Feature | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|---------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **User Management** |
| Create User (All roles) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit User Profile | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete User (soft) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage User Permissions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View User List | ✅ | ✅ | 👁️ | 👁️ | 👁️ | ❌ |
| **Profile** |
| View Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change Own Password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enable/Disable 2FA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Module: Membership

| Feature | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|---------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **Member Records** |
| Create Member | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit Member | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Soft Delete Member | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Restore Deleted Member | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Member List | ✅ | ✅ | 👁️ | ✅ | 👁️ | 👁️ |
| View Member Detail | ✅ | ✅ | 👁️ | ✅ | 👁️ | 👁️ |
| Export Members (PDF/Excel) | ✅ | ✅ | ❌ | ✅ | ❌ | 👁️ |

## Module: Attendance

| Feature | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|---------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **Attendance Tracking** |
| Record Service Attendance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Record Dept Attendance | ✅ | ✅ | ❌ | ✅ | ❌ | ✅* |
| Edit Attendance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete Attendance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View Attendance Reports | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ |
| View Attendance Trends | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ |
| Export Attendance | ✅ | ✅ | ❌ | ✅ | ❌ | 👁️ |

> *Leader can only record for their own department

## Module: Finance

| Feature | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|---------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **Offerings** |
| Record Offering | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Offering | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Soft Delete Offering | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Restore Deleted Offering | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Offering Reports | ✅ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| **Tithes** |
| Record Tithe | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Tithe | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Soft Delete Tithe | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Restore Deleted Tithe | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Tithe Reports | ✅ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| **Pledges** |
| Create Pledge | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Pledge | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Record Pledge Payment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Soft Delete Pledge | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Pledge Reports | ✅ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| **Expenses** |
| Record Expense | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Expense | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Expense | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Financial Reports** |
| View Financial Summary | ✅ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| View Financial Trends | ✅ | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| View Audit Trail | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export Financial Reports | ✅ | ✅ | ✅ | ❌ | ❌ | 👁️ |

> **Financial Protection**: No user can permanently delete financial records. Only Super Admin can restore soft-deleted records. All edits are logged with old/new values.

## Module: Church Calendar

| Feature | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|---------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **Events** |
| Create Event | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Edit Event | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Delete Event | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| View Calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Event Detail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Module: Leadership Management

| Feature | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|---------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **Departments** |
| Create Department | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Edit Department | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Delete Department | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| View Departments | ✅ | ✅ | 👁️ | 👁️ | ✅ | 👁️ |
| **Leaders** |
| Assign Leader | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Edit Leader | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Remove Leader | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| View Leaders | ✅ | ✅ | 👁️ | 👁️ | ✅ | 👁️ |
| Edit Own Leader Profile | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

## Module: Dashboard & Analytics

| Feature | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|---------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **Dashboard** |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Real-time Data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Activity Feed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Module: System Administration

| Feature | Super Admin | Admin | Treasurer | Secretary | Apostle | Leader |
|---------|:-----------:|:-----:|:---------:|:---------:|:-------:|:------:|
| **Audit & Recovery** |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Deleted Records Vault | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Restore Any Deleted Record | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Other** |
| Receive Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Backup & Restore DB | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Authorization Rules Summary

### Super Admin
- **Full system access** - no restrictions
- Can create/manage users with any role
- Can restore any soft-deleted record
- Can view all audit logs
- Can manage system settings

### Admin
- Full access to all operational modules
- Can view deleted records vault (cannot restore all - only specific records)
- Can manage all users (except Super Admin)
- Cannot view system audit logs
- Cannot manage system settings

### Treasurer
- **Finance-only access** with full financial CRUD
- Can edit/update financial records
- Cannot permanently delete (soft delete only)
- Can view financial audit trails
- Cannot restore deleted financial records

### Secretary
- Member, Attendance, and Calendar CRUD
- Can view financial summaries only
- Cannot manage users or leadership (except member records)

### Apostle
- **Leadership Management only**
- Full CRUD on departments and leaders
- View-only on dashboard, reports
- No financial or user management access (except leader profiles)

### Leader (Other)
- **View-only access** to all operational data
- Can record attendance for own department
- Cannot modify any data
- Can view dashboards, reports, calendars

---

## Middleware Enforcement

The system enforces these permissions at the API level using:

1. **Authentication Middleware** (`auth.ts`) - Validates JWT token
2. **RBAC Middleware** (`rbac.ts`) - Checks role-based permissions
3. **Audit Logger** (`auditLogger.ts`) - Logs all actions

Each route has explicit permission requirements defined in the route handlers.

