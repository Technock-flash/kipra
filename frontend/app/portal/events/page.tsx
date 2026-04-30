'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatEventDateTimeLabel } from '@/lib/eventDateTime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EventItem {
  id: string;
  title: string;
  type: string;
  startDate: string;
  startTime?: string | null;
  allDay?: boolean | null;
  location?: string | null;
  registration?: {
    status: string;
  } | null;
}

export default function PortalEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadEvents = async () => {
    const response = await api.get('/portal/events?page=1&limit=50');
    setEvents(response.data.data ?? []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadEvents();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const register = async (eventId: string) => {
    setBusyId(eventId);
    setError('');
    try {
      await api.post('/portal/events/register', { eventId });
      await loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register for event');
    } finally {
      setBusyId(null);
    }
  };

  const cancelRegistration = async (eventId: string) => {
    setBusyId(eventId);
    setError('');
    try {
      await api.delete(`/portal/events/${eventId}/register`);
      await loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel registration');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading events...</p>}
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        {!loading && (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-md border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatEventDateTimeLabel(event.startDate, event.startTime, event.allDay)} |{' '}
                      {event.type.replaceAll('_', ' ')} |{' '}
                      {event.location || 'TBA'}
                    </p>
                  </div>
                  {event.registration?.status === 'CONFIRMED' ? (
                    <Button variant="outline" disabled={busyId === event.id} onClick={() => cancelRegistration(event.id)}>
                      {busyId === event.id ? 'Please wait...' : 'Cancel Registration'}
                    </Button>
                  ) : (
                    <Button disabled={busyId === event.id} onClick={() => register(event.id)}>
                      {busyId === event.id ? 'Please wait...' : 'Register'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events found.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
