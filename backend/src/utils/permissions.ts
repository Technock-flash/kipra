import { UserRole } from '@prisma/client';

export enum Permission {
  // Users
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_PERMISSIONS = 'user:manage_permissions',

  // Members
  MEMBER_CREATE = 'member:create',
  MEMBER_READ = 'member:read',
  MEMBER_UPDATE = 'member:update',
  MEMBER_DELETE = 'member:delete',

  // Attendance
  ATTENDANCE_CREATE = 'attendance:create',
  ATTENDANCE_READ = 'attendance:read',
  ATTENDANCE_UPDATE = 'attendance:update',
  ATTENDANCE_DELETE = 'attendance:delete',

  // Finance
  FINANCE_CREATE = 'finance:create',
  FINANCE_READ = 'finance:read',
  FINANCE_UPDATE = 'finance:update',
  FINANCE_DELETE = 'finance:delete',
  FINANCE_RESTORE = 'finance:restore',

// Calendar
  CALENDAR_CREATE = 'calendar:create',
  CALENDAR_READ = 'calendar:read',
  CALENDAR_UPDATE = 'calendar:update',
  CALENDAR_DELETE = 'calendar:delete',
  CALENDAR_EXPORT = 'calendar:export',
  CALENDAR_SYNC = 'calendar:sync',
  CALENDAR_RECURRING_MANAGE = 'calendar:recurring:manage',
  CALENDAR_YEARLY_GENERATE = 'calendar:yearly:generate',

  // Leadership
  LEADERSHIP_CREATE = 'leadership:create',
  LEADERSHIP_READ = 'leadership:read',
  LEADERSHIP_UPDATE = 'leadership:update',
  LEADERSHIP_DELETE = 'leadership:delete',

  // System
  AUDIT_READ = 'audit:read',
  DELETED_RECORDS_READ = 'deleted_records:read',
  DELETED_RECORDS_RESTORE = 'deleted_records:restore',
  DASHBOARD_READ = 'dashboard:read',
  SETTINGS_MANAGE = 'settings:manage',

  // Notifications
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_BROADCAST = 'notification:broadcast',

  // Member Portal
  PORTAL_READ = 'portal:read',
  PORTAL_UPDATE = 'portal:update',
  PORTAL_ATTENDANCE_READ = 'portal:attendance:read',
  PORTAL_FINANCE_READ = 'portal:finance:read',
  PORTAL_EVENT_REGISTER = 'portal:event:register',
  PORTAL_PRAYER_CREATE = 'portal:prayer:create',
  PORTAL_MINISTRY_REQUEST = 'portal:ministry:request',

  // Church gallery
  GALLERY_READ = 'gallery:read',
  GALLERY_MANAGE = 'gallery:manage',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),

  [UserRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_READ,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_DELETE,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_UPDATE,
    Permission.ATTENDANCE_DELETE,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_READ,
    Permission.FINANCE_UPDATE,
    Permission.FINANCE_DELETE,
    Permission.CALENDAR_CREATE,
    Permission.CALENDAR_READ,
    Permission.CALENDAR_UPDATE,
    Permission.CALENDAR_DELETE,
    Permission.CALENDAR_EXPORT,
    Permission.CALENDAR_SYNC,
    Permission.CALENDAR_RECURRING_MANAGE,
    Permission.CALENDAR_YEARLY_GENERATE,
    Permission.LEADERSHIP_CREATE,
    Permission.LEADERSHIP_READ,
    Permission.LEADERSHIP_UPDATE,
    Permission.LEADERSHIP_DELETE,
    Permission.DELETED_RECORDS_READ,
    Permission.DASHBOARD_READ,
    Permission.SETTINGS_MANAGE,
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_BROADCAST,
    Permission.GALLERY_READ,
    Permission.GALLERY_MANAGE,
  ],

  [UserRole.TREASURER]: [
    Permission.MEMBER_READ,
    Permission.ATTENDANCE_READ,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_READ,
    Permission.FINANCE_UPDATE,
    Permission.FINANCE_DELETE,
    Permission.CALENDAR_READ,
    Permission.DASHBOARD_READ,
    Permission.NOTIFICATION_READ,
    Permission.GALLERY_READ,
  ],

  [UserRole.SECRETARY]: [
    Permission.MEMBER_CREATE,
    Permission.MEMBER_READ,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_DELETE,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_UPDATE,
    Permission.ATTENDANCE_DELETE,
    Permission.FINANCE_READ,
    Permission.CALENDAR_CREATE,
    Permission.CALENDAR_READ,
    Permission.CALENDAR_UPDATE,
    Permission.CALENDAR_DELETE,
    Permission.CALENDAR_EXPORT,
    Permission.CALENDAR_RECURRING_MANAGE,
    Permission.CALENDAR_YEARLY_GENERATE,
    Permission.DASHBOARD_READ,
    Permission.NOTIFICATION_READ,
    Permission.GALLERY_READ,
  ],

  [UserRole.APOSTLE]: [
    Permission.MEMBER_READ,
    Permission.ATTENDANCE_READ,
    Permission.FINANCE_READ,
    Permission.CALENDAR_READ,
    Permission.LEADERSHIP_CREATE,
    Permission.LEADERSHIP_READ,
    Permission.LEADERSHIP_UPDATE,
    Permission.LEADERSHIP_DELETE,
    Permission.DASHBOARD_READ,
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_BROADCAST,
    Permission.GALLERY_READ,
  ],

  [UserRole.LEADER]: [
    Permission.MEMBER_READ,
    Permission.ATTENDANCE_READ,
    Permission.CALENDAR_READ,
    Permission.FINANCE_READ,
    Permission.LEADERSHIP_READ,
    Permission.DASHBOARD_READ,
    Permission.NOTIFICATION_READ,
    Permission.GALLERY_READ,
  ],

  [UserRole.MEMBER]: [
    Permission.PORTAL_READ,
    Permission.PORTAL_UPDATE,
    Permission.PORTAL_ATTENDANCE_READ,
    Permission.PORTAL_FINANCE_READ,
    Permission.PORTAL_EVENT_REGISTER,
    Permission.PORTAL_PRAYER_CREATE,
    Permission.PORTAL_MINISTRY_REQUEST,
    Permission.NOTIFICATION_READ,
    Permission.GALLERY_READ,
  ],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role].includes(permission);
};

export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some((permission) => ROLE_PERMISSIONS[role].includes(permission));
};

export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every((permission) => ROLE_PERMISSIONS[role].includes(permission));
};

