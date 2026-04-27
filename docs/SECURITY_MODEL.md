# KiPRA Security Model

## Overview

The Kingdom Power Royal Assembly Church Management System implements a defense-in-depth security strategy with multiple layers of protection for sensitive church data, financial records, and member information.

---

## Authentication Security

### JWT Token Implementation
| Component | Specification |
|-----------|---------------|
| Access Token | 15-minute expiration |
| Refresh Token | 7-day expiration |
| Algorithm | RS256 (recommended) or HS256 |
| Storage | Client: localStorage (access) / httpOnly cookie (refresh) |

### Token Lifecycle
1. User authenticates with email/password
2. Server validates credentials
3. If 2FA enabled, user provides TOTP code
4. Server issues access token (JWT) + refresh token
5. Client stores access token in memory/localStorage
6. Refresh token stored in httpOnly cookie
7. On token expiry, client uses refresh token for new access token
8. Logout blacklists token in Redis

### Two-Factor Authentication (2FA)
- **Method**: TOTP (Time-based One-Time Password)
- **Library**: speakeasy
- **Setup**: QR code generation for authenticator apps (Google Authenticator, Authy)
- **Backup Codes**: Single-use codes for account recovery
- **Enforcement**: Optional per-user, configurable by Super Admin

### Password Security
| Aspect | Implementation |
|--------|-----------------|
| Hashing Algorithm | bcrypt |
| Salt Rounds | 12 |
| Minimum Length | 8 characters |
| Complexity | Uppercase, lowercase, number, special character |
| History | Last 5 passwords cannot be reused |
| Lockout | 5 failed attempts = 30-minute lockout |

---

## Authorization & RBAC

### Role Hierarchy
```
SUPER_ADMIN
  └── ADMIN
        ├── TREASURER
        ├── SECRETARY
        └── APOSTLE
              └── LEADER
```

### Permission Enforcement Flow
```
Request → Auth Middleware → RBAC Middleware → Audit Logger → Controller
              ↓                    ↓              ↓
         Verify JWT          Check Role     Log Action
         Check Blacklist     Check Perm     Before Proceed
```

### Permission Matrix Implementation
- Stored in `src/utils/permissions.ts`
- Enforced at route level using `requirePermission()` middleware
- Checked before any database operation
- Returns 403 Forbidden for unauthorized access

---

## Data Protection

### Encryption at Rest
| Data Type | Encryption Method |
|-----------|-------------------|
| Financial Records | AES-256 via crypto-js |
| Member Phone Numbers | AES-256 (configurable) |
| Sensitive Notes | AES-256 (configurable) |
| Passwords | bcrypt hashing |

### Encryption in Transit
- TLS 1.3 for all communications
- HSTS headers enforced
- Secure cookie flags (httpOnly, secure, sameSite)

### Soft Delete Strategy
```
Permanent Delete (Never used for financial data)
        ↓
Soft Delete (deletedAt timestamp)
        ↓
Deleted Records Vault (Admin viewable)
        ↓
Permanent Purge (Super Admin only, after retention period)
```

### Financial Data Protection
1. **No Hard Delete**: All financial records use soft delete only
2. **Edit Audit Trail**: Every edit preserves old and new values
3. **Transaction Logs**: Separate table for all financial edits
4. **Treasurer Constraint**: Can edit but never permanently delete
5. **Restore Capability**: Only Super Admin can restore deleted financial records

---

## Audit & Logging

### Audit Log Capture
Every Create, Update, Delete operation logs:
- **Who**: userId, userRole
- **What**: action, entityType, entityId
- **When**: timestamp with timezone
- **Where**: IP address, user agent
- **Changes**: oldValues, newValues (diff)

### Log Types
| Layer | Content | Retention |
|-------|---------|-----------|
| Application | Winston logs (info, warn, error) | 30 days |
| Audit | Database audit_logs table | 7 years |
| Security | Failed logins, access denials | 1 year |
| System | Server errors, exceptions | 90 days |

### Audit Log Access
- **Super Admin**: Full audit log access
- **Admin**: Operational audit logs (no security events)
- **Other Roles**: No audit log access

---

## API Security

### Rate Limiting
| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| `/auth/login` | 15 minutes | 5 |
| `/auth/register` | 15 minutes | 10 |
| All other endpoints | 15 minutes | 100 |

### Input Validation
- **Framework**: Zod schemas
- **Location**: Centralized validators in `src/validators/`
- **Coverage**: All API inputs (body, query, params)
- **Sanitization**: Prevent SQL injection, XSS, NoSQL injection

### CORS Policy
```javascript
{
  origin: process.env.FRONTEND_URL, // Strict origin
  credentials: true,                // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### Security Headers (Helmet.js)
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security` (in production)

---

## Database Security

### Connection Security
- PostgreSQL connection over SSL in production
- Password authentication required
- Connection pooling with limited connections
- No direct external database access

### Query Safety
- **ORM**: Prisma (prevents SQL injection)
- **No Raw Queries**: All queries through Prisma client
- **Parameterized Queries**: Automatic parameterization

### Data Isolation
- Multi-tenant ready (branch_id field on all tables)
- Role-based data filtering in services
- Deleted records excluded from queries by default

---

## Redis Security

### Session Storage
- Access tokens cached for quick validation
- Refresh tokens mapped to user sessions
- Blacklist storage for revoked tokens
- TTL-based automatic expiration

### Cache Strategy
- Dashboard statistics cached (5 minutes)
- Member lists cached (10 minutes)
- Financial summaries cached (1 minute)
- Cache invalidation on data mutation

---

## File Upload Security

### Controls
| Control | Implementation |
|---------|---------------|
| File Size | Max 5MB |
| File Types | Whitelist: jpg, png, pdf, doc, docx |
| Storage | Server filesystem (not public) |
| Virus Scan | ClamAV integration (recommended) |
| Access | Signed URL with expiry |

---

## Socket.IO Security

### Authentication
- JWT token validated on connection
- Token sent in `auth` handshake parameter
- Connection rejected for invalid tokens
- Re-authentication on token refresh

### Authorization
- Role-based room subscription
- Private rooms per user ID
- Event-level permission checking
- Rate limiting on emit events

---

## Deployment Security

### Environment Variables
```
Required Secrets:
- JWT_SECRET (min 32 chars)
- JWT_REFRESH_SECRET (different from JWT_SECRET)
- ENCRYPTION_KEY (32 chars for AES-256)
- DATABASE_URL (contains password)
- REDIS_URL (contains password)
- SMTP_PASS (email password)

Never Commit:
- All .env files → .gitignore
- Private keys
- Database dumps
```

### Docker Security
- Non-root user in containers
- Read-only filesystem where possible
- No SSH daemon in containers
- Secret injection via env files
- Network segmentation (frontend/backend/db)

---

## Incident Response

### Security Event Monitoring
| Event | Action |
|-------|--------|
| 5 Failed Login Attempts | Account locked, email alert |
| Unauthorized Access Attempt | Logged, IP tracked |
| Mass Data Export | Flagged for review |
| Financial Record Edit | Logged with old/new values |
| After-Hours Admin Access | Logged, potential alert |

### Recovery Procedures
1. Identify breach scope from audit logs
2. Revoke compromised tokens via Redis blacklist
3. Force password reset for affected users
4. Review and restore from backup if needed
5. Document incident and improve controls

---

## Compliance Considerations

### Data Privacy
- GDPR-ready (data export/deletion)
- Consent tracking for communications
- Data retention policies configurable
- Encryption for sensitive PII

### Financial Compliance
- Audit trail for all transactions
- Immutable financial records (soft delete)
- Separation of duties (Treasurer vs Admin)
- Monthly reconciliation reports

---

## Security Checklist

### Development
- [ ] No secrets in code
- [ ] Input validation on all endpoints
- [ ] Output encoding for XSS prevention
- [ ] Dependency vulnerability scanning
- [ ] Secure error messages (no stack traces in production)

### Testing
- [ ] Authentication bypass tests
- [ ] Authorization boundary tests
- [ ] SQL injection tests
- [ ] XSS vulnerability tests
- [ ] Rate limiting tests
- [ ] CSRF protection tests

### Production
- [ ] TLS certificates valid
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database backups encrypted
- [ ] Monitoring and alerting active
- [ ] Incident response plan documented

