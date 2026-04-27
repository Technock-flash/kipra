/** User-facing labels for Prisma/enum values used in admin and audit UIs. */

const ENTITY_TYPE_LABELS: Record<string, string> = {
  member: 'Member',
  user: 'User',
  offering: 'Offering',
  tithe: 'Tithe',
  pledge: 'Pledge',
  expense: 'Expense',
  attendance: 'Attendance',
  event: 'Event',
  department: 'Department',
  lead: 'Leader record',
  leadership: 'Leader record',
  financialrecord: 'Financial record',
  branch: 'Branch',
};

const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TREASURER: 'Treasurer',
  SECRETARY: 'Secretary',
  APOSTLE: 'Apostle',
  LEADER: 'Leader',
};

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  PENDING_2FA: 'Pending 2FA',
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Created',
  READ: 'Viewed',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
  RESTORE: 'Restored',
  EXPORT: 'Exported',
  APPROVE: 'Approved',
  REJECT: 'Rejected',
};

export function formatEntityTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Record';
  const key = type.toLowerCase();
  if (ENTITY_TYPE_LABELS[key]) return ENTITY_TYPE_LABELS[key];
  return type
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatUserRole(role: string | null | undefined): string {
  if (!role) return '—';
  if (USER_ROLE_LABELS[role]) return USER_ROLE_LABELS[role];
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatUserStatus(status: string | null | undefined): string {
  if (!status) return '—';
  if (USER_STATUS_LABELS[status]) return USER_STATUS_LABELS[status];
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditAction(action: string | null | undefined): string {
  if (!action) return 'Action';
  if (AUDIT_ACTION_LABELS[action]) return AUDIT_ACTION_LABELS[action];
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Optional one-line context from the JSON snapshot (avoids raw enum fields in the UI). */
export function formatDeletedRecordSnapshotLine(data: unknown, entityType: string): string | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const t = entityType.toLowerCase();
  if ((t === 'member' || t === 'user') && typeof o.firstName === 'string') {
    const last = typeof o.lastName === 'string' ? o.lastName : '';
    return `${o.firstName} ${last}`.trim();
  }
  return null;
}
