'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Department {
  id: string;
  name: string;
}

interface MinistryRequestItem {
  id: string;
  status: string;
  motivation?: string;
  createdAt: string;
  department: {
    name: string;
  };
}

export default function PortalMinistryPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [requests, setRequests] = useState<MinistryRequestItem[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    const [departmentsRes, requestsRes] = await Promise.all([
      api.get('/portal/departments'),
      api.get('/portal/ministry?page=1&limit=50'),
    ]);
    setDepartments(departmentsRes.data.data ?? []);
    setRequests(requestsRes.data.data ?? []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load ministry data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/portal/ministry', { departmentId, motivation });
      setDepartmentId('');
      setMotivation('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit ministry request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Join a Ministry</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation">Motivation</Label>
              <textarea
                id="motivation"
                className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Why do you want to join this ministry?"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                minLength={10}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Ministry Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Ministry Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading ministry requests...</p>}
          {!loading && (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="rounded-md border p-4">
                  <p className="font-semibold">{request.department.name}</p>
                  <p className="mt-1 text-sm">{request.motivation || '-'}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {request.status} | {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {requests.length === 0 && <p className="text-sm text-muted-foreground">No ministry requests yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
