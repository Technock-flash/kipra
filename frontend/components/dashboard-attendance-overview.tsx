'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { KIPRA_DASHBOARD_REFRESH } from '@/lib/dashboard-realtime';

type TrendRow = {
  date: string;
  _sum: {
    menCount: number | null;
    womenCount: number | null;
    childrenCount: number | null;
    youthCount: number | null;
    visitorCount: number | null;
    totalCount: number | null;
  };
};

type ChartPoint = {
  label: string;
  sub: string;
  men: number;
  women: number;
  youth: number;
  children: number;
  visitors: number;
  total: number;
};

const STACK_COLORS = {
  men: { stroke: 'hsl(221, 83%, 48%)', fill: 'hsl(221, 83%, 53%)' },
  women: { stroke: 'hsl(262, 83%, 58%)', fill: 'hsl(262, 83%, 62%)' },
  youth: { stroke: 'hsl(32, 95%, 44%)', fill: 'hsl(38, 92%, 50%)' },
  children: { stroke: 'hsl(142, 71%, 38%)', fill: 'hsl(142, 71%, 45%)' },
  visitors: { stroke: 'hsl(346, 77%, 50%)', fill: 'hsl(350, 75%, 55%)' },
};

function buildChartData(rows: TrendRow[]): ChartPoint[] {
  const byDay = new Map<string, TrendRow['_sum']>();
  for (const row of rows) {
    const key = format(startOfDay(new Date(row.date)), 'yyyy-MM-dd');
    const prev = byDay.get(key);
    const next = {
      menCount: (prev?.menCount ?? 0) + (row._sum.menCount ?? 0),
      womenCount: (prev?.womenCount ?? 0) + (row._sum.womenCount ?? 0),
      childrenCount: (prev?.childrenCount ?? 0) + (row._sum.childrenCount ?? 0),
      youthCount: (prev?.youthCount ?? 0) + (row._sum.youthCount ?? 0),
      visitorCount: (prev?.visitorCount ?? 0) + (row._sum.visitorCount ?? 0),
      totalCount: (prev?.totalCount ?? 0) + (row._sum.totalCount ?? 0),
    };
    byDay.set(key, next);
  }

  const today = startOfDay(new Date());
  const points: ChartPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, 'yyyy-MM-dd');
    const s = byDay.get(key);
    const men = s?.menCount ?? 0;
    const women = s?.womenCount ?? 0;
    const youth = s?.youthCount ?? 0;
    const children = s?.childrenCount ?? 0;
    const visitors = s?.visitorCount ?? 0;
    let total = s?.totalCount ?? 0;
    if (!total && (men || women || youth || children || visitors)) {
      total = men + women + youth + children + visitors;
    }
    points.push({
      label: format(d, 'EEE'),
      sub: format(d, 'MMM d'),
      men,
      women,
      youth,
      children,
      visitors,
      total,
    });
  }
  return points;
}

export function DashboardAttendanceOverview() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('dashboard:read');

  const [rows, setRows] = useState<TrendRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    if (!canRead) return;
    try {
      const res = await api.get('/dashboard/attendance-trends');
      setRows(res.data.data ?? []);
      setLoadError(null);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' &&
        e !== null &&
        'response' in e &&
        typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (e as { response: { data: { message: string } } }).response.data.message
          : 'Could not load attendance trends';
      setLoadError(msg);
      setRows([]);
    }
  }, [canRead]);

  useEffect(() => {
    void fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    if (!canRead) return;
    const onRefresh = () => void fetchTrends();
    window.addEventListener(KIPRA_DASHBOARD_REFRESH, onRefresh);
    return () => window.removeEventListener(KIPRA_DASHBOARD_REFRESH, onRefresh);
  }, [canRead, fetchTrends]);

  const data = useMemo(() => (rows ? buildChartData(rows) : []), [rows]);
  const weekTotal = useMemo(() => data.reduce((a, p) => a + p.total, 0), [data]);
  const peak = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((best, p) => (p.total > best.total ? p : best), data[0]);
  }, [data]);

  if (!canRead) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        You don&apos;t have access to attendance analytics.
      </p>
    );
  }

  if (rows === null) {
    return (
      <div className="space-y-3 pt-1">
        <div className="flex gap-4">
          <div className="h-10 flex-1 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-28 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="h-[280px] w-full rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="text-sm text-destructive py-8 text-center">{loadError}</p>
    );
  }

  const emptyWeek = weekTotal === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">7-day total</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {weekTotal.toLocaleString()}
            </p>
          </div>
          {peak && peak.total > 0 && (
            <div>
              <p className="text-muted-foreground">Busiest day</p>
              <p className="font-medium">
                {peak.sub}{' '}
                <span className="text-muted-foreground font-normal">
                  ({peak.total.toLocaleString()})
                </span>
              </p>
            </div>
          )}
        </div>
        <Link
          href="/dashboard/attendance"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Full attendance
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="h-[280px] w-full min-w-0 -ml-2 sm:ml-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="attFillMen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STACK_COLORS.men.fill} stopOpacity={0.95} />
                <stop offset="100%" stopColor={STACK_COLORS.men.fill} stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              width={36}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                fontSize: 12,
              }}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as ChartPoint | undefined;
                return p ? `${p.label} · ${p.sub}` : '';
              }}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) => <span className="text-muted-foreground">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="men"
              name="Men"
              stackId="a"
              stroke={STACK_COLORS.men.stroke}
              fill="url(#attFillMen)"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="women"
              name="Women"
              stackId="a"
              stroke={STACK_COLORS.women.stroke}
              fill={STACK_COLORS.women.fill}
              fillOpacity={0.85}
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="youth"
              name="Youth"
              stackId="a"
              stroke={STACK_COLORS.youth.stroke}
              fill={STACK_COLORS.youth.fill}
              fillOpacity={0.85}
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="children"
              name="Children"
              stackId="a"
              stroke={STACK_COLORS.children.stroke}
              fill={STACK_COLORS.children.fill}
              fillOpacity={0.85}
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              name="Visitors"
              stackId="a"
              stroke={STACK_COLORS.visitors.stroke}
              fill={STACK_COLORS.visitors.fill}
              fillOpacity={0.85}
              strokeWidth={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {emptyWeek && (
        <p className="text-xs text-muted-foreground text-center">
          No attendance entries in the last 7 days. Record a service on the{' '}
          <Link href="/dashboard/attendance" className="text-primary underline-offset-2 hover:underline">
            attendance page
          </Link>
          .
        </p>
      )}
    </div>
  );
}
