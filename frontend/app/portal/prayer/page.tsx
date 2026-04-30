'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface PrayerRequestItem {
  id: string;
  title: string;
  request: string;
  status: string;
  isPrivate: boolean;
  createdAt: string;
}

export default function PortalPrayerPage() {
  const [rows, setRows] = useState<PrayerRequestItem[]>([]);
  const [title, setTitle] = useState('');
  const [requestText, setRequestText] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isCounseling, setIsCounseling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPrayerRequests = async () => {
    const response = await api.get('/portal/prayer?page=1&limit=50');
    setRows(response.data.data ?? []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadPrayerRequests();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load prayer requests');
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
      await api.post('/portal/prayer', {
        title,
        request: requestText,
        isPrivate,
        isCounseling,
      });
      setTitle('');
      setRequestText('');
      setIsPrivate(true);
      setIsCounseling(false);
      await loadPrayerRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit prayer request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Prayer Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="prayerTitle">Title</Label>
              <Input id="prayerTitle" value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prayerRequest">Request</Label>
              <textarea
                id="prayerRequest"
                className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                minLength={10}
                required
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                Keep this request private
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isCounseling} onChange={(e) => setIsCounseling(e.target.checked)} />
                Request counseling
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Prayer Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Prayer Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading prayer requests...</p>}
          {!loading && (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="rounded-md border p-4">
                  <p className="font-semibold">{row.title}</p>
                  <p className="mt-1 text-sm">{row.request}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {row.status} | {row.isPrivate ? 'Private' : 'Public'} | {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {rows.length === 0 && <p className="text-sm text-muted-foreground">No prayer requests submitted yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
