'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { getSocketBaseUrl } from '@/lib/socket-url';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

export function DashboardNotificationsBell() {
  const { user, hasPermission } = useAuth();
  const pathname = usePathname();
  const [unread, setUnread] = useState<number | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!user || !hasPermission('notification:read')) return;
    try {
      const res = await api.get('/notifications/unread-count');
      const c = (res.data.data as { count?: number })?.count;
      setUnread(typeof c === 'number' ? c : 0);
    } catch {
      setUnread(0);
    }
  }, [user, hasPermission]);

  useEffect(() => {
    void fetchUnread();
  }, [fetchUnread, pathname]);

  useEffect(() => {
    const onUpdate = () => {
      void fetchUnread();
    };
    window.addEventListener('kipra-notifications-updated', onUpdate);
    return () => window.removeEventListener('kipra-notifications-updated', onUpdate);
  }, [fetchUnread]);

  useEffect(() => {
    if (!user || !hasPermission('notification:read')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const s: Socket = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    s.on('notification', () => {
      setUnread((n) => (n == null ? 1 : n + 1));
    });
    s.on('connect_error', () => {
      /* dev: backend may be down; keep quiet */
    });
    return () => {
      s.disconnect();
    };
  }, [user, hasPermission]);

  if (!user || !hasPermission('notification:read')) {
    return null;
  }

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/dashboard/notifications" title="Notifications" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread != null && unread > 0 && (
          <span
            className={cn(
              'absolute top-1 right-1 min-h-[0.5rem] min-w-[0.5rem] rounded-full bg-destructive',
              unread > 0 && 'h-2 w-2'
            )}
            aria-hidden
          />
        )}
        {unread != null && unread > 0 && (
          <span className="sr-only">{unread} unread</span>
        )}
      </Link>
    </Button>
  );
}
