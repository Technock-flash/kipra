import { Server, Socket } from 'socket.io';
import { NotificationType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prisma } from '@config/database';

interface JWTPayload {
  userId: string;
  role: string;
}

export const initializeSocketHandlers = (io: Server): void => {
  // Authentication middleware for sockets
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret'
      ) as JWTPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.deletedAt || user.status !== 'ACTIVE') {
        return next(new Error('User not found or inactive'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user?.email} (${socket.id})`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${user?.id}`);
    
    // Join role-based room for broadcasts
    socket.join(`role:${user?.role}`);
    
    // Join global updates
    socket.join('global_updates');

    // Handle attendance updates
    socket.on('attendance_update', (data) => {
      socket.to('global_updates').emit('attendance_updated', data);
    });

    // Handle financial updates — global room so dashboard stats refetch for all staff (API still enforces RBAC)
    socket.on('financial_update', (data) => {
      socket.to('global_updates').emit('financial_updated', data);
    });

    // Handle new events
    socket.on('event_created', (data) => {
      socket.to('global_updates').emit('event_updated', data);
    });

    // Activity feed subscription
    socket.on('subscribe_activity', () => {
      socket.join('activity_feed');
    });

    // Dashboard data request
    socket.on('request_dashboard_data', async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [totalMembers, todayAttendance, monthlyOfferings, upcomingEvents] = await Promise.all([
          prisma.member.count({ where: { deletedAt: null } }),
          prisma.attendance.findFirst({
            where: { date: { gte: today } },
            orderBy: { date: 'desc' },
          }),
          prisma.offering.aggregate({
            where: {
              date: {
                gte: new Date(today.getFullYear(), today.getMonth(), 1),
              },
              deletedAt: null,
            },
            _sum: { amount: true },
          }),
          prisma.event.findMany({
            where: {
              startDate: { gte: today },
              deletedAt: null,
            },
            orderBy: { startDate: 'asc' },
            take: 5,
          }),
        ]);

        socket.emit('dashboard_data', {
          totalMembers,
          todayAttendance: todayAttendance?.totalCount || 0,
          monthlyOfferings: monthlyOfferings._sum.amount || 0,
          upcomingEvents,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Dashboard data error:', error);
        socket.emit('error', { message: 'Failed to fetch dashboard data' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user?.email} (${socket.id})`);
    });
  });
};

// Helper to emit notifications from HTTP controllers
export const emitNotification = (io: Server, userId: string, notification: any): void => {
  io.to(`user:${userId}`).emit('notification', notification);
};

export const emitNotificationToUserRooms = (
  io: Server,
  userIds: string[],
  payload: { title: string; message: string; type: NotificationType }
): void => {
  const body = { ...payload, scope: 'broadcast' as const };
  for (const userId of userIds) {
    io.to(`user:${userId}`).emit('notification', body);
  }
};

export const emitActivity = (io: Server, activity: any): void => {
  io.to('activity_feed').emit('activity', activity);
};

export const emitDashboardUpdate = (io: Server, update: any): void => {
  io.to('global_updates').emit('dashboard_update', update);
};

