'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GivingItem {
  id: string;
  date: string;
  amount: string | number;
  category: string;
  notes?: string;
}

const toMoney = (value: string | number): string => {
  const numberValue = Number(value);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(
    Number.isFinite(numberValue) ? numberValue : 0
  );
};

export default function PortalGivingPage() {
  const [rows, setRows] = useState<GivingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/portal/giving?page=1&limit=100&type=all');
        setRows(response.data.data ?? []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load giving history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const downloadStatement = async () => {
    try {
      const response = await api.get('/portal/giving/statement');
      const content = JSON.stringify(response.data.data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `giving-statement-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download statement');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Giving History</CardTitle>
        <Button onClick={downloadStatement} variant="outline">
          Download Statement
        </Button>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading giving history...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Notes</th>
                  <th className="py-2 pr-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{row.category}</td>
                    <td className="py-2 pr-4">{row.notes || '-'}</td>
                    <td className="py-2 pr-4">{toMoney(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-4 text-sm text-muted-foreground">No giving records found.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
