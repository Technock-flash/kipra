'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';

interface AttendanceRecord {
  id: string;
  date: string;
  type: string;
  totalCount: number;
  menCount: number;
  womenCount: number;
  childrenCount: number;
  youthCount: number;
  visitorCount: number;
  department?: { name: string } | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const preferredDepartmentOrder = [
  'Praise and Worship',
  'Media Team',
  'Hosting and Decorations',
  'Intercessors',
  'Ushers',
];

const departmentAliases: Record<string, string> = {
  'praise & worship': 'Praise and Worship',
  'praise and worship': 'Praise and Worship',
  'media & technical': 'Media Team',
  'media team': 'Media Team',
  ushering: 'Ushers',
  ushers: 'Ushers',
  intercessors: 'Intercessors',
  'hosting and decorations': 'Hosting and Decorations',
};

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'SUNDAY_SERVICE',
    serviceName: '',
    menCount: '0',
    womenCount: '0',
    childrenCount: '0',
    youthCount: '0',
    visitorCount: '0',
    departmentId: '',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attendanceRes, deptRes] = await Promise.all([
          api.get('/attendance?limit=20&page=1'),
          api.get('/leadership/departments?limit=100&page=1'),
        ]);
        setRecords(attendanceRes.data.data ?? []);
        const rawDepartments: DepartmentOption[] = deptRes.data.data ?? [];
        const aliasMap = new Map<string, DepartmentOption>();
        for (const department of rawDepartments) {
          const normalizedName =
            departmentAliases[department.name.trim().toLowerCase()] || department.name;
          if (!aliasMap.has(normalizedName)) {
            aliasMap.set(normalizedName, { id: department.id, name: normalizedName });
          }
        }
        const ordered = Array.from(aliasMap.values()).sort((a, b) => {
          const aIndex = preferredDepartmentOrder.indexOf(a.name);
          const bIndex = preferredDepartmentOrder.indexOf(b.name);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        setDepartments(ordered);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load attendance');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const reloadAttendance = async () => {
    const response = await api.get('/attendance?limit=20&page=1');
    setRecords(response.data.data ?? []);
  };

  const submitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('attendance:create')) return;
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/attendance', {
        date: new Date(`${form.date}T00:00:00.000Z`).toISOString(),
        type: form.type,
        serviceName: form.serviceName || undefined,
        menCount: Number(form.menCount),
        womenCount: Number(form.womenCount),
        childrenCount: Number(form.childrenCount),
        youthCount: Number(form.youthCount),
        visitorCount: Number(form.visitorCount),
        departmentId: form.departmentId || undefined,
        notes: form.notes || undefined,
      });
      await reloadAttendance();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Track service attendance and participation trends.</p>
      </div>

      {hasPermission('attendance:create') ? (
        <Card>
          <CardHeader>
            <CardTitle>Record Attendance</CardTitle>
            <CardDescription>Create a new attendance entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitAttendance}>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="SUNDAY_SERVICE">Sunday Service</option>
                <option value="MIDWEEK_SERVICE">Midweek Service</option>
                <option value="PRAYER_MEETING">Prayer Meeting</option>
                <option value="DEPARTMENTAL">Departmental</option>
                <option value="SPECIAL_EVENT">Special Event</option>
                <option value="VISITOR">Visitor</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                value={form.serviceName}
                onChange={(e) => setForm((prev) => ({ ...prev, serviceName: e.target.value }))}
                placeholder="e.g. Sunday Morning Service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menCount">Men</Label>
              <Input id="menCount" type="number" min="0" value={form.menCount} onChange={(e) => setForm((prev) => ({ ...prev, menCount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="womenCount">Women</Label>
              <Input id="womenCount" type="number" min="0" value={form.womenCount} onChange={(e) => setForm((prev) => ({ ...prev, womenCount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childrenCount">Children</Label>
              <Input id="childrenCount" type="number" min="0" value={form.childrenCount} onChange={(e) => setForm((prev) => ({ ...prev, childrenCount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youthCount">Youth</Label>
              <Input id="youthCount" type="number" min="0" value={form.youthCount} onChange={(e) => setForm((prev) => ({ ...prev, youthCount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitorCount">Visitors</Label>
              <Input id="visitorCount" type="number" min="0" value={form.visitorCount} onChange={(e) => setForm((prev) => ({ ...prev, visitorCount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <select
                id="departmentId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.departmentId}
                onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
              >
                <option value="">No department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Record Attendance'}
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>You have view-only access for attendance data.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>Latest service attendance entries.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading attendance...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Department</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{item.type}</td>
                      <td className="py-2 pr-4">{item.department?.name || '-'}</td>
                      <td className="py-2 pr-4">{item.totalCount}</td>
                      <td className="py-2 pr-4">{item.visitorCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length === 0 && (
                <p className="text-sm text-muted-foreground py-3">No attendance records found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
