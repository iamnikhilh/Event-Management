import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, eq } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import {
  EventStatusValues,
  UserRoleValues,
  events,
} from '../../database/schema';
import { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';

export type ScopedEvent = {
  id: string;
  organizerId: string;
  isPublic: boolean;
  status: string;
};

@Injectable()
export class OrganizerScopeService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  isAdmin(user: AuthenticatedUser): boolean {
    return user.role === UserRoleValues.ADMIN;
  }

  isOrganizer(user: AuthenticatedUser): boolean {
    return user.role === UserRoleValues.ORGANIZER;
  }

  /** SQL filter for list queries; organizers are scoped, admins are not. */
  organizerFilter(
    user: AuthenticatedUser,
    organizerIdColumn: PgColumn,
  ): SQL | undefined {
    if (this.isAdmin(user)) {
      return undefined;
    }
    if (this.isOrganizer(user)) {
      return eq(organizerIdColumn, user.sub);
    }
    return undefined;
  }

  /** Throws 404 when the resource belongs to another organizer (never 403). */
  assertOrganizerOwnership(
    user: AuthenticatedUser,
    resourceOrganizerId: string,
    resourceLabel = 'Resource',
  ): void {
    if (this.isAdmin(user)) {
      return;
    }
    if (resourceOrganizerId !== user.sub) {
      throw new NotFoundException(`${resourceLabel} not found`);
    }
  }

  /** Load an event with organizer scoping applied in the database WHERE clause. */
  async getScopedEvent(
    eventId: string,
    user: AuthenticatedUser,
  ): Promise<ScopedEvent> {
    const conditions = [eq(events.id, eventId)];

    if (this.isOrganizer(user)) {
      conditions.push(eq(events.organizerId, user.sub));
    }

    const [event] = await this.db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        isPublic: events.isPublic,
        status: events.status,
      })
      .from(events)
      .where(and(...conditions))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  /**
   * Verify organizer/admin can manage an event. Returns organizerId for child writes.
   * Applies organizerId filter in the query — not a post-fetch check.
   */
  async verifyEventManageAccess(
    eventId: string,
    user: AuthenticatedUser,
  ): Promise<string> {
    const event = await this.getScopedEvent(eventId, user);
    return event.organizerId;
  }

  /**
   * Verify read access for nested event resources.
   * Organizers: scoped by organizerId. Admins: all. Attendees: public upcoming only.
   */
  async verifyEventReadAccess(
    eventId: string,
    user: AuthenticatedUser,
  ): Promise<ScopedEvent> {
    if (this.isAdmin(user) || this.isOrganizer(user)) {
      return this.getScopedEvent(eventId, user);
    }

    const [event] = await this.db
      .select({
        id: events.id,
        organizerId: events.organizerId,
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

    return event;
  }

  /** Resolve organizerId for an event (used when setting organizerId on child creates). */
  async resolveOrganizerIdForEvent(eventId: string): Promise<string> {
    const [event] = await this.db
      .select({ organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event.organizerId;
  }
}
