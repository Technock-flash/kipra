'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Department {
  id: string;
  name: string;
  color?: string | null;
  _count?: { members: number; leaders: number };
}

interface Leader {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department?: { name: string } | null;
}

export default function LeadershipPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeadershipData = async () => {
      try {
        const [departmentsRes, leadersRes] = await Promise.all([
          api.get('/leadership/departments?limit=50&page=1'),
          api.get('/leadership/leaders?limit=20&page=1'),
        ]);
        setDepartments(departmentsRes.data.data ?? []);
        setLeaders(leadersRes.data.data ?? []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load leadership data');
      } finally {
        setIsLoading(false);
      }
    };

    loadLeadershipData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leadership</h1>
        <p className="text-muted-foreground">Overview of departments and appointed leaders.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading leadership data...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Active church departments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {departments.map((department) => (
                <div key={department.id} className="border rounded-md p-3">
                  <p className="font-medium">{department.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Members: {department._count?.members ?? 0} | Leaders: {department._count?.leaders ?? 0}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaders</CardTitle>
              <CardDescription>Current leadership assignments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaders.map((leader) => (
                <div key={leader.id} className="border rounded-md p-3">
                  <p className="font-medium">{leader.firstName} {leader.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {leader.position} {leader.department?.name ? `| ${leader.department.name}` : ''}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
