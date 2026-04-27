export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TREASURER' | 'SECRETARY' | 'APOSTLE' | 'LEADER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_2FA';
  twoFactorEnabled: boolean;
  avatar?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  requiresTwoFactor?: boolean;
  userId?: string;
}

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  departmentId?: string;
  department?: Department;
  isLeader: boolean;
  leaderRole?: string;
  joinDate?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Attendance {
  id: string;
  date: string;
  type: string;
  serviceName?: string;
  menCount: number;
  womenCount: number;
  childrenCount: number;
  youthCount: number;
  visitorCount: number;
  totalCount: number;
  notes?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
}

export interface Offering {
  id: string;
  date: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  category?: string;
  description?: string;
  recordedBy: User;
}

export interface Tithe {
  id: string;
  date: string;
  amount: number;
  member: Member;
  month: string;
  paymentMethod: string;
}

export interface Pledge {
  id: string;
  title: string;
  targetAmount: number;
  amountPaid: number;
  status: string;
  member: Member;
  payments: PledgePayment[];
}

export interface PledgePayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  vendor?: string;
}

export interface Leader {
  id: string;
  name: string;
  title: string;
  role: string;
  department: Department;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  user?: User;
  createdAt: string;
}

export interface DashboardStats {
  totalMembers: number;
  todayAttendance: number;
  monthlyOfferings: number;
  upcomingEvents: number;
  monthlyTithes: number;
  activePledges: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

