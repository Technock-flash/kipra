'use client';

import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardAttendanceOverview } from '@/components/dashboard-attendance-overview';
import { DashboardRecentActivity } from '@/components/dashboard-recent-activity';
import { DashboardStatsCards } from '@/components/dashboard-stats-cards';
import { DashboardUpcomingEvents } from '@/components/dashboard-upcoming-events';
import { useDashboardRealtime } from '@/lib/dashboard-realtime';

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  useDashboardRealtime(hasPermission('dashboard:read'));

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

      <DashboardStatsCards />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>
              Last 7 days — total headcount by day, stacked by demographic (all services)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <DashboardAttendanceOverview />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <DashboardRecentActivity />
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
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <DashboardUpcomingEvents />
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

