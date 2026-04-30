'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { addDays, endOfDay, format, startOfDay } from 'date-fns';
import { mergeLocalDateFromIsoWithTime } from '@/lib/eventDateTime';
import { CalendarDays, MapPin, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { KIPRA_DASHBOARD_REFRESH } from '@/lib/dashboard-realtime';
import { cn } from '@/lib/utils';

interface CalendarEventRow {
  id: string;
  title: string;
  type: string;
  location?: string | null;
  startDate: string;
  startTime?: string | null;
  isVirtual?: boolean;
  department?: { name: string; color?: string | null } | null;
}

function formatEventSubtitle(e: CalendarEventRow): string {
  const when = mergeLocalDateFromIsoWithTime(e.startDate, e.startTime ?? null);
  return format(when, 'EEE, MMM d · h:mm a');
}

const TYPE_ACCENT: Record<string, string> = {
  SERVICE: 'bg-primary/15 text-primary',
  MEETING: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  CONFERENCE: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  TRAINING: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  SOCIAL: 'bg-pink-500/15 text-pink-800 dark:text-pink-200',
  OUTREACH: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  OTHER: 'bg-muted text-muted-foreground',
};

export function DashboardUpcomingEvents() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('calendar:read');

  const [events, setEvents] = useState<CalendarEventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canRead) return;
    const from = startOfDay(new Date());
    const to = endOfDay(addDays(from, 6));
    try {
      const res = await api.get<{
        data: CalendarEventRow[];
        meta?: { total?: number };
      }>('/calendar', {
        params: {
          page: 1,
          limit: 12,
          startDate: from.toISOString(),
          endDate: to.toISOString(),
        },
      });
      setEvents(Array.isArray(res.data.data) ? res.data.data : []);
      setError(null);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Could not load events';
      setError(msg);
      setEvents(null);
    }
  }, [canRead]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!canRead) return;
    const onRefresh = () => void load();
    window.addEventListener(KIPRA_DASHBOARD_REFRESH, onRefresh);
    return () => window.removeEventListener(KIPRA_DASHBOARD_REFRESH, onRefresh);
  }, [canRead, load]);

  useEffect(() => {
    if (!canRead) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [canRead, load]);

  if (!canRead) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        You don&apos;t have access to the calendar.
      </p>
    );
  }

  if (events === null && error) {
    return <p className="text-sm text-destructive py-4 text-center">{error}</p>;
  }

  if (events === null) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-md bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-[85%] max-w-[200px] rounded bg-muted animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center py-2">
          No events scheduled in the next 7 days.
        </p>
        <Link
          href="/dashboard/calendar"
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open calendar
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="max-h-[220px] overflow-y-auto pr-1 -mr-1 space-y-1">
        {events.map((e) => {
          const accent = TYPE_ACCENT[e.type] ?? TYPE_ACCENT.OTHER;
          return (
            <div
              key={e.id}
              className="flex items-start gap-3 rounded-md py-2 px-1 hover:bg-muted/60 transition-colors"
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
                  accent
                )}
              >
                <CalendarDays className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatEventSubtitle(e)}
                </p>
                {(e.location || e.isVirtual) && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 opacity-70" />
                    <span className="truncate">
                      {e.isVirtual ? 'Virtual' : e.location || '—'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Link
        href="/dashboard/calendar"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline pt-2"
      >
        Full calendar
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
