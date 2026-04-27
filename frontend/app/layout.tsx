import type { Metadata } from 'next';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import { QueryProvider } from '@/components/query-provider';
import { ToastProvider, ToastViewport } from '@/components/ui/toaster';

export const metadata: Metadata = {

  title: 'KiPRA - Church Management System',
  description: 'Kingdom Power Royal Assembly Management Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <QueryProvider>

          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <ToastProvider>
                {children}
                <ToastViewport />
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
