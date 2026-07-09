import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, count, or, ilike, desc } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { attendees, events, TicketStatusValues, UserRoleValues } from '../../database/schema';
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
  ) {}

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

  async register(
    eventId: string,
    userId: string | null,
    dto: RegisterAttendeeDto,
  ) {
    await this.ticketTypesService.findOne(eventId, dto.ticketTypeId);

    // Generate a random QR code (using Math.random since nanoid is ESM)
    const qrCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

    // Get event details to include in email
    const [event] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    // Send confirmation email
    try {
      await this.emailService.sendAttendeeConfirmation(
        dto.email.trim(),
        dto.fullName.trim(),
        event?.title || 'Your Event',
        qrCode,
      );
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't fail registration if email fails
    }

    return createdAttendee;
  }

  async findAllByEvent(eventId: string, query: ListAttendeesDto, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);

    const { page, limit, search, status } = query;
    const offset = (page - 1) * limit;

    // Build where clause dynamically
    const conditions: any[] = [eq(attendees.eventId, eventId)];

    if (search) {
      conditions.push(
        or(
          ilike(attendees.fullName, `%${search}%`),
          ilike(attendees.email, `%${search}%`),
        ),
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

  async findOne(attendeeId: string, eventId: string, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);

    const [attendee] = await this.db
      .select()
      .from(attendees)
      .where(eq(attendees.id, attendeeId))
      .limit(1);

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    return attendee;
  }

  async update(attendeeId: string, eventId: string, dto: UpdateAttendeeDto, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);
    await this.findOne(attendeeId, eventId, user);

    await this.db
      .update(attendees)
      .set({
        ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.email ? { email: dto.email.trim() } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(attendees.id, attendeeId));

    return this.findOne(attendeeId, eventId, user);
  }

  async remove(attendeeId: string, eventId: string, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);
    await this.findOne(attendeeId, eventId, user);
    await this.db.delete(attendees).where(eq(attendees.id, attendeeId));

    return { message: 'Attendee deleted' };
  }

  async checkIn(qrCode: string, eventId: string, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);

    const [attendee] = await this.db
      .select()
      .from(attendees)
      .where(eq(attendees.qrCode, qrCode))
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
    await this.verifyEventAccess(eventId, user);

    const allAttendees = await this.db
      .select()
      .from(attendees)
      .where(eq(attendees.eventId, eventId));

    if (allAttendees.length === 0) {
      return 'Full Name,Email,Status,QR Code,Checked In,Registered At\n';
    }

    const headers = 'Full Name,Email,Status,QR Code,Checked In,Registered At\n';
    const rows = allAttendees
      .map(
        (attendee: any) =>
          `"${attendee.fullName}","${attendee.email}","${attendee.status}","${attendee.qrCode}",${attendee.checkedIn ? 'Yes' : 'No'},"${attendee.registeredAt?.toISOString() || ''}"`,
      )
      .join('\n');

    return headers + rows;
  }
}
