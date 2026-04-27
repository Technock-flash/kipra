'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';

interface EventItem {
  id: string;
  title: string;
  type: string;
  status: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'SERVICE',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    isVirtual: false,
    virtualLink: '',
    departmentId: '',
  });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [eventsRes, departmentsRes] = await Promise.all([
          api.get('/calendar?limit=20&page=1'),
          api.get('/leadership/departments?limit=100&page=1'),
        ]);
        setEvents(eventsRes.data.data ?? []);
        setDepartments(departmentsRes.data.data ?? []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const reloadEvents = async () => {
    const response = await api.get('/calendar?limit=20&page=1');
    setEvents(response.data.data ?? []);
  };

  const submitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('calendar:create')) return;
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/calendar', {
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        startDate: new Date(`${form.startDate}T00:00:00.000Z`).toISOString(),
        endDate: form.endDate ? new Date(`${form.endDate}T00:00:00.000Z`).toISOString() : undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        location: form.location || undefined,
        isVirtual: form.isVirtual,
        virtualLink: form.isVirtual ? form.virtualLink || undefined : undefined,
        departmentId: form.departmentId || undefined,
      });
      setForm({
        title: '',
        description: '',
        type: 'SERVICE',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        startTime: '',
        endTime: '',
        location: '',
        isVirtual: false,
        virtualLink: '',
        departmentId: '',
      });
      await reloadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Upcoming services, meetings, and church events.</p>
      </div>

      {hasPermission('calendar:create') ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Event</CardTitle>
            <CardDescription>Add a new event to the church calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitEvent}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
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
                  <option value="SERVICE">Service</option>
                  <option value="MEETING">Meeting</option>
                  <option value="CONFERENCE">Conference</option>
                  <option value="TRAINING">Training</option>
                  <option value="SOCIAL">Social</option>
                  <option value="OUTREACH">Outreach</option>
                  <option value="OTHER">Other</option>
                </select>
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
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  id="isVirtual"
                  type="checkbox"
                  checked={form.isVirtual}
                  onChange={(e) => setForm((prev) => ({ ...prev, isVirtual: e.target.checked }))}
                />
                <Label htmlFor="isVirtual">Virtual event</Label>
              </div>
              {form.isVirtual && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="virtualLink">Virtual Link</Label>
                  <Input
                    id="virtualLink"
                    type="url"
                    placeholder="https://..."
                    value={form.virtualLink}
                    onChange={(e) => setForm((prev) => ({ ...prev, virtualLink: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>You have view-only access for calendar events.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events sorted by nearest start date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading events...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoading && !error && events.length === 0 && (
            <p className="text-sm text-muted-foreground">No events found.</p>
          )}
          {!isLoading &&
            !error &&
            events.map((event) => (
              <div key={event.id} className="border rounded-md p-3">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.startDate).toLocaleString()}
                  {event.endDate ? ` - ${new Date(event.endDate).toLocaleString()}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.type} | {event.status}
                  {event.location ? ` | ${event.location}` : ''}
                </p>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
