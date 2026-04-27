'use client';

import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  DollarSign,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  UserCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Members',
      value: '1,248',
      change: '+12%',
      trend: 'up',
      icon: Users,
    },
    {
      name: 'This Week Attendance',
      value: '856',
      change: '+5%',
      trend: 'up',
      icon: UserCheck,
    },
    {
      name: 'Monthly Offerings',
      value: '₵45,200',
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      name: 'Upcoming Events',
      value: '6',
      change: '2 this week',
      trend: 'neutral',
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening at Kingdom Power Royal Assembly
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === 'up' && (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                )}
                {stat.trend === 'down' && (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    stat.trend === 'up'
                      ? 'text-green-500'
                      : stat.trend === 'down'
                      ? 'text-red-500'
                      : ''
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>
              Weekly attendance trends across all services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md">
              <p className="text-muted-foreground">Attendance Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New member registered</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Pledges</CardTitle>
            <CardDescription>Current pledge campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Building Fund</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[75%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Mission Support</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[45%]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sunday Service</p>
                  <p className="text-xs text-muted-foreground">Sun, 8:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Midweek Service</p>
                  <p className="text-xs text-muted-foreground">Wed, 6:30 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors">
                Record Attendance
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors">
                Add Offering
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors">
                Register Member
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors">
                Schedule Event
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

