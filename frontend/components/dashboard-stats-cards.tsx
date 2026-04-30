'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  DollarSign,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { KIPRA_DASHBOARD_REFRESH } from '@/lib/dashboard-realtime';

type Trend = 'up' | 'down' | 'neutral';

function pctLine(pct: number): { trend: Trend; text: string } {
  if (!Number.isFinite(pct) || Math.abs(pct) < 0.05) {
    return { trend: 'neutral', text: '0%' };
  }
  if (pct > 0) return { trend: 'up', text: `+${pct.toFixed(1)}%` };
  return { trend: 'down', text: `${pct.toFixed(1)}%` };
}

function formatGhs(n: number): string {
  return `₵${Math.round(n).toLocaleString('en-GH')}`;
}

interface DashboardStatsData {
  members: {
    total: number;
    newRegistrationsMomChangePercent: number;
  };
  attendance: {
    thisWeekToDateTotal: number;
    weekOverWeekChangePercent: number;
  };
  finance: {
    offerings: number;
    offeringsMomChangePercent: number;
  };
  events: {
    upcomingTotal: number;
    startingWithin7Days: number;
    createdMomChangePercent: number;
  };
}

type StatCard = {
  name: string;
  value: string;
  change: string;
  trend: Trend;
  footnote: string;
  icon: LucideIcon;
};

export function DashboardStatsCards() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('dashboard:read');

  const [stats, setStats] = useState<StatCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canRead) return;
    try {
      const res = await api.get<{ data: DashboardStatsData }>('/dashboard/stats');
      const raw = res.data.data as DashboardStatsData;
      if (!raw?.members || !raw.attendance || !raw.finance || !raw.events) {
        setError('Invalid stats response');
        setStats([]);
        return;
      }

      const d = {
        members: {
          total: Number(raw.members.total),
          newRegistrationsMomChangePercent: Number(raw.members.newRegistrationsMomChangePercent),
        },
        attendance: {
          thisWeekToDateTotal: Number(raw.attendance.thisWeekToDateTotal),
          weekOverWeekChangePercent: Number(raw.attendance.weekOverWeekChangePercent),
        },
        finance: {
          offerings: Number(raw.finance.offerings),
          offeringsMomChangePercent: Number(raw.finance.offeringsMomChangePercent),
        },
        events: {
          upcomingTotal: Number(raw.events.upcomingTotal),
          startingWithin7Days: Number(raw.events.startingWithin7Days),
          createdMomChangePercent: Number(raw.events.createdMomChangePercent),
        },
      };

      const m = pctLine(d.members.newRegistrationsMomChangePercent);
      const a = pctLine(d.attendance.weekOverWeekChangePercent);
      const o = pctLine(d.finance.offeringsMomChangePercent);
      const e = pctLine(d.events.createdMomChangePercent);

      setStats([
        {
          name: 'Total Members',
          value: d.members.total.toLocaleString('en-GH'),
          change: m.text,
          trend: m.trend,
          footnote: 'New registrations from last month',
          icon: Users,
        },
        {
          name: 'This Week Attendance',
          value: d.attendance.thisWeekToDateTotal.toLocaleString('en-GH'),
          change: a.text,
          trend: a.trend,
          footnote: 'Headcount vs same period last week (Mon–today)',
          icon: UserCheck,
        },
        {
          name: 'Monthly Offerings',
          value: formatGhs(d.finance.offerings),
          change: o.text,
          trend: o.trend,
          footnote: 'Recorded offerings from last month',
          icon: DollarSign,
        },
        {
          name: 'Upcoming Events',
          value: d.events.upcomingTotal.toLocaleString('en-GH'),
          change: e.text,
          trend: e.trend,
          footnote: `${d.events.startingWithin7Days} in next 7 days · new on calendar from last month`,
          icon: CalendarDays,
        },
      ]);
      setError(null);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Could not load dashboard stats';
      setError(msg);
      setStats([]);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <p className="text-sm text-muted-foreground col-span-full">
          You don&apos;t have access to dashboard statistics.
        </p>
      </div>
    );
  }

  if (error && (!stats || stats.length === 0)) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <p className="text-sm text-destructive col-span-full">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
              <div className="flex items-center">
                {stat.trend === 'up' && (
                  <TrendingUp className="mr-1 h-3 w-3 shrink-0 text-green-500" />
                )}
                {stat.trend === 'down' && (
                  <TrendingDown className="mr-1 h-3 w-3 shrink-0 text-red-500" />
                )}
                {stat.trend === 'neutral' && <span className="mr-1 w-3 shrink-0" />}
                <span
                  className={
                    stat.trend === 'up'
                      ? 'text-green-500 font-medium'
                      : stat.trend === 'down'
                        ? 'text-red-500 font-medium'
                        : ''
                  }
                >
                  {stat.change}
                </span>
              </div>
              <span className="leading-snug">{stat.footnote}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
