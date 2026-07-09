import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, count, or, ilike, desc } from 'drizzle-orm';

import { OrganizerScopeService } from '../../common/services/organizer-scope.service';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import {
  attendees,
  events,
  EventStatusValues,
  TicketStatusValues,
} from '../../database/schema';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { EmailService } from '../email/email.service';
import { RegisterAttendeeDto } from './dto/register-attendee.dto';
import { ListAttendeesDto } from './dto/list-attendees.dto';
import { UpdateAttendeeDto } from './dto/update-attendee.dto';
import { TicketTypesService } from '../ticket-types/ticket-types.service';

@Injectable()
export class AttendeesService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly ticketTypesService: TicketTypesService,
    private readonly emailService: EmailService,
    private readonly organizerScope: OrganizerScopeService,
  ) {}

  async register(
    eventId: string,
    userId: string | null,
    dto: RegisterAttendeeDto,
  ) {
    const [event] = await this.db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        title: events.title,
        isPublic: events.isPublic,
        status: events.status,
      })
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.isPublic, true),
          eq(events.status, EventStatusValues.UPCOMING),
        ),
      )
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.ticketTypesService.findOne(eventId, dto.ticketTypeId);

    const qrCode =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const availableQuantity =
      await this.ticketTypesService.getAvailableQuantity(dto.ticketTypeId);

    const status =
      availableQuantity > 0
        ? TicketStatusValues.REGISTERED
        : TicketStatusValues.WAITLISTED;

    const [createdAttendee] = await this.db
      .insert(attendees)
      .values({
        eventId,
        organizerId: event.organizerId,
        ticketTypeId: dto.ticketTypeId,
        userId: userId || null,
        fullName: dto.fullName.trim(),
        email: dto.email.trim(),
        status,
        qrCode,
        checkedIn: false,
      })
      .returning();

    if (status === TicketStatusValues.REGISTERED) {
      await this.ticketTypesService.incrementSold(dto.ticketTypeId);
    }

    try {
      await this.emailService.sendAttendeeConfirmation(
        dto.email.trim(),
        dto.fullName.trim(),
        event.title,
        qrCode,
      );
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    return createdAttendee;
  }

  async findAllByEvent(
    eventId: string,
    query: ListAttendeesDto,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const { page, limit, search, status } = query;
    const offset = (page - 1) * limit;

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      attendees.organizerId,
    );
    const conditions = [eq(attendees.eventId, eventId)];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    if (search) {
      conditions.push(
        or(
          ilike(attendees.fullName, `%${search}%`),
          ilike(attendees.email, `%${search}%`),
        )!,
      );
    }

    if (status) {
      conditions.push(eq(attendees.status, status));
    }

    const whereClause = and(...conditions);

    const [{ totalItems }] = await this.db
      .select({ totalItems: count() })
      .from(attendees)
      .where(whereClause);

    const data = await this.db
      .select()
      .from(attendees)
      .where(whereClause)
      .orderBy(desc(attendees.registeredAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(
    attendeeId: string,
    eventId: string,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      attendees.organizerId,
    );
    const conditions = [
      eq(attendees.id, attendeeId),
      eq(attendees.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const [attendee] = await this.db
      .select()
      .from(attendees)
      .where(and(...conditions))
      .limit(1);

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    return attendee;
  }

  async update(
    attendeeId: string,
    eventId: string,
    dto: UpdateAttendeeDto,
    user: AuthenticatedUser,
  ) {
    await this.findOne(attendeeId, eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      attendees.organizerId,
    );
    const conditions = [
      eq(attendees.id, attendeeId),
      eq(attendees.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    await this.db
      .update(attendees)
      .set({
        ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.email ? { email: dto.email.trim() } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        updatedAt: new Date(),
      })
      .where(and(...conditions));

    return this.findOne(attendeeId, eventId, user);
  }

  async remove(
    attendeeId: string,
    eventId: string,
    user: AuthenticatedUser,
  ) {
    await this.findOne(attendeeId, eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      attendees.organizerId,
    );
    const conditions = [
      eq(attendees.id, attendeeId),
      eq(attendees.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const deleted = await this.db
      .delete(attendees)
      .where(and(...conditions))
      .returning({ id: attendees.id });

    if (!deleted.length) {
      throw new NotFoundException('Attendee not found');
    }

    return { message: 'Attendee deleted' };
  }

  async checkIn(
    qrCode: string,
    eventId: string,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      attendees.organizerId,
    );
    const conditions = [
      eq(attendees.qrCode, qrCode),
      eq(attendees.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const [attendee] = await this.db
      .select()
      .from(attendees)
      .where(and(...conditions))
      .limit(1);

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    if (attendee.checkedIn) {
      throw new ConflictException('Attendee already checked in');
    }

    if (attendee.status === TicketStatusValues.CANCELLED) {
      throw new ConflictException('Cannot check in a cancelled attendee');
    }

    await this.db
      .update(attendees)
      .set({
        checkedIn: true,
        checkedInAt: new Date(),
      })
      .where(eq(attendees.id, attendee.id));

    return this.findOne(attendee.id, eventId, user);
  }

  async exportCsv(eventId: string, user: AuthenticatedUser) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      attendees.organizerId,
    );
    const whereClause = organizerFilter
      ? and(eq(attendees.eventId, eventId), organizerFilter)
      : eq(attendees.eventId, eventId);

    const allAttendees = await this.db
      .select()
      .from(attendees)
      .where(whereClause);

    if (allAttendees.length === 0) {
      return 'Full Name,Email,Status,QR Code,Checked In,Registered At\n';
    }

    const headers =
      'Full Name,Email,Status,QR Code,Checked In,Registered At\n';
    const rows = allAttendees
      .map(
        (attendee) =>
          `"${attendee.fullName}","${attendee.email}","${attendee.status}","${attendee.qrCode}",${attendee.checkedIn ? 'Yes' : 'No'},"${attendee.registeredAt?.toISOString() || ''}"`,
      )
      .join('\n');

    return headers + rows;
  }
}
