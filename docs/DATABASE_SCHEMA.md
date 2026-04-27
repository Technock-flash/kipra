# KiPRA - Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    roles    │────<│  role_perms │>────│ permissions │
└─────────────┘     └─────────────┘     └─────────────┘
      │
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    users    │────<│ audit_logs  │     │ departments │
└─────────────┘     └─────────────┘     └─────────────┘
      │
      │              ┌─────────────┐     ┌─────────────┐
      └───────>──────│   members   │─────│   leaders   │
                     └─────────────┘     └─────────────┘
      │                      │
      │              ┌───────┴───────┐
      │              │               │
      │              ▼               ▼
      │       ┌───────────┐   ┌──────────────┐
      │       │attendance │   │individual_att│
      │       └───────────┘   └──────────────┘
      │
      │              ┌─────────────┐
      │              │   events    │
      │              └─────────────┘
      │
      │       ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
      └──────>│offerings │  │  tithes  │  │ pledges  │  │ expenses │
              └──────────┘  └──────────┘  └────┬─────┘  └──────────┘
                                               │
                                               ▼
                                         ┌──────────┐
                                         │pledge_payments
                                         └──────────┘

      │       ┌──────────────┐
      └──────>│deleted_records│  (Recovery Vault)
              └──────────────┘
```

## Table Definitions

### 1. users
Storing all system user accounts with authentication credentials.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | String | UNIQUE | Login email |
| password | String | | Bcrypt hashed password |
| firstName | String | | User's first name |
| lastName | String | | User's last name |
| phone | String? | | Contact phone |
| role | UserRole | DEFAULT | User's role enum |
| status | UserStatus | DEFAULT | Account status |
| twoFactorEnabled | Boolean | DEFAULT false | 2FA enabled flag |
| twoFactorSecret | String? | | TOTP secret (encrypted) |
| avatar | String? | | Profile image URL |
| lastLoginAt | DateTime? | | Last login timestamp |
| createdAt | DateTime | DEFAULT now() | Record creation |
| updatedAt | DateTime | autoUpdate | Last modification |
| deletedAt | DateTime? | Soft delete | Deletion timestamp |

### 2. roles
Role definitions for the system.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | String | UNIQUE | Role name |
| description | String? | | Role description |
| color | String | DEFAULT | UI display color |

### 3. permissions
Individual permission definitions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | String | UNIQUE | Permission name |
| description | String? | | Permission description |
| resource | String | | Resource category |
| action | String | | Action type |

### 4. role_permissions
Many-to-many link between roles and permissions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| roleId | UUID | FK → roles | Role reference |
| permissionId | UUID | FK → permissions | Permission reference |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |

**Unique Constraint**: (roleId, permissionId)

### 5. members
Church member profiles.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| memberNumber | String | UNIQUE | Auto-generated member number |
| firstName | String | | Member's first name |
| lastName | String | | Member's last name |
| email | String? | UNIQUE | Member email |
| phone | String? | | Contact phone |
| gender | Gender? | | Biological gender |
| maritalStatus | MaritalStatus? | | Marital status |
| departmentId | UUID? | FK → departments | Department membership |
| isLeader | Boolean | DEFAULT false | Leadership flag |
| leaderRole | String? | | Specific leadership title |
| joinDate | DateTime? | | Date joined church |
| birthDate | DateTime? | | Date of birth |
| address | String? | | Home address |
| baptismDate | DateTime? | | Water baptism date |
| salvationDate | DateTime? | | Salvation date |
| occupation | String? | | Occupation |
| notes | String? | | Additional notes |
| createdBy | UUID? | FK → users | User who created |
| createdAt | DateTime | DEFAULT now() | Creation |
| updatedAt 
