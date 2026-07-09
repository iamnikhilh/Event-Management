import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { ticketTypes, events, UserRoleValues } from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@Injectable()
export class TicketTypesService {
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

    // Only admin or event creator can manage ticket types
    if (user.role !== UserRoleValues.ADMIN && event.createdById !== user.sub) {
      throw new ForbiddenException('You do not have access to this event');
    }
  }

  async create(eventId: string, dto: CreateTicketTypeDto, user: AuthenticatedUser) {
    console.log('=== CREATE TICKET TYPE ===');
    console.log('Event ID:', eventId);
    console.log('User:', user);
    console.log('DTO:', dto);

    await this.verifyEventAccess(eventId, user);
    console.log('Event access verified');

    const [createdTicketType] = await this.db
      .insert(ticketTypes)
      .values({
        eventId,
        name: dto.name.trim(),
        price: dto.price.toString(),
        quantity: dto.quantity,
        quantitySold: 0,
      })
      .returning();

    console.log('Created ticket type:', createdTicketType);
    console.log('=== END CREATE TICKET TYPE ===');

    return createdTicketType;
  }

  async findAllByEvent(eventId: string) {
    return this.db
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.eventId, eventId));
  }

  async findOne(eventId: string, ticketTypeId: string) {
    const [ticketType] = await this.db
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.id, ticketTypeId))
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
    await this.verifyEventAccess(eventId, user);
    await this.findOne(eventId, ticketTypeId);

    await this.db
      .update(ticketTypes)
      .set({
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.price !== undefined ? { price: dto.price.toString() } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        updatedAt: new Date(),
      })
      .where(eq(ticketTypes.id, ticketTypeId));

    return this.findOne(eventId, ticketTypeId);
  }

  async remove(eventId: string, ticketTypeId: string, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);
    const ticketType = await this.findOne(eventId, ticketTypeId);

    if (ticketType.quantitySold > 0) {
      throw new ConflictException(
        'Cannot delete ticket type with sold tickets',
      );
    }

    await this.db.delete(ticketTypes).where(eq(ticketTypes.id, ticketTypeId));

    return { message: 'Ticket type deleted' };
  }

  async incrementSold(ticketTypeId: string, amount: number = 1) {
    const ticketType = await this.db
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.id, ticketTypeId))
      .limit(1);

    if (!ticketType.length) {
      throw new NotFoundException('Ticket type not found');
    }

    await this.db
      .update(ticketTypes)
      .set({
        quantitySold: ticketType[0].quantitySold + amount,
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
