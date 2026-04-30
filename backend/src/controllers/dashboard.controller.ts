import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse } from '@utils/response';

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  return Number(v);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Monday 00:00:00 (local) as week start */
function startOfWeekMonday(d: Date): Date {
  const t = startOfDay(d);
  const dow = t.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  t.setDate(t.getDate() + offset);
  return t;
}

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const todayStart = startOfDay(new Date());
    const thisMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const lastMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth() - 1, 1);

    const weekStart = startOfWeekMonday(todayStart);
    const daysSinceMonday = Math.round((todayStart.getTime() - weekStart.getTime()) / 86400000);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekPeriodEnd = endOfDay(new Date(lastWeekStart));
    lastWeekPeriodEnd.setDate(lastWeekPeriodEnd.getDate() + daysSinceMonday);

    const endOfToday = endOfDay(new Date());
    const next7Exclusive = new Date(todayStart);
    next7Exclusive.setDate(next7Exclusive.getDate() + 7);

    const [
      totalMembers,
      newMembersThisMonth,
      newMembersLastMonth,
      totalDepartments,
      totalLeaders,
      todayAttendance,
      monthlyOfferings,
      monthlyTithes,
      monthlyExpenses,
      activePledges,
      upcomingEvents,
      lastMonthOfferings,
      thisWeekAttendanceAgg,
      lastWeekAttendanceAgg,
      upcomingEventsTotal,
      upcomingEventsIn7Days,
      eventsCreatedThisMonth,
      eventsCreatedLastMonth,
    ] = await Promise.all([
      prisma.member.count({ where: { deletedAt: null } }),
      prisma.member.count({ where: { createdAt: { gte: thisMonthStart }, deletedAt: null } }),
      prisma.member.count({
        where: {
          deletedAt: null,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      prisma.department.count({ where: { deletedAt: null } }),
      prisma.leader.count({ where: { deletedAt: null, isActive: true } }),
      prisma.attendance.findFirst({
        where: { date: { gte: todayStart }, deletedAt: null },
        orderBy: { date: 'desc' },
      }),
      prisma.offering.aggregate({ where: { date: { gte: thisMonthStart }, deletedAt: null }, _sum: { amount: true } }),
      prisma.tithe.aggregate({ where: { date: { gte: thisMonthStart }, deletedAt: null }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { date: { gte: thisMonthStart }, deletedAt: null }, _sum: { amount: true } }),
      prisma.pledge.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.event.findMany({
        where: { startDate: { gte: todayStart }, deletedAt: null },
        orderBy: { startDate: 'asc' },
        take: 5,
        select: { id: true, title: true, startDate: true, type: true, location: true },
      }),
      prisma.offering.aggregate({
        where: { date: { gte: lastMonthStart, lt: thisMonthStart }, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.attendance.aggregate({
        where: { deletedAt: null, date: { gte: weekStart, lte: endOfToday } },
        _sum: { totalCount: true },
      }),
      prisma.attendance.aggregate({
        where: { deletedAt: null, date: { gte: lastWeekStart, lte: lastWeekPeriodEnd } },
        _sum: { totalCount: true },
      }),
      prisma.event.count({ where: { startDate: { gte: todayStart }, deletedAt: null } }),
      prisma.event.count({
        where: {
          deletedAt: null,
          startDate: { gte: todayStart, lt: next7Exclusive },
        },
      }),
      prisma.event.count({
        where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
      }),
      prisma.event.count({
        where: {
          deletedAt: null,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
    ]);

    const offeringsThisMonth = num(monthlyOfferings._sum.amount);
    const offeringsLastMonth = num(lastMonthOfferings._sum.amount);
    const tithesThisMonth = num(monthlyTithes._sum.amount);
    const expensesThisMonth = num(monthlyExpenses._sum.amount);
    const totalIncome = offeringsThisMonth + tithesThisMonth;
    const lastMonthIncome = offeringsLastMonth;
    const incomeChange = lastMonthIncome > 0 ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;

    const newRegMomPct =
      newMembersLastMonth > 0
        ? ((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100
        : newMembersThisMonth > 0
          ? 100
          : 0;

    const thisWeekTotal = thisWeekAttendanceAgg._sum.totalCount ?? 0;
    const lastWeekSamePeriod = lastWeekAttendanceAgg._sum.totalCount ?? 0;
    const weekOverWeekPct =
      lastWeekSamePeriod > 0
        ? ((thisWeekTotal - lastWeekSamePeriod) / lastWeekSamePeriod) * 100
        : thisWeekTotal > 0
          ? 100
          : 0;

    const offeringsMomPct =
      offeringsLastMonth > 0
        ? ((offeringsThisMonth - offeringsLastMonth) / offeringsLastMonth) * 100
        : offeringsThisMonth > 0
          ? 100
          : 0;

    const eventsCreatedMomPct =
      eventsCreatedLastMonth > 0
        ? ((eventsCreatedThisMonth - eventsCreatedLastMonth) / eventsCreatedLastMonth) * 100
        : eventsCreatedThisMonth > 0
          ? 100
          : 0;

    successResponse(res, {
      members: {
        total: totalMembers,
        newThisMonth: newMembersThisMonth,
        newLastMonth: newMembersLastMonth,
        newRegistrationsMomChangePercent: parseFloat(newRegMomPct.toFixed(1)),
      },
      departments: totalDepartments,
      leaders: totalLeaders,
      attendance: {
        today: todayAttendance?.totalCount || 0,
        lastService: todayAttendance?.serviceName || 'No service recorded',
        thisWeekToDateTotal: thisWeekTotal,
        lastWeekSamePeriodTotal: lastWeekSamePeriod,
        weekOverWeekChangePercent: parseFloat(weekOverWeekPct.toFixed(1)),
      },
      finance: {
        monthlyIncome: totalIncome,
        monthlyExpenses: expensesThisMonth,
        netIncome: totalIncome - expensesThisMonth,
        incomeChange: parseFloat(incomeChange.toFixed(2)),
        offerings: offeringsThisMonth,
        tithes: tithesThisMonth,
        offeringsMomChangePercent: parseFloat(offeringsMomPct.toFixed(1)),
      },
      events: {
        upcomingTotal: upcomingEventsTotal,
        startingWithin7Days: upcomingEventsIn7Days,
        createdThisMonth: eventsCreatedThisMonth,
        createdLastMonth: eventsCreatedLastMonth,
        createdMomChangePercent: parseFloat(eventsCreatedMomPct.toFixed(1)),
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

