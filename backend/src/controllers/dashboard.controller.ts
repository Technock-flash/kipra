import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse } from '@utils/response';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalMembers,
      newMembersThisMonth,
      totalDepartments,
      totalLeaders,
      todayAttendance,
      monthlyOfferings,
      monthlyTithes,
      monthlyExpenses,
      activePledges,
      upcomingEvents,
    ] = await Promise.all([
      prisma.member.count({ where: { deletedAt: null } }),
      prisma.member.count({ where: { createdAt: { gte: thisMonthStart }, deletedAt: null } }),
      prisma.department.count({ where: { deletedAt: null } }),
      prisma.leader.count({ where: { deletedAt: null, isActive: true } }),
      prisma.attendance.findFirst({
        where: { date: { gte: today }, deletedAt: null },
        orderBy: { date: 'desc' },
      }),
      prisma.offering.aggregate({ where: { date: { gte: thisMonthStart }, deletedAt: null }, _sum: { amount: true } }),
      prisma.tithe.aggregate({ where: { date: { gte: thisMonthStart }, deletedAt: null }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { date: { gte: thisMonthStart }, deletedAt: null }, _sum: { amount: true } }),
      prisma.pledge.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.event.findMany({
        where: { startDate: { gte: today }, deletedAt: null },
        orderBy: { startDate: 'asc' },
        take: 5,
        select: { id: true, title: true, startDate: true, type: true, location: true },
      }),
    ]);

    const lastMonthOfferings = await prisma.offering.aggregate({
      where: { date: { gte: lastMonthStart, lt: thisMonthStart }, deletedAt: null },
      _sum: { amount: true },
    });

    const totalIncome = (monthlyOfferings._sum.amount || 0) + (monthlyTithes._sum.amount || 0);
    const lastMonthIncome = (lastMonthOfferings._sum.amount || 0);
    const incomeChange = lastMonthIncome > 0 ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;

    successResponse(res, {
      members: {
        total: totalMembers,
        newThisMonth: newMembersThisMonth,
      },
      departments: totalDepartments,
      leaders: totalLeaders,
      attendance: {
        today: todayAttendance?.totalCount || 0,
        lastService: todayAttendance?.serviceName || 'No service recorded',
      },
      finance: {
        monthlyIncome: totalIncome,
        monthlyExpenses: monthlyExpenses._sum.amount || 0,
        netIncome: totalIncome - (monthlyExpenses._sum.amount || 0),
        incomeChange: parseFloat(incomeChange.toFixed(2)),
        offerings: monthlyOfferings._sum.amount || 0,
        tithes: monthlyTithes._sum.amount || 0,
      },
      pledges: { active: activePledges },
      upcomingEvents,
    }, 'Dashboard stats retrieved');
  } catch (error) { next(error); }
};

export const getAttendanceTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const attendanceData = await prisma.attendance.groupBy({
      by: ['date'],
      where: { date: { gte: sixMonthsAgo }, deletedAt: null },
      _sum: {
        menCount: true,
        womenCount: true,
        childrenCount: true,
        youthCount: true,
        visitorCount: true,
        totalCount: true,
      },
    });

    successResponse(res, attendanceData, 'Attendance trends retrieved');
  } catch (error) { next(error); }
};

export const getGivingSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [offeringsByMonth, tithesByMonth, topGivers] = await Promise.all([
      prisma.offering.groupBy({
        by: ['date'],
        where: { date: { gte: twelveMonthsAgo }, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.tithe.groupBy({
        by: ['date'],
        where: { date: { gte: twelveMonthsAgo }, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.tithe.groupBy({
        by: ['memberId'],
        where: { date: { gte: twelveMonthsAgo }, deletedAt: null },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),
    ]);

    // Get member details for top givers
    const memberIds = topGivers.map(g => g.memberId);
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const topGiversWithNames = topGivers.map(g => ({
      ...g,
      member: members.find(m => m.id === g.memberId),
    }));

    successResponse(res, {
      offeringsByMonth,
      tithesByMonth,
      topGivers: topGiversWithNames,
    }, 'Giving summary retrieved');
  } catch (error) { next(error); }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [recentMembers, recentOfferings, recentAttendance, recentEvents] = await Promise.all([
      prisma.member.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
      prisma.offering.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, amount: true, date: true, createdAt: true },
      }),
      prisma.attendance.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, totalCount: true, date: true, createdAt: true },
      }),
      prisma.event.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, startDate: true, createdAt: true },
      }),
    ]);

    const activities = [
      ...recentMembers.map(m => ({ type: 'MEMBER', description: `${m.firstName} ${m.lastName} added`, date: m.createdAt })),
      ...recentOfferings.map(o => ({ type: 'OFFERING', description: `Offering of GHS ${o.amount} recorded`, date: o.createdAt })),
      ...recentAttendance.map(a => ({ type: 'ATTENDANCE', description: `Attendance of ${a.totalCount} recorded`, date: a.createdAt })),
      ...recentEvents.map(e => ({ type: 'EVENT', description: `Event "${e.title}" created`, date: e.createdAt })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    successResponse(res, activities, 'Recent activity retrieved');
  } catch (error) { next(error); }
};

