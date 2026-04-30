'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TREASURER' | 'SECRETARY' | 'APOSTLE' | 'LEADER' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: string;
  twoFactorEnabled: boolean;
  linkedMemberId?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ requiresTwoFactor?: boolean; userId?: string; user?: User }>;
  verify2FA: (email: string, token: string, userId: string) => Promise<User | undefined>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'member:create', 'member:read', 'member:update', 'member:delete',
    'attendance:create', 'attendance:read', 'attendance:update', 'attendance:delete',
    'finance:create', 'finance:read', 'finance:update', 'finance:delete',
    'calendar:create', 'calendar:read', 'calendar:update', 'calendar:delete',
    'leadership:create', 'leadership:read', 'leadership:update', 'leadership:delete',
    'deleted_records:read', 'dashboard:read', 'settings:manage',
    'notification:read', 'notification:broadcast',
    'gallery:read', 'gallery:manage',
  ],
  TREASURER: [
    'member:read',
    'attendance:read',
    'finance:create', 'finance:read', 'finance:update', 'finance:delete',
    'calendar:read', 'dashboard:read',
    'notification:read',
    'gallery:read',
  ],
  SECRETARY: [
    'member:create', 'member:read', 'member:update', 'member:delete',
    'attendance:create', 'attendance:read', 'attendance:update', 'attendance:delete',
    'finance:read',
    'calendar:create', 'calendar:read', 'calendar:update', 'calendar:delete',
    'dashboard:read',
    'notification:read',
    'gallery:read',
  ],
  APOSTLE: [
    'member:read', 'attendance:read', 'finance:read', 'calendar:read',
    'leadership:create', 'leadership:read', 'leadership:update', 'leadership:delete',
    'dashboard:read',
    'notification:read', 'notification:broadcast',
    'gallery:read',
  ],
  LEADER: [
    'member:read', 'attendance:read', 'calendar:read',
    'finance:read', 'leadership:read', 'dashboard:read',
    'notification:read',
    'gallery:read',
  ],
  MEMBER: [
    'portal:read',
    'portal:update',
    'portal:attendance:read',
    'portal:finance:read',
    'portal:event:register',
    'portal:prayer:create',
    'portal:ministry:request',
    'notification:read',
    'gallery:read',
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data.data;

    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true, userId: data.userId };
    }

    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    setUser(data.user);
    return { user: data.user as User };
  };

  const verify2FA = async (email: string, token: string, userId: string) => {
    const response = await api.post('/auth/2fa/verify', { email, token, userId });
    const data = response.data.data;
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    setUser(data.user);
    return data.user as User;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      router.push('/auth/login');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      verify2FA,
      logout,
      hasPermission,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

