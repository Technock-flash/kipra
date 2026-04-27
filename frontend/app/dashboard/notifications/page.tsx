'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { formatDistanceToNow } from 'date-fns';

type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

const typeLabels: Record<NotificationType, string> = {
  INFO: 'Info',
  SUCCESS: 'Success',
  WARNING: 'Warning',
  ERROR: 'Important',
};

function formatType(t: string): string {
  if (t in typeLabels) return typeLabels[t as NotificationType];
  return t;
}

export default function NotificationsPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [meta, setMeta] = useState<{ unreadCount: number; total: number } | null>(null);
  const [page] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<NotificationType>('INFO');
  const [isSending, setIsSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/notifications', { params: { page, limit: 30 } });
      setItems((res.data.data as InAppNotification[]) ?? []);
      const m = res.data.meta;
      if (m) {
        setMeta({ unreadCount: m.unreadCount ?? 0, total: m.total ?? 0 });
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/notifications/${id}/read`);
      window.dispatchEvent(new Event('kipra-notifications-updated'));
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to update notification');
    } finally {
      setActionLoading(false);
    }
  };

  const markAllRead = async () => {
    setActionLoading(true);
    try {
      await api.post('/notifications/read-all');
      window.dispatchEvent(new Event('kipra-notifications-updated'));
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to mark all read');
    } finally {
      setActionLoading(false);
    }
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('notification:broadcast')) return;
    setIsSending(true);
    setError('');
    try {
      await api.post('/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
      });
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastType('INFO');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          In-app messages for your account. Church-wide announcements are sent to every active user.
        </p>
        {meta != null && (
          <p className="text-sm text-muted-foreground mt-1">
            {meta.unreadCount} unread of {meta.total} total
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {hasPermission('notification:broadcast') && (
        <Card>
          <CardHeader>
            <CardTitle>Send to everyone</CardTitle>
            <CardDescription>
              Deliver a notification to all active user accounts. Use for announcements, reminders, and updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendBroadcast} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="b-title">Title</Label>
                <Input
                  id="b-title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-message">Message</Label>
                <textarea
                  id="b-message"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  maxLength={10000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-type">Type</Label>
                <select
                  id="b-type"
                  className="h-10 w-full max-w-xs rounded-md border bg-background px-3 text-sm"
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as NotificationType)}
                >
                  <option value="INFO">Info</option>
                  <option value="SUCCESS">Success</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Important / alert</option>
                </select>
              </div>
              <Button type="submit" disabled={isSending}>
                {isSending ? 'Sending…' : 'Send to all users'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Your notifications</CardTitle>
            <CardDescription>Click a notification to mark it as read.</CardDescription>
          </div>
          {(meta?.unreadCount ?? 0) > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={markAllRead} disabled={actionLoading}>
              Mark all read
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">You have no notifications yet.</p>
          )}
          <ul className="space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                className={`rounded-md border p-3 text-left transition-colors ${
                  n.isRead ? 'bg-background' : 'bg-muted/50 border-primary/30'
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    if (!n.isRead) void markRead(n.id);
                  }}
                  disabled={actionLoading}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatType(n.type)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    {n.isRead && ' · Read'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
