'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import {
  formatEntityTypeLabel,
  formatUserRole,
  formatUserStatus,
  formatAuditAction,
  formatDeletedRecordSnapshotLine,
} from '@/lib/labels';

interface AuditLog {
  id: string;
  entityType: string;
  action: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
}

interface DeletedRecord {
  id: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  /** Legacy / alternate field if API ever maps it */
  deletedAt?: string;
  deletedByRole?: string | null;
  data?: unknown;
}

interface UserAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

export default function AdminPage() {
  const { user, hasPermission } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [deletedError, setDeletedError] = useState('');
  const [userError, setUserError] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'LEADER',
  });

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data.data ?? []);
      } catch (err: any) {
        setUserError(err.response?.data?.message || 'Failed to load users');
      }

      try {
        const deletedRes = await api.get('/audit/deleted-records?limit=10&page=1');
        setDeletedRecords(deletedRes.data.data ?? []);
      } catch (err: any) {
        setDeletedError(err.response?.data?.message || 'Failed to load deleted records');
      }

      try {
        const logsRes = await api.get('/audit/logs?limit=10&page=1');
        setAuditLogs(logsRes.data.data ?? []);
      } catch (err: any) {
        setAuditError(err.response?.data?.message || 'Audit logs may require Super Admin role');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const reloadUsers = async () => {
    const usersRes = await api.get('/users');
    setUsers(usersRes.data.data ?? []);
  };

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('user:create')) return;
    setIsSubmitting(true);
    setCreateError('');
    try {
      await api.post('/users', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
      });
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: user?.role === 'ADMIN' ? 'LEADER' : 'APOSTLE',
      });
      await reloadUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Audit activity and deleted-record recovery overview.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading admin data...</p>}

      {hasPermission('user:create') && (
        <Card>
          <CardHeader>
            <CardTitle>Create User Account</CardTitle>
            <CardDescription>
              {user?.role === 'ADMIN'
                ? 'Admins can create Apostle and Leader accounts.'
                : 'Create user accounts and assign roles.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {createError && <p className="text-sm text-red-500 mb-3">{createError}</p>}
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitUser}>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  {user?.role === 'ADMIN' ? (
                    <>
                      <option value="APOSTLE">Apostle</option>
                      <option value="LEADER">Leader</option>
                    </>
                  ) : (
                    <>
                      <option value="APOSTLE">Apostle</option>
                      <option value="LEADER">Leader</option>
                      <option value="SECRETARY">Secretary</option>
                      <option value="TREASURER">Treasurer</option>
                      <option value="ADMIN">Admin</option>
                    </>
                  )}
                </select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>Recently created active user accounts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {userError && <p className="text-sm text-red-500">{userError}</p>}
          {!userError &&
            users.slice(0, 10).map((account) => (
              <div key={account.id} className="border rounded-md p-3">
                <p className="font-medium">{account.firstName} {account.lastName}</p>
                <p className="text-sm text-muted-foreground">
                  {account.email} | {formatUserRole(account.role)} | {formatUserStatus(account.status)}
                </p>
              </div>
            ))}
          {!userError && users.length === 0 && (
            <p className="text-sm text-muted-foreground">No user accounts found.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deleted Records</CardTitle>
            <CardDescription>Recent soft-deleted entities available for restore.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deletedError && <p className="text-sm text-red-500">{deletedError}</p>}
            {!deletedError &&
              deletedRecords.map((record) => {
                const snapshot = formatDeletedRecordSnapshotLine(record.data, record.entityType);
                const timeRaw = record.createdAt ?? record.deletedAt;
                const when = timeRaw ? new Date(timeRaw) : null;
                const timeLabel = when && !Number.isNaN(when.getTime()) ? when.toLocaleString() : '—';
                return (
                <div key={record.id} className="border rounded-md p-3">
                  <p className="font-medium">{formatEntityTypeLabel(record.entityType)}</p>
                  {snapshot && <p className="text-sm text-foreground/90 mt-0.5">{snapshot}</p>}
                  <p className="text-sm text-muted-foreground">
                    ID: {record.entityId} | Deleted: {timeLabel}
                    {record.deletedByRole && (
                      <> | By: {formatUserRole(record.deletedByRole)}</>
                    )}
                  </p>
                </div>
                );
              })}
            {!deletedError && deletedRecords.length === 0 && (
              <p className="text-sm text-muted-foreground">No deleted records found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>Recent tracked system actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditError && <p className="text-sm text-amber-600">{auditError}</p>}
            {!auditError &&
              auditLogs.map((log) => (
                <div key={log.id} className="border rounded-md p-3">
                  <p className="font-medium">
                    {formatAuditAction(log.action)} · {formatEntityTypeLabel(log.entityType)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'} |{' '}
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            {!auditError && auditLogs.length === 0 && (
              <p className="text-sm text-muted-foreground">No audit logs found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
