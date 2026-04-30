import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse, paginatedResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';
import { EventType } from '@prisma/client';
import { RRule, rrulestr } from 'rrule';

// ==========================================
// Helper Functions (must be before usage in TS)
// ==========================================

async function detectConflicts(params: {
  startDate: Date;
  endDate?: Date;
  location?: string;
  departmentId?: string;
  leadershipGroup?: string;
  excludeEventId?: string;
}): Promise<any[]> {
  const start = new Date(params.startDate);
  const end = params.endDate ? new Date(params.endDate) : new Date(params.startDate);
  const dayStart = new Date(start);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(end);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const overlap: any = { startDate: { gte: dayStart, lte: dayEnd } };
  const orFilters: any[] = [];
  if (params.location) {
    orFilters.push({ location: { equals: params.location, mode: 'insensitive' as const } });
  }
  if (params.departmentId) orFilters.push({ departmentId: params.departmentId });
  if (params.leadershipGroup) orFilters.push({ leadershipGroup: params.leadershipGroup });

  if (orFilters.length === 0) return [];

  const where: any = {
    deletedAt: null,
    AND: [{ OR: orFilters }, overlap],
  };
  if (params.excludeEventId) where.NOT = { id: params.excludeEventId };

  return prisma.event.findMany({
    where,
    include: {
      department: { select: { name: true } },
      organizer: { select: { firstName: true, lastName: true } },
    },
  });
}

function buildSeriesRecurrenceRule(body: Record<string, any>): string {
  if (body.recurrenceRule && String(body.recurrenceRule).trim()) {
    return String(body.recurrenceRule).trim();
  }
  const rule = new RRule({
    freq: getRRuleFreq(body.frequency),
    dtstart: new Date(body.startDate),
    until: body.until ? new Date(body.until) : body.endDate ? new Date(body.endDate) : undefined,
    count: body.count,
    interval: body.interval || 1,
    byweekday: parseByDay(body.byDay),
    bymonthday: body.byMonthDay ?? undefined,
    bymonth: body.byMonth ?? undefined,
  });
  return rule.toString();
}

function expandRecurringEvents(events: any[], startDate: Date, endDate: Date): any[] {
  const expanded: any[] = [];
  for (const event of events) {
    if (!event.recurring || !event.recurrenceRule) {
      expanded.push(event);
      continue;
    }
    try {
      const rule = rrulestr(event.recurrenceRule);
      const dates = rule.between(startDate, endDate, true);
      for (const date of dates) {
        expanded.push({
          ...event,
          id: `${event.id}_${date.toISOString().split('T')[0]}`,
          startDate: date,
          isInstance: true,
          parentEventId: event.id,
        });
      }
    } catch (e) {
      expanded.push(event);
    }
  }
  return expanded;
}

function groupEventsByView(events: any[], view: string): any {
  const grouped: any = {};
  if (view === 'month' || view === 'year') {
    events.forEach(event => {
      const month = new Date(event.startDate).toISOString().slice(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(event);
    });
  } else if (view === 'week') {
    events.forEach(event => {
      const date = new Date(event.startDate);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!grouped[weekKey]) grouped[weekKey] = [];
      grouped[weekKey].push(event);
    });
  } else {
    grouped.all = events;
  }
  return grouped;
}

async function generateSeriesInstances(series: any): Promise<any[]> {
  const instances: any[] = [];
  try {
    const rule = new RRule({
      freq: getRRuleFreq(series.frequency),
      dtstart: new Date(series.startDate),
      until: series.endDate ? new Date(series.endDate) : undefined,
      count: series.count || undefined,
      interval: series.interval || 1,
      byweekday: parseByDay(series.byDay),
      bymonthday: series.byMonthDay || undefined,
      bymonth: series.byMonth || undefined,
    });
    const dates = rule.all();
    for (const date of dates) {
      const instance = await prisma.event.create({
        data: {
          title: series.title,
          description: series.description || '',
          type: series.type,
          startDate: date,
          endDate: series.endTime ? calculateEndDate(date, series.endTime) : undefined,
          startTime: series.startTime,
          endTime: series.endTime,
          location: series.location,
          venue: series.venue,
          isVirtual: series.isVirtual,
          virtualLink: series.virtualLink,
          departmentId: series.departmentId,
          organizerId: series.organizerId,
          recurring: true,
          seriesId: series.id,
          registrationRequired: series.registrationRequired,
          maxAttendees: series.maxAttendees,
          color: series.color || '#3b82f6',
          createdById: series.createdById,
        },
      });
      instances.push(instance);
    }
  } catch (error) {
    console.error('Failed to generate series instances:', error);
  }
  return instances;
}

async function regenerateSeriesInstances(series: any): Promise<void> {
  await prisma.event.deleteMany({
    where: { seriesId: series.id, startDate: { gte: new Date() } },
  });
  await generateSeriesInstances(series);
}

async function generateSeriesInstancesForYear(series: any, year: number): Promise<any[]> {
  const instances: any[] = [];
  try {
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31`);
    const rule = new RRule({
      freq: getRRuleFreq(series.frequency),
      dtstart: new Date(series.startDate),
      until: endOfYear,
      interval: series.interval || 1,
      byweekday: parseByDay(series.byDay),
      bymonthday: series.byMonthDay || undefined,
      bymonth: series.byMonth || undefined,
    });
    const dates = rule.between(startOfYear, endOfYear, true);
    for (const date of dates) {
      instances.push({
        id: `${series.id}_${date.toISOString().split('T')[0]}`,
        title: series.title,
        description: series.description || '',
        type: series.type,
        startDate: date,
        endDate: series.endTime ? calculateEndDate(date, series.endTime) : undefined,
        startTime: series.startTime,
        endTime: series.endTime,
        location: series.location,
        venue: series.venue,
        isVirtual: series.isVirtual,
        departmentId: series.departmentId,
        organizerId: series.organizerId,
        recurring: true,
        isInstance: true,
        seriesId: series.id,
        color: series.color || '#3b82f6',
        status: 'SCHEDULED',
        createdAt: series.createdAt,
      });
    }
  } catch (error) {
    console.error('Failed to generate year instances:', error);
  }
  return instances;
}

function detectYearConflicts(events: any[]): any[] {
  const conflicts: any[] = [];
  const locationGroups: { [key: string]: any[] } = {};
  events.forEach(event => {
    if (event.location) {
      if (!locationGroups[event.location]) locationGroups[event.location] = [];
      locationGroups[event.location].push(event);
    }
  });
  for (const location in locationGroups) {
    const eventsAtLocation = locationGroups[location].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    for (let i = 0; i < eventsAtLocation.length - 1; i++) {
      const current = eventsAtLocation[i];
      const next = eventsAtLocation[i + 1];
      if (current.startDate?.toISOString().split('T')[0] === next.startDate?.toISOString().split('T')[0]) {
        if (current.startTime && next.startTime) {
          conflicts.push({
            type: 'LOCATION_CONFLICT',
            location,
            events: [current, next],
          });
        }
      }
    }
  }
  return conflicts;
}

function getRRuleFreq(frequency: string): any {
  switch (frequency) {
    case 'DAILY': return RRule.DAILY;
    case 'WEEKLY': return RRule.WEEKLY;
    case 'MONTHLY': return RRule.MONTHLY;
    case 'YEARLY': return RRule.YEARLY;
    default: return RRule.WEEKLY;
  }
}

function parseByDay(byDay?: string): any[] | undefined {
  if (!byDay) return undefined;
  const dayMap: { [key: string]: any } = {
    'MO': (RRule as any).MO,
    'TU': (RRule as any).TU,
    'WE': (RRule as any).WE,
    'TH': (RRule as any).TH,
    'FR': (RRule as any).FR,
    'SA': (RRule as any).SA,
    'SU': (RRule as any).SU,
  };
  return byDay.split(',').map(d => dayMap[d.trim()]).filter(Boolean);
}

function calculateEndDate(startDate: Date, endTime: string): Date {
  const [hours, minutes] = endTime.split(':').map(Number);
  const endDate = new Date(startDate);
  endDate.setHours(hours, minutes, 0, 0);
  return endDate;
}

// ==========================================
// Core Event CRUD
// ==========================================

export const getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, startDate, endDate, type, status, departmentId, branchId, leadershipGroup, search } = req.query as any;
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (leadershipGroup) where.leadershipGroup = leadershipGroup;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          department: { select: { name: true, color: true } },
          branch: { select: { name: true, code: true } },
          organizer: { select: { firstName: true, lastName: true, email: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          series: { select: { name: true, frequency: true } },
          reminders: { select: { type: true, minutesBefore: true, isSent: true } },
          _count: { select: { registrations: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const eventsWithCounts = events.map((e) => {
      const { _count, ...rest } = e as any;
      return {
        ...rest,
        registeredCount: _count?.registrations ?? 0,
      };
    });

    paginatedResponse(res, eventsWithCounts, total, page, limit, 'Events retrieved');
  } catch (error) { next(error); }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const force =
      req.query.force === 'true' ||
      req.query.force === '1' ||
      req.query.force === 'yes';

    if (req.body.startDate && !force) {
      const conflicts = await detectConflicts({
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        location: req.body.location,
        departmentId: req.body.departmentId,
        leadershipGroup: req.body.leadershipGroup,
      });
      if (conflicts.length > 0) {
        res.status(409).json({
          success: false,
          data: { conflicts },
          message: 'Scheduling conflicts detected. Retry with ?force=true to create anyway.',
        });
        return;
      }
    }

    const event = await prisma.event.create({
      data: { ...req.body, createdById: req.user!.id },
      include: {
        department: true,
        organizer: true,
        branch: true,
      },
    });
    successResponse(res, event, 'Event created', 201);
  } catch (error) { next(error); }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        department: true,
        branch: true,
        organizer: true,
        attendance: true,
        registrations: { include: { member: { select: { firstName: true, lastName: true, memberNumber: true } } } },
        reminders: true,
        series: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!event) throw new AppError('Event not found', 404);
    successResponse(res, event, 'Event retrieved');
  } catch (error) { next(error); }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body,
      include: { department: true, organizer: true, branch: true, series: true },
    });
    successResponse(res, event, 'Event updated');
  } catch (error) { next(error); }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.event.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    successResponse(res, null, 'Event deleted');
  } catch (error) { next(error); }
};

// ==========================================
// Calendar View Operations
// ==========================================

export const getCalendarView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, view, departmentId, branchId, type, leadershipGroup } = req.query as any;
    const where: any = {
      deletedAt: null,
      startDate: { gte: new Date(startDate), lte: new Date(endDate) },
    };
    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (leadershipGroup) where.leadershipGroup = leadershipGroup;

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        department: { select: { name: true, color: true } },
        branch: { select: { name: true, code: true } },
        organizer: { select: { firstName: true, lastName: true } },
        reminders: { select: { type: true, minutesBefore: true, isSent: true } },
      },
    });

    const expandedEvents = expandRecurringEvents(events, new Date(startDate), new Date(endDate));
    const grouped = groupEventsByView(expandedEvents, view);

    successResponse(res, {
      view,
      startDate,
      endDate,
      totalEvents: expandedEvents.length,
      groups: grouped,
      events: expandedEvents,
    }, 'Calendar view retrieved');
  } catch (error) { next(error); }
};

// ==========================================
// Event Series (Recurring Programs)
// ==========================================

export const createRecurringProgram = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, description, frequency, title, type, startTime, endTime,
      location, venue, isVirtual, virtualLink, departmentId, organizerId,
      startDate, endDate, count, interval, byDay, byMonthDay, byMonth,
      registrationRequired, maxAttendees, color,
    } = req.body;

    const recurrenceRule = buildSeriesRecurrenceRule(req.body);

    const series = await prisma.eventSeries.create({
      data: {
        name,
        frequency,
        title,
        description,
        type,
        startTime,
        endTime,
        location,
        venue,
        isVirtual: isVirtual || false,
        virtualLink,
        departmentId,
        organizerId,
        recurrenceRule,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        count,
        interval: interval || 1,
        byDay,
        byMonthDay,
        byMonth,
        registrationRequired: registrationRequired || false,
        maxAttendees,
        color: color || '#3b82f6',
        isActive: true,
        createdById: req.user!.id,
      } as any,
    });

    const instances = await generateSeriesInstances(series);

    successResponse(res, { series, instancesGenerated: instances.length }, 'Recurring program created', 201);
  } catch (error) { next(error); }
};

export const getRecurringPrograms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, isActive, departmentId, frequency } = req.query as any;
    const where: any = {};
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (departmentId) where.departmentId = departmentId;
    if (frequency) where.frequency = frequency;

    const [programs, total] = await Promise.all([
      prisma.eventSeries.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          department: { select: { name: true, color: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.eventSeries.count({ where }),
    ]);

    paginatedResponse(res, programs, total, page, limit, 'Recurring programs retrieved');
  } catch (error) { next(error); }
};

const seriesIdFromReq = (req: Request): string =>
  (req.params as { programId?: string; id: string }).programId ?? req.params.id;

export const getRecurringProgramById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const series = await prisma.eventSeries.findFirst({
      where: { id: seriesIdFromReq(req) },
      include: {
        department: true,
        events: { where: { deletedAt: null }, orderBy: { startDate: 'asc' }, take: 20 },
      },
    });
    if (!series) throw new AppError('Recurring program not found', 404);
    successResponse(res, series, 'Recurring program retrieved');
  } catch (error) { next(error); }
};

export const updateRecurringProgram = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const series = await prisma.eventSeries.update({
      where: { id: seriesIdFromReq(req) },
      data: req.body,
    });
    if (req.body.startDate || req.body.endDate || req.body.count) {
      await regenerateSeriesInstances(series);
    }
    successResponse(res, series, 'Recurring program updated');
  } catch (error) { next(error); }
};

export const deleteRecurringProgram = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { deleteInstances } = req.query;
    const sid = seriesIdFromReq(req);
    const series = await prisma.eventSeries.update({
      where: { id: sid },
      data: { isActive: false } as any,
    });
    if (deleteInstances === 'true') {
      await prisma.event.updateMany({
        where: { seriesId: sid, deletedAt: null, startDate: { gte: new Date() } },
        data: { deletedAt: new Date(), status: 'CANCELLED' } as any,
      });
    }
    successResponse(res, series, 'Recurring program deactivated');
  } catch (error) { next(error); }
};

// ==========================================
// Conflict Detection
// ==========================================

export const getConflicts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, location, departmentId, leadershipGroup, excludeEventId } = req.query as any;
    const conflicts = await detectConflicts({
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      location,
      departmentId,
      leadershipGroup,
      excludeEventId,
    });
    successResponse(res, { hasConflicts: conflicts.length > 0, totalConflicts: conflicts.length, conflicts }, 'Conflict check complete');
  } catch (error) { next(error); }
};

// ==========================================
// Reminder Management
// ==========================================

export const setEventReminder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.id;
    const { type, minutesBefore, userId, email } = req.body;
    const reminder = await prisma.eventReminder.create({
      data: {
        eventId,
        type,
        minutesBefore,
        userId: userId || req.user!.id,
        email,
        isSent: false,
      },
    });
    successResponse(res, reminder, 'Reminder set', 201);
  } catch (error) { next(error); }
};

export const getEventReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reminders = await prisma.eventReminder.findMany({
      where: { eventId: req.params.id },
      include: {
        event: { select: { title: true, startDate: true, startTime: true } },
      },
    });
    successResponse(res, reminders, 'Reminders retrieved');
  } catch (error) { next(error); }
};

export const deleteEventReminder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.eventReminder.deleteMany({ where: { eventId: req.params.id } });
    successResponse(res, null, 'All reminders removed');
  } catch (error) { next(error); }
};

// ==========================================
// Export Operations
// ==========================================

export const exportCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { format, startDate, endDate, departmentId, branchId, type, leadershipGroup } = req.body;
    const where: any = {
      deletedAt: null,
      startDate: { gte: new Date(startDate), lte: new Date(endDate) },
    };
    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (leadershipGroup) where.leadershipGroup = leadershipGroup;

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        department: { select: { name: true, color: true } },
        branch: { select: { name: true } },
        organizer: { select: { firstName: true, lastName: true } },
      },
    });

    const exportRecord = await prisma.calendarExport.create({
      data: {
        userId: req.user!.id,
        format,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        filters: { departmentId, branchId, type, leadershipGroup },
        status: 'COMPLETED',
      },
    });

    successResponse(res, { format, events, exportId: exportRecord.id }, 'Export data prepared');
  } catch (error) { next(error); }
};

// ==========================================
// Sync Operations
// ==========================================

export const connectSyncAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { provider, accessToken, refreshToken, tokenExpiry, externalCalendarId } = req.body;
    const syncAccount = await prisma.calendarSyncAccount.upsert({
      where: {
        userId_provider: { userId: req.user!.id, provider },
      },
      create: {
        userId: req.user!.id,
        provider,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(tokenExpiry),
        externalCalendarId,
        syncEnabled: true,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiry: new Date(tokenExpiry),
        externalCalendarId,
        syncEnabled: true,
        lastSyncedAt: new Date(),
      },
    });
    successResponse(res, syncAccount, 'Sync account connected', 201);
  } catch (error) { next(error); }
};

export const getSyncStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { provider } = req.query as any;
    const where: any = { userId: req.user!.id };
    if (provider) where.provider = provider;
    const accounts = await prisma.calendarSyncAccount.findMany({
      where,
      select: {
        id: true,
        provider: true,
        syncEnabled: true,
        lastSyncedAt: true,
        externalCalendarId: true,
        createdAt: true,
      },
    });
    successResponse(res, accounts, 'Sync status retrieved');
  } catch (error) { next(error); }
};

export const disconnectSyncAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.calendarSyncAccount.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (result.count === 0) throw new AppError('Sync account not found', 404);
    successResponse(res, null, 'Sync account disconnected');
  } catch (error) { next(error); }
};

// ==========================================
// Yearly Calendar Generation
// ==========================================

export const generateYearlyCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { year, departmentId, branchId, includeRecurring, includeOneTime, conflictDetection } = req.body;
    const yearStart = new Date(`${year}-01-01`);
    const yearEnd = new Date(`${year}-12-31`);

    const oneTimeEvents = includeOneTime !== false ? await prisma.event.findMany({
      where: {
        deletedAt: null,
        startDate: { gte: yearStart, lte: yearEnd },
        recurring: false,
        ...(departmentId && { departmentId }),
        ...(branchId && { branchId }),
      },
      include: {
        department: { select: { name: true, color: true } },
        organizer: { select: { firstName: true, lastName: true } },
      },
    }) : [];

    let recurringEvents: any[] = [];
    if (includeRecurring !== false) {
      const recurringPrograms = await prisma.eventSeries.findMany({
        where: { isActive: true, ...(departmentId && { departmentId }) },
      });
      for (const program of recurringPrograms) {
        const instances = await generateSeriesInstancesForYear(program, year);
        recurringEvents = [...recurringEvents, ...instances];
      }
    }

    const allEvents = [...oneTimeEvents, ...recurringEvents].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    let conflicts: any[] = [];
    if (conflictDetection !== false) {
      conflicts = detectYearConflicts(allEvents);
    }

    successResponse(res, {
      year,
      totalEvents: allEvents.length,
      oneTimeEvents: oneTimeEvents.length,
      recurringInstances: recurringEvents.length,
      conflicts: conflicts.length,
      conflictDetails: conflicts,
      events: allEvents,
      generatedAt: new Date().toISOString(),
    }, 'Yearly calendar generated');
  } catch (error) { next(error); }
};

// ==========================================
// Filter options (for UI dropdowns)
// ==========================================

export const getFilterDepartments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = await prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, color: true },
      orderBy: { name: 'asc' },
    });
    successResponse(res, rows, 'Department filters');
  } catch (error) { next(error); }
};

export const getFilterBranches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = await prisma.branch.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    successResponse(res, rows, 'Branch filters');
  } catch (error) { next(error); }
};

export const getFilterEventTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    successResponse(res, Object.values(EventType), 'Event type filters');
  } catch (error) { next(error); }
};

export const getFilterLeadershipGroups = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = await prisma.event.findMany({
      where: { deletedAt: null, leadershipGroup: { not: null } },
      select: { leadershipGroup: true },
      distinct: ['leadershipGroup'],
      orderBy: { leadershipGroup: 'asc' },
    });
    const values = rows.map((r) => r.leadershipGroup).filter(Boolean) as string[];
    successResponse(res, values, 'Leadership group filters');
  } catch (error) { next(error); }
};
