'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryState {
  profileName: string;
  attendanceCount: number;
  givingCount: number;
  upcomingEvents: number;
  prayerCount: number;
  ministryCount: number;
}

export default function PortalOverviewPage() {
  const [summary, setSummary] = useState<SummaryState>({
    profileName: '',
    attendanceCount: 0,
    givingCount: 0,
    upcomingEvents: 0,
    prayerCount: 0,
    ministryCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [profileRes, attendanceRes, givingRes, eventsRes, prayerRes, ministryRes] = await Promise.all([
          api.get('/portal/profile'),
          api.get('/portal/attendance?page=1&limit=1'),
          api.get('/portal/giving?page=1&limit=1'),
          api.get('/portal/events?page=1&limit=1'),
          api.get('/portal/prayer?page=1&limit=1'),
          api.get('/portal/ministry?page=1&limit=1'),
        ]);

        const profile = profileRes.data.data;
        setSummary({
          profileName: `${profile.firstName} ${profile.lastName}`,
          attendanceCount: attendanceRes.data.meta?.total ?? 0,
          givingCount: givingRes.data.meta?.total ?? 0,
          upcomingEvents: eventsRes.data.meta?.total ?? 0,
          prayerCount: prayerRes.data.meta?.total ?? 0,
          ministryCount: ministryRes.data.meta?.total ?? 0,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load portal overview');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading portal summary...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {summary.profileName}</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Records</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.attendanceCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giving Entries</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.givingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.upcomingEvents}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prayer Requests</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.prayerCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ministry Requests</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.ministryCount}</CardContent>
        </Card>
      </div>
    </div>
  );
}
