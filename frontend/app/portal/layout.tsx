'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/profile', label: 'Profile' },
  { href: '/portal/attendance', label: 'Attendance' },
  { href: '/portal/giving', label: 'Giving' },
  { href: '/portal/events', label: 'Events' },
  { href: '/portal/prayer', label: 'Prayer' },
  { href: '/portal/ministry', label: 'Ministry' },
  { href: '/portal/gallery', label: 'Gallery' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, user, hasPermission, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!isLoading && user && user.role !== 'MEMBER') {
      router.replace('/dashboard');
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (user.role !== 'MEMBER') return null;
  if (!hasPermission('portal:read')) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-red-500">You do not have permission to access the member portal.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Member Portal</h1>
            <p className="text-sm text-muted-foreground">Manage your profile, attendance, giving, and requests.</p>
          </div>
          <Button variant="outline" onClick={() => logout()}>
            Sign out
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-colors',
                pathname === link.href
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
