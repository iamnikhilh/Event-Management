import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, count, sql } from 'drizzle-orm';

import { OrganizerScopeService } from '../../common/services/organizer-scope.service';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import {
  attendees,
  events,
  ticketTypes,
  TicketStatusValues,
} from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly organizerScope: OrganizerScopeService,
  ) {}

  async getEventAnalytics(eventId: string, user: AuthenticatedUser) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      attendees.organizerId,
    );
    const attendeeScope = organizerFilter
      ? and(eq(attendees.eventId, eventId), organizerFilter)
      : eq(attendees.eventId, eventId);

    const [{ totalRegistered }] = await this.db
      .select({ totalRegistered: count() })
      .from(attendees)
      .where(
        and(attendeeScope, eq(attendees.status, TicketStatusValues.REGISTERED)),
      );

    const [{ totalCheckedIn }] = await this.db
      .select({ totalCheckedIn: count() })
      .from(attendees)
      .where(and(attendeeScope, eq(attendees.checkedIn, true)));

    const [{ waitlistCount }] = await this.db
      .select({ waitlistCount: count() })
      .from(attendees)
      .where(
        and(attendeeScope, eq(attendees.status, TicketStatusValues.WAITLISTED)),
      );

    const checkInRate =
      totalRegistered > 0 ? (totalCheckedIn / totalRegistered) * 100 : 0;

    const registrationsOverTime = await this.db
      .select({
        date: sql<string>`DATE(${attendees.registeredAt})`,
        count: count(),
      })
      .from(attendees)
      .where(attendeeScope)
      .groupBy(sql<string>`DATE(${attendees.registeredAt})`)
      .orderBy(sql<string>`DATE(${attendees.registeredAt})`);

    const ticketOrganizerFilter = this.organizerScope.organizerFilter(
      user,
      ticketTypes.organizerId,
    );
    const ticketScope = ticketOrganizerFilter
      ? and(eq(ticketTypes.eventId, eventId), ticketOrganizerFilter)
      : eq(ticketTypes.eventId, eventId);

    const ticketBreakdown = await this.db
      .select({
        ticketTypeName: ticketTypes.name,
        quantitySold: ticketTypes.quantitySold,
        quantity: ticketTypes.quantity,
      })
      .from(ticketTypes)
      .where(ticketScope);

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
    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      events.organizerId,
    );

    if (
      !this.organizerScope.isAdmin(user) &&
      !this.organizerScope.isOrganizer(user)
    ) {
      throw new NotFoundException('Event not found');
    }

    const allEvents = await this.db
      .select()
      .from(events)
      .where(organizerFilter);

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
        const attendeeOrganizerFilter = this.organizerScope.organizerFilter(
          user,
          attendees.organizerId,
        );
        const attendeeScope = attendeeOrganizerFilter
          ? and(
              eq(attendees.eventId, event.id),
              attendeeOrganizerFilter,
            )
          : eq(attendees.eventId, event.id);

        const [{ totalAttendees }] = await this.db
          .select({ totalAttendees: count() })
          .from(attendees)
          .where(
            and(
              attendeeScope,
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
