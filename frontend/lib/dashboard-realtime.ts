'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getSocketBaseUrl } from '@/lib/socket-url';

/** Dispatched on window when dashboard data should refetch (Socket.IO or other triggers). */
export const KIPRA_DASHBOARD_REFRESH = 'kipra-dashboard-refresh';

/** Subscribes to server broadcasts so stats and charts stay fresh without polling. */
export function useDashboardRealtime(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const bump = () => {
      window.dispatchEvent(new CustomEvent(KIPRA_DASHBOARD_REFRESH));
    };

    socket.on('attendance_updated', bump);
    socket.on('financial_updated', bump);
    socket.on('event_updated', bump);
    socket.on('dashboard_update', bump);
    socket.on('connect_error', () => {});

    return () => {
      socket.disconnect();
    };
  }, [enabled]);
}
