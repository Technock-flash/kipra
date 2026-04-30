'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendanceRecord {
  id: string;
  attendance: {
    date: string;
    type: string;
    serviceName?: string | null;
  };
}

export default function PortalAttendancePage() {
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/portal/attendance?page=1&limit=50');
        setRows(response.data.data ?? []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading attendance...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Service Name</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{new Date(row.attendance.date).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{row.attendance.type.replaceAll('_', ' ')}</td>
                    <td className="py-2 pr-4">{row.attendance.serviceName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-4 text-sm text-muted-foreground">No attendance records found.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
