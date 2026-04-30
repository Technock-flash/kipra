'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import {
  downloadCalendarExcel,
  downloadCalendarIcs,
  generateCalendarReport,
  type CalendarExportEventRow,
} from '@/lib/generateCalendarReport';
import { format } from 'date-fns';
import {
  combineFormDateAndTimeToIso,
  formatEventDateTimeLabel,
  isWallTimeString,
  mergeLocalDateFromIsoWithTime,
} from '@/lib/eventDateTime';

const FullCalendar = dynamic(() => import('@fullcalendar/react').then((m) => m.default), {
  ssr: false,
  loading: () => <p className="p-8 text-sm text-muted-foreground">Loading calendar…</p>,
});

interface EventItem {
  id: string;
  title: string;
  type: string;
  status: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  allDay?: boolean | null;
  department?: { name?: string; color?: string } | null;
  color?: string | null;
}

interface DepartmentOption {
  id: string;
  name: string;
  color?: string;
}

function mapApiEventsToFc(events: unknown[]): EventInput[] {
  if (!Array.isArray(events)) return [];
  return events.map((raw) => {
    const e = raw as Record<string, unknown>;
    const startDate = String(e.startDate ?? '');
    const startTime = (e.startTime as string) || null;
    const endDate = (e.endDate as string) || null;
    const endTime = (e.endTime as string) || null;
    const allDay = Boolean(e.allDay);
    const dept = e.department as { color?: string; name?: string } | undefined;
    const color = (e.color as string) || dept?.color || '#3b82f6';

    if (allDay) {
      const startLocal = mergeLocalDateFromIsoWithTime(startDate, null);
      const endLocal = endDate ? mergeLocalDateFromIsoWithTime(endDate, null) : undefined;
      return {
        id: String(e.id),
        title: String(e.title ?? ''),
        start: format(startLocal, 'yyyy-MM-dd'),
        end: endLocal ? format(endLocal, 'yyyy-MM-dd') : undefined,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { raw: e },
      };
    }

    const startDt = mergeLocalDateFromIsoWithTime(startDate, startTime);
    let endDt: Date | undefined;
    if (endDate) {
      endDt = mergeLocalDateFromIsoWithTime(endDate, endTime || null);
    } else if (isWallTimeString(endTime)) {
      endDt = mergeLocalDateFromIsoWithTime(startDate, endTime);
    }

    return {
      id: String(e.id),
      title: String(e.title ?? ''),
      start: startDt.toISOString(),
      end: endDt ? endDt.toISOString() : undefined,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { raw: e },
    };
  });
}

export default function CalendarPage() {
  const { hasPermission } = useAuth();
  const [listEvents, setListEvents] = useState<EventItem[]>([]);
  const [fcEvents, setFcEvents] = useState<EventInput[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [viewDepartmentId, setViewDepartmentId] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [viewRange, setViewRange] = useState<{ start: Date; end: Date } | null>(null);
  const viewRangeRef = useRef<{ start: Date; end: Date } | null>(null);

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

  const canCreate = hasPermission('calendar:create');
  const canExport = hasPermission('calendar:export');

  const loadList = useCallback(async () => {
    try {
      const res = await api.get('/calendar', { params: { limit: 50, page: 1 } });
      setListEvents(res.data.data ?? []);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setError(msg || 'Failed to load events');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadCalendarView = useCallback(async (start: Date, end: Date) => {
    setIsLoadingView(true);
    setError('');
    viewRangeRef.current = { start, end };
    setViewRange({ start, end });
    try {
      const res = await api.get('/calendar/view', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          view: 'month',
          ...(viewDepartmentId ? { departmentId: viewDepartmentId } : {}),
        },
      });
      const payload = res.data.data;
      const events = (payload?.events ?? []) as unknown[];
      setFcEvents(mapApiEventsToFc(events));
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setError(msg || 'Failed to load calendar view');
    } finally {
      setIsLoadingView(false);
    }
  }, [viewDepartmentId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    const r = viewRangeRef.current;
    if (r) void loadCalendarView(r.start, r.end);
  }, [viewDepartmentId, loadCalendarView]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await api.get('/calendar/filters/departments');
        setDepartments(res.data.data ?? []);
      } catch {
        const fallback = await api.get('/leadership/departments?limit=100&page=1');
        setDepartments(fallback.data.data ?? []);
      }
    };
    loadFilters();
  }, []);

  const onDatesSet = useCallback(
    (arg: DatesSetArg) => {
      void loadCalendarView(arg.start, arg.end);
    },
    [loadCalendarView]
  );

  const submitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setIsSubmitting(true);
    setError('');
    const startDate = combineFormDateAndTimeToIso(form.startDate, form.startTime || null);
    const endDateIso =
      form.endDate || form.endTime
        ? combineFormDateAndTimeToIso(form.endDate || form.startDate, form.endTime || null)
        : undefined;

    const payload = {
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      startDate,
      endDate: endDateIso,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      location: form.location || undefined,
      isVirtual: form.isVirtual,
      virtualLink: form.isVirtual ? form.virtualLink || undefined : undefined,
      departmentId: form.departmentId || undefined,
    };
    try {
      await api.post('/calendar', payload);
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
      await loadList();
      const r = viewRangeRef.current;
      if (r) void loadCalendarView(r.start, r.end);
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response?.status : undefined;
      if (status === 409 && typeof window !== 'undefined' && window.confirm('Scheduling conflict. Create this event anyway?')) {
        try {
          await api.post('/calendar?force=true', payload);
          await loadList();
          const r2 = viewRangeRef.current;
          if (r2) void loadCalendarView(r2.start, r2.end);
          return;
        } catch (e2: unknown) {
          const msg2 = e2 && typeof e2 === 'object' && 'response' in e2 ? (e2 as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
          setError(msg2 || 'Failed to create event');
          return;
        }
      }
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setError(msg || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchExportEvents = async (): Promise<CalendarExportEventRow[]> => {
    if (!viewRange) throw new Error('Calendar range not ready');
    const res = await api.post('/calendar/export', {
      format: 'PDF',
      startDate: viewRange.start.toISOString(),
      endDate: viewRange.end.toISOString(),
      ...(viewDepartmentId ? { departmentId: viewDepartmentId } : {}),
      includeDescription: true,
      includeVenue: true,
      colorCoded: true,
      pageSize: 'A4',
      orientation: 'landscape',
    });
    return (res.data.data?.events ?? []) as CalendarExportEventRow[];
  };

  const handleExportPdf = async () => {
    if (!canExport || !viewRange) return;
    setExportBusy(true);
    setError('');
    try {
      const events = await fetchExportEvents();
      await generateCalendarReport(events, {
        title: 'Church calendar',
        subtitle: `${format(viewRange.start, 'MMM d, yyyy')} – ${format(viewRange.end, 'MMM d, yyyy')}`,
      });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setError(msg || 'Export failed');
    } finally {
      setExportBusy(false);
    }
  };

  const handleExportExcel = async () => {
    if (!canExport || !viewRange) return;
    setExportBusy(true);
    setError('');
    try {
      const events = await fetchExportEvents();
      downloadCalendarExcel(events);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setError(msg || 'Export failed');
    } finally {
      setExportBusy(false);
    }
  };

  const handleExportIcs = async () => {
    if (!canExport || !viewRange) return;
    setExportBusy(true);
    setError('');
    try {
      const events = await fetchExportEvents();
      downloadCalendarIcs(events);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      setError(msg || 'Export failed');
    } finally {
      setExportBusy(false);
    }
  };

  const onEventClick = useCallback((info: EventClickArg) => {
    const raw = info.event.extendedProps?.raw as Record<string, unknown> | undefined;
    const when =
      raw?.startDate != null
        ? formatEventDateTimeLabel(
            String(raw.startDate),
            (raw.startTime as string) || null,
            Boolean(raw.allDay)
          )
        : '';
    const lines = [
      info.event.title,
      when ? `When: ${when}` : '',
      raw?.type ? `Type: ${String(raw.type)}` : '',
      raw?.location ? `Location: ${String(raw.location)}` : '',
      raw?.description ? String(raw.description).slice(0, 400) : '',
    ].filter(Boolean);
    window.alert(lines.join('\n\n'));
  }, []);

  const calendarPlugins = useMemo(
    () => [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Monthly and weekly views, exports, and event management.</p>
        </div>
        {canExport && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={exportBusy || !viewRange} onClick={() => void handleExportPdf()}>
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={exportBusy || !viewRange} onClick={() => void handleExportExcel()}>
              Excel
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={exportBusy || !viewRange} onClick={() => void handleExportIcs()}>
              ICS
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Schedule</CardTitle>
          <CardDescription>Navigate months; events load from the server for the visible range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="cal-filter-dept">Filter by department</Label>
              <select
                id="cal-filter-dept"
                className="h-10 min-w-[200px] rounded-md border bg-background px-3 text-sm"
                value={viewDepartmentId}
                onChange={(ev) => setViewDepartmentId(ev.target.value)}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            {isLoadingView && <span className="text-xs text-muted-foreground">Refreshing…</span>}
          </div>
          <div className="fc-theme-standard min-h-[520px] rounded-md border bg-card p-2">
            <FullCalendar
              plugins={calendarPlugins}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek',
              }}
              height="auto"
              events={fcEvents}
              datesSet={onDatesSet}
              eventClick={onEventClick}
            />
          </div>
        </CardContent>
      </Card>

      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Create event</CardTitle>
            <CardDescription>Add a single occurrence to the calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitEvent}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(ev) => setForm((p) => ({ ...p, title: ev.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.type}
                  onChange={(ev) => setForm((p) => ({ ...p, type: ev.target.value }))}
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
                  onChange={(ev) => setForm((p) => ({ ...p, departmentId: ev.target.value }))}
                >
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(ev) => setForm((p) => ({ ...p, startDate: ev.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(ev) => setForm((p) => ({ ...p, endDate: ev.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(ev) => setForm((p) => ({ ...p, startTime: ev.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(ev) => setForm((p) => ({ ...p, endTime: ev.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(ev) => setForm((p) => ({ ...p, location: ev.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  id="isVirtual"
                  type="checkbox"
                  checked={form.isVirtual}
                  onChange={(ev) => setForm((p) => ({ ...p, isVirtual: ev.target.checked }))}
                />
                <Label htmlFor="isVirtual">Virtual event</Label>
              </div>
              {form.isVirtual && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="virtualLink">Virtual link</Label>
                  <Input
                    id="virtualLink"
                    type="url"
                    placeholder="https://..."
                    value={form.virtualLink}
                    onChange={(ev) => setForm((p) => ({ ...p, virtualLink: ev.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(ev) => setForm((p) => ({ ...p, description: ev.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Create event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>You can view the schedule; create and export require additional permissions.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upcoming events</CardTitle>
          <CardDescription>Next items from the list API (not expanded recurrence).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingList && <p className="text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoadingList && !error && listEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">No events found.</p>
          )}
          {!isLoadingList &&
            !error &&
            listEvents.map((event) => (
              <div key={event.id} className="rounded-md border p-3">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatEventDateTimeLabel(event.startDate, event.startTime, event.allDay)}
                  {event.endDate ? ` – ${new Date(event.endDate).toLocaleString()}` : ''}
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
