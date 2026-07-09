import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, count, sql } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import {
  attendees,
  events,
  ticketTypes,
  TicketStatusValues,
  UserRoleValues,
} from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private async verifyEventAccess(eventId: string, user: AuthenticatedUser): Promise<void> {
    const [event] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Admin can access all events, organizers can only access their own
    if (user.role !== UserRoleValues.ADMIN && event.createdById !== user.sub) {
      throw new ForbiddenException('You do not have access to this event');
    }
  }

  async getEventAnalytics(eventId: string, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);

    const [{ totalRegistered }] = await this.db
      .select({ totalRegistered: count() })
      .from(attendees)
      .where(
        and(
          eq(attendees.eventId, eventId),
          eq(attendees.status, TicketStatusValues.REGISTERED),
        ),
      );

    const [{ totalCheckedIn }] = await this.db
      .select({ totalCheckedIn: count() })
      .from(attendees)
      .where(
        and(eq(attendees.eventId, eventId), eq(attendees.checkedIn, true)),
      );

    const [{ waitlistCount }] = await this.db
      .select({ waitlistCount: count() })
      .from(attendees)
      .where(
        and(
          eq(attendees.eventId, eventId),
          eq(attendees.status, TicketStatusValues.WAITLISTED),
        ),
      );

    const checkInRate =
      totalRegistered > 0 ? (totalCheckedIn / totalRegistered) * 100 : 0;

    const registrationsOverTime = await this.db
      .select({
        date: sql<string>`DATE(${attendees.registeredAt})`,
        count: count(),
      })
      .from(attendees)
      .where(eq(attendees.eventId, eventId))
      .groupBy(sql<string>`DATE(${attendees.registeredAt})`)
      .orderBy(sql<string>`DATE(${attendees.registeredAt})`);

    const ticketBreakdown = await this.db
      .select({
        ticketTypeName: ticketTypes.name,
        quantitySold: ticketTypes.quantitySold,
        quantity: ticketTypes.quantity,
      })
      .from(ticketTypes)
      .where(eq(ticketTypes.eventId, eventId));

    return {
      totalRegistered,
      totalCheckedIn,
      checkInRate: Math.round(checkInRate * 100) / 100,
      waitlistCount,
      registrationsOverTime: registrationsOverTime.map((row) => ({
        date: row.date,
        count: row.count,
      })),
      ticketBreakdown,
    };
  }

  async getOverviewAnalytics(user: AuthenticatedUser) {
    let allEvents;

    // Admin sees all events, organizers see only their own
    if (user.role === UserRoleValues.ADMIN) {
      allEvents = await this.db.select().from(events);
    } else {
      allEvents = await this.db
        .select()
        .from(events)
        .where(eq(events.createdById, user.sub));
    }

    const eventsByStatus = {
      draft: 0,
      upcoming: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    };

    allEvents.forEach((event) => {
      eventsByStatus[event.status]++;
    });

    const eventsWithAttendance = await Promise.all(
      allEvents.map(async (event) => {
        const [{ totalAttendees }] = await this.db
          .select({ totalAttendees: count() })
          .from(attendees)
          .where(
            and(
              eq(attendees.eventId, event.id),
              eq(attendees.status, TicketStatusValues.REGISTERED),
            ),
          );

        return {
          eventId: event.id,
          title: event.title,
          attendance: totalAttendees,
        };
      }),
    );

    const top5Events = eventsWithAttendance
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 5);

    return {
      eventsByStatus,
      top5Events,
    };
  }
}
