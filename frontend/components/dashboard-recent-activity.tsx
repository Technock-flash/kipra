'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus,
  Coins,
  UserCheck,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { KIPRA_DASHBOARD_REFRESH } from '@/lib/dashboard-realtime';
import { cn } from '@/lib/utils';

type ActivityType = 'MEMBER' | 'OFFERING' | 'ATTENDANCE' | 'EVENT';

interface ActivityItem {
  type: ActivityType;
  description: string;
  date: string;
}

const TYPE_META: Record<ActivityType, { icon: LucideIcon; iconClass: string }> = {
  MEMBER: {
    icon: UserPlus,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  OFFERING: {
    icon: Coins,
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  ATTENDANCE: {
    icon: UserCheck,
    iconClass: 'text-primary',
  },
  EVENT: {
    icon: Calendar,
    iconClass: 'text-violet-600 dark:text-violet-400',
  },
};

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export function DashboardRecentActivity() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission('dashboard:read');

  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canRead) return;
    try {
      const res = await api.get<{ data: ActivityItem[] }>('/dashboard/recent-activity');
      const raw = res.data.data;
      setItems(Array.isArray(raw) ? raw : []);
      setError(null);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Could not load recent activity';
      setError(msg);
      setItems(null);
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
      <p className="text-sm text-muted-foreground py-6 text-center">
        You don&apos;t have access to this feed.
      </p>
    );
  }

  if (items === null && error) {
    return (
      <p className="text-sm text-destructive py-6 text-center">{error}</p>
    );
  }

  if (items === null) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-[85%] rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No recent activity yet. New members, offerings, attendance, and events will show up here.
      </p>
    );
  }

  return (
    <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1 -mr-1">
      {items.map((item, idx) => {
        const meta = TYPE_META[item.type] ?? TYPE_META.EVENT;
        const Icon = meta.icon;
        return (
          <div
            key={`${item.type}-${item.date}-${idx}`}
            className="flex items-start gap-3 rounded-md py-2.5 px-1 hover:bg-muted/60 transition-colors"
          >
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted',
                meta.iconClass
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{item.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {relativeTime(item.date) || '—'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
