import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { OrganizerScopeService } from '../../common/services/organizer-scope.service';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { ticketTypes } from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@Injectable()
export class TicketTypesService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly organizerScope: OrganizerScopeService,
  ) {}

  async create(
    eventId: string,
    dto: CreateTicketTypeDto,
    user: AuthenticatedUser,
  ) {
    const organizerId = await this.organizerScope.verifyEventManageAccess(
      eventId,
      user,
    );

    const [createdTicketType] = await this.db
      .insert(ticketTypes)
      .values({
        eventId,
        organizerId,
        name: dto.name.trim(),
        price: dto.price.toString(),
        quantity: dto.quantity,
        quantitySold: 0,
      })
      .returning();

    return createdTicketType;
  }

  async findAllByEvent(eventId: string, user: AuthenticatedUser) {
    await this.organizerScope.verifyEventReadAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      ticketTypes.organizerId,
    );
    const whereClause = organizerFilter
      ? and(eq(ticketTypes.eventId, eventId), organizerFilter)
      : eq(ticketTypes.eventId, eventId);

    return this.db.select().from(ticketTypes).where(whereClause);
  }

  async findOne(
    eventId: string,
    ticketTypeId: string,
    user?: AuthenticatedUser,
  ) {
    const conditions = [
      eq(ticketTypes.id, ticketTypeId),
      eq(ticketTypes.eventId, eventId),
    ];

    if (user) {
      const organizerFilter = this.organizerScope.organizerFilter(
        user,
        ticketTypes.organizerId,
      );
      if (organizerFilter) {
        conditions.push(organizerFilter);
      }
    }

    const [ticketType] = await this.db
      .select()
      .from(ticketTypes)
      .where(and(...conditions))
      .limit(1);

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    return ticketType;
  }

  async update(
    eventId: string,
    ticketTypeId: string,
    dto: UpdateTicketTypeDto,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      ticketTypes.organizerId,
    );
    const conditions = [
      eq(ticketTypes.id, ticketTypeId),
      eq(ticketTypes.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const updated = await this.db
      .update(ticketTypes)
      .set({
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.price !== undefined ? { price: dto.price.toString() } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning({ id: ticketTypes.id });

    if (!updated.length) {
      throw new NotFoundException('Ticket type not found');
    }

    return this.findOne(eventId, ticketTypeId, user);
  }

  async remove(
    eventId: string,
    ticketTypeId: string,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      ticketTypes.organizerId,
    );
    const conditions = [
      eq(ticketTypes.id, ticketTypeId),
      eq(ticketTypes.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const [ticketType] = await this.db
      .select()
      .from(ticketTypes)
      .where(and(...conditions))
      .limit(1);

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    if (ticketType.quantitySold > 0) {
      throw new ConflictException(
        'Cannot delete ticket type with sold tickets',
      );
    }

    await this.db.delete(ticketTypes).where(and(...conditions));

    return { message: 'Ticket type deleted' };
  }

  async incrementSold(ticketTypeId: string, amount: number = 1) {
    const [ticketType] = await this.db
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.id, ticketTypeId))
      .limit(1);

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    await this.db
      .update(ticketTypes)
      .set({
        quantitySold: ticketType.quantitySold + amount,
      })
      .where(eq(ticketTypes.id, ticketTypeId));
  }

  async getAvailableQuantity(ticketTypeId: string): Promise<number> {
    const [ticketType] = await this.db
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.id, ticketTypeId))
      .limit(1);

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    return ticketType.quantity - ticketType.quantitySold;
  }
}
