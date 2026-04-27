# KiPRA API Endpoints Documentation

## Base URL
```
Local: http://localhost:5000/api
Production: https://api.kipra.org/api
```

## Authentication
All protected endpoints require an `Authorization` header:
```
Authorization: Bearer <access_token>
```

## Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Auth Endpoints

### POST `/auth/register`
Register a new user (Super Admin only for role assignment, self-register defaults to LEADER)

**Request:**
```json
{
  "email": "pastor@kipra.org",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678",
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "pastor@kipra.org",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "status": "ACTIVE"
  },
  "message": "User registered successfully"
}
```

### POST `/auth/login`
Authenticate user

**Request:**
```json
{
  "email": "pastor@kipra.org",
  "password": "SecurePass123!"
}
```

**Response (2FA enabled):**
```json
{
  "success": true,
  "data": {
    "requiresTwoFactor": true,
    "userId": "uuid"
  },
  "message": "Two-factor authentication required"
}
```

**Response (direct login):**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "message": "Login successful"
}
```

### POST `/auth/2fa/verify`
Verify 2FA token

**Request:**
```json
{
  "userId": "uuid",
  "token": "123456"
}
```

### POST `/auth/refresh`
Refresh access token

**Request:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### POST `/auth/logout`
Logout user (revokes token)

### GET `/auth/profile`
Get current user profile

### POST `/auth/change-password`
Change password

**Request:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

### POST `/auth/2fa/setup`
Setup 2FA (returns QR code URL)

### POST `/auth/2fa/confirm`
Confirm 2FA setup

---

## Member Endpoints

### GET `/members`
Get all members (paginated, filterable)

**Query Parameters:**
```
?page=1&limit=20&search=john&departmentId=uuid&isLeader=true
```

### POST `/members`
Create new member

**Request:**
```json
{
  "firstName": "James",
  "lastName": "Johnson",
  "email": "james@email.com",
  "phone": "+2348012345678",
  "gender": "MALE",
  "maritalStatus": "MARRIED",
  "departmentId": "uuid",
  "dateOfBirth": "1990-01-15",
  "address": "123 Church Street",
  "emergencyContact": "Jane Johnson",
  "emergencyPhone": "+2348098765432"
}
```

### GET `/members/:id`
Get member by ID

### PUT `/members/:id`
Update member

### DELETE `/members/:id`
Soft delete member

### POST `/members/:id/restore`
Restore deleted member (Super Admin only)

---

## Attendance Endpoints

### GET `/attendance`
Get attendance records

**Query Parameters:**
```
?page=1&limit=20&dateFrom=2024-01-01&dateTo=2024-01-31&type=SUNDAY_SERVICE
```

### POST `/attendance`
Record attendance

**Request:**
```json
{
  "date": "2024-01-15T00:00:00Z",
  "type": "SUNDAY_SERVICE",
  "serviceName": "Sunday Service",
  "menCount": 50,
  "womenCount": 80,
  "childrenCount": 30,
  "youthCount": 25,
  "visitorCount": 10,
  "notes": "Special service"
}
```

### GET `/attendance/:id`
Get attendance record

### PUT `/attendance/:id`
Update attendance

### DELETE `/attendance/:id`
Delete attendance record

---

## Finance Endpoints

### Offerings

#### GET `/finance/offerings`
Get offerings

#### POST `/finance/offerings`
Create offering

**Request:**
```json
{
  "date": "2024-01-15T00:00:00Z",
  "amount": 50000,
  "currency": "NGN",
  "paymentMethod": "CASH",
  "category": "SUNDAY_OFFERING",
  "description": "Week 3 offering"
}
```

#### GET `/finance/offerings/:id`
Get offering

#### PUT `/finance/offerings/:id`
Update offering

#### DELETE `/finance/offerings/:id`
Soft delete offering

#### POST `/finance/offerings/:id/restore`
Restore offering (Super Admin only)

### Tithes

#### GET `/finance/tithes`
Get tithes

**Query Parameters:**
```
?memberId=uuid&month=2024-01
```

#### POST `/finance/tithes`
Record tithe

**Request:**
```json
{
  "date": "2024-01-15T00:00:00Z",
  "amount": 10000,
  "memberId": "uuid",
  "month": "2024-01",
  "paymentMethod": "BANK_TRANSFER",
  "notes": "Monthly tithe"
}
```

#### PUT `/finance/tithes/:id`
Update tithe

#### DELETE `/finance/tithes/:id`
Soft delete tithe

### Pledges

#### GET `/finance/pledges`
Get pledges

#### POST `/finance/pledges`
Create pledge

**Request:**
```json
{
  "memberId": "uuid",
  "title": "Building Fund",
  "targetAmount": 100000,
  "dueDate": "2024-12-31T00:00:00Z",
  "paymentSchedule": "MONTHLY",
  "notes": "Church building project"
}
```

#### POST `/finance/pledges/:id/payments`
Record pledge payment

**Request:**
```json
{
  "amount": 10000,
  "paymentDate": "2024-01-15",
  "paymentMethod": "CASH",
  "notes": "January payment"
}
```

#### PUT `/finance/pledges/:id`
Update pledge

#### DELETE `/finance/pledges/:id`
Soft delete pledge

### Expenses

#### GET `/finance/expenses`
Get expenses

#### POST `/finance/expenses`
Record expense

**Request:**
```json
{
  "date": "2024-01-15T00:00:00Z",
  "amount": 25000,
  "currency": "NGN",
  "category": "UTILITIES",
  "description": "Electricity bill",
  "paymentMethod": "BANK_TRANSFER",
  "vendor": "PHCN",
  "receiptNumber": "REC-001"
}
```

#### PUT `/finance/expenses/:id`
Update expense

#### DELETE `/finance/expenses/:id`
Delete expense

### Reports

#### GET `/finance/reports/summary`
Financial summary

**Query Parameters:**
```
?dateFrom=2024-01-01&dateTo=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOfferings": 150000,
    "totalTithes": 80000,
    "totalPledgePayments": 50000,
    "totalExpenses": 50000,
    "netTotal": 230000,
    "currency": "NGN"
  }
}
```

#### GET `/finance/reports/trends`
Financial trends (monthly)

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "offerings": [150000, 160000, 145000],
    "tithes": [80000, 85000, 82000],
    "expenses": [50000, 60000, 55000]
  }
}
```

---

## Calendar Endpoints

### GET `/calendar`
Get events

**Query Parameters:**
```
?page=1&limit=20&startDate=2024-01-01&endDate=2024-01-31&type=SUNDAY_SERVICE
```

### POST `/calendar`
Create event

**Request:**
```json
{
  "title": "Midweek Service",
  "description": "Wednesday prayer and teaching",
  "type": "MIDWEEK_SERVICE",
  "startDate": "2024-01-17",
  "endDate": "2024-01-17",
  "startTime": "18:00",
  "endTime": "20:00",
  "location": "Main Sanctuary",
  "isVirtual": false,
  "isRecurring": true,
  "recurrencePattern": "WEEKLY",
  "sendReminder": true,
  "reminderHours": 24
}
```

### GET `/calendar/:id`
Get event

### PUT `/calendar/:id`
Update event

### DELETE `/calendar/:id`
Delete event

---

## Leadership Endpoints

### Departments

#### GET `/leadership/departments`
Get departments

#### POST `/leadership/departments`
Create department

**Request:**
```json
{
  "name": "Media Department",
  "description": "Handles all media and technical operations",
  "color": "#3B82F6",
  "sortOrder": 5
}
```

#### GET `/leadership/departments/:id`
Get department

#### PUT `/leadership/departments/:id`
Update department

#### DELETE `/leadership/departments/:id`
Delete department

### Leaders

#### GET `/leadership/leaders`
Get leaders

#### POST `/leadership/leaders`
Create leader

**Request:**
```json
{
  "name": "Pastor James Wilson",
  "title": "Head Pastor",
  "email": "j.wilson@kipra.org",
  "phone": "+2348012345678",
  "role": "APOSTLE",
  "departmentId": "uuid",
  "responsibilities": "Oversees all church operations",
  "bio": "Pastor Wilson has led the church since 2010...",
  "avatar": "https://...",
  "socialLinks": {"twitter": "@pastorwilson"}
}
```

#### GET `/leadership/leaders/:id`
Get leader

#### PUT `/leadership/leaders/:id`
Update leader

#### DELETE `/leadership/leaders/:id`
Delete leader

---

## Dashboard Endpoints

### GET `/dashboard/stats`
Dashboard statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 500,
    "todayAttendance": 165,
    "monthlyOfferings": 150000,
    "monthlyTithes": 80000,
    "activePledges": 25,
    "upcomingEventsCount": 5,
    "newMembersThisMonth": 12,
    "visitorConversionRate": 15
  }
}
```

### GET `/dashboard/attendance-trends`
Attendance trends (last 12 weeks)

### GET `/dashboard/giving-summary`
Giving summary by category

### GET `/dashboard/recent-activity`
Recent system activity

---

## Audit Endpoints

### GET `/audit/logs`
Get audit logs (Super Admin only)

**Query Parameters:**
```
?page=1&limit=50&action=UPDATE&entityType=members&userId=uuid
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "UPDATE",
      "entityType": "members",
      "entityId": "member-uuid",
      "user": {
        "firstName": "Admin",
        "lastName": "User",
        "role": "ADMIN"
      },
      "oldValues": { "email": "old@email.com" },
      "newValues": { "email": "new@email.com" },
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET `/audit/deleted-records`
Get deleted records vault

**Query Parameters:**
```
?entityType=members&page=1&limit=20
```

### POST `/audit/deleted-records/:id/restore`
Restore a deleted record

**Request:**
```json
{
  "reason": "Record restored after verification"
}
```

---

## Notification Endpoints

### GET `/notifications`
Get user notifications

### PATCH `/notifications/:id/read`
Mark notification as read

---

## Users Endpoints

### GET `/users`
Get all users (Admin+)

---

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:5000', {
  auth: { token: 'jwt_access_token' }
});
```

### Events

#### Listen for dashboard updates
```javascript
socket.on('dashboard_update', (data) => {
  console.log('Dashboard updated:', data);
});
```

#### Listen for notifications
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

#### Listen for activity feed
```javascript
socket.emit('subscribe_activity');
socket.on('activity', (activity) => {
  console.log('New activity:', activity);
});
```

#### Emit attendance update
```javascript
socket.emit('attendance_update', {
  serviceId: 'uuid',
  attendance: 175,
  timestamp: new Date().toISOString()
});
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Validation Error - Input validation failed |
| 429 | Rate Limited - Too many requests |
| 500 | Internal Server Error |

## Rate Limits

| Route | Limit |
|-------|-------|
| POST /auth/login | 5 per 15 minutes |
| All other routes | 100 per 15 minutes |

