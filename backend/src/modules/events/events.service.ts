import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
} from 'drizzle-orm';

import { OrganizerScopeService } from '../../common/services/organizer-scope.service';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import {
  EventStatusValues,
  UserRoleValues,
  categories,
  events,
  users,
} from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsDto } from './dto/list-events.dto';
import { RecentEventsQueryDto } from './dto/recent-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly organizerScope: OrganizerScopeService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateEventDto) {
    await this.ensureCategoryExists(dto.categoryId);

    const [createdEvent] = await this.db
      .insert(events)
      .values({
        title: dto.title.trim(),
        description: dto.description.trim(),
        slug: dto.slug.trim().toLowerCase(),
        categoryId: dto.categoryId,
        venue: dto.venue.trim(),
        eventDate: new Date(dto.eventDate),
        capacity: dto.capacity,
        status: dto.status ?? EventStatusValues.DRAFT,
        bannerImage: dto.bannerImage,
        isPublic: dto.isPublic ?? false,
        organizerId: user.sub,
      })
      .returning({ id: events.id });

    return this.findOne(createdEvent.id, user);
  }

  async list(query: ListEventsDto, user?: AuthenticatedUser) {
    const { page, limit, search, sortBy = 'eventDate', sortOrder } = query;
    const offset = (page - 1) * limit;
    const whereClause = this.buildFilters(query, user);

    const [{ totalItems }] = await this.db
      .select({ totalItems: count() })
      .from(events)
      .where(whereClause);

    const sortableColumns = {
      eventDate: events.eventDate,
      title: events.title,
      createdAt: events.createdAt,
      capacity: events.capacity,
    } as const;
    const sortColumn = sortableColumns[sortBy] ?? events.eventDate;
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const data = await this.db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        slug: events.slug,
        venue: events.venue,
        eventDate: events.eventDate,
        capacity: events.capacity,
        status: events.status,
        bannerImage: events.bannerImage,
        isPublic: events.isPublic,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(events)
      .innerJoin(categories, eq(events.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(eventId: string, user?: AuthenticatedUser) {
    const conditions: SQL[] = [eq(events.id, eventId)];

    if (user) {
      if (user.role === UserRoleValues.ORGANIZER) {
        conditions.push(eq(events.organizerId, user.sub));
      } else if (user.role === UserRoleValues.ATTENDEE) {
        conditions.push(
          eq(events.isPublic, true),
          eq(events.status, EventStatusValues.UPCOMING),
        );
      }
    } else {
      conditions.push(
        eq(events.isPublic, true),
        eq(events.status, EventStatusValues.UPCOMING),
      );
    }

    const [event] = await this.db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        slug: events.slug,
        venue: events.venue,
        eventDate: events.eventDate,
        capacity: events.capacity,
        status: events.status,
        bannerImage: events.bannerImage,
        isPublic: events.isPublic,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
        },
        createdBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
        },
      })
      .from(events)
      .innerJoin(categories, eq(events.categoryId, categories.id))
      .innerJoin(users, eq(events.organizerId, users.id))
      .where(and(...conditions))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(eventId: string, user: AuthenticatedUser, dto: UpdateEventDto) {
    await this.organizerScope.getScopedEvent(eventId, user);

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.title) updateData.title = dto.title.trim();
    if (dto.description) updateData.description = dto.description.trim();
    if (dto.slug) updateData.slug = dto.slug.trim().toLowerCase();
    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.venue) updateData.venue = dto.venue.trim();
    if (dto.eventDate) updateData.eventDate = new Date(dto.eventDate);
    if (dto.capacity) updateData.capacity = dto.capacity;
    if (dto.status) updateData.status = dto.status;
    if (dto.bannerImage !== undefined) updateData.bannerImage = dto.bannerImage;
    if (dto.isPublic !== undefined) updateData.isPublic = dto.isPublic;

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      events.organizerId,
    );
    const whereClause = organizerFilter
      ? and(eq(events.id, eventId), organizerFilter)
      : eq(events.id, eventId);

    const updated = await this.db
      .update(events)
      .set(updateData)
      .where(whereClause)
      .returning({ id: events.id });

    if (updated.length === 0) {
      throw new NotFoundException('Event not found');
    }

    return this.findOne(eventId, user);
  }

  async remove(eventId: string, user: AuthenticatedUser) {
    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      events.organizerId,
    );
    const whereClause = organizerFilter
      ? and(eq(events.id, eventId), organizerFilter)
      : eq(events.id, eventId);

    const deleted = await this.db
      .delete(events)
      .where(whereClause)
      .returning({ id: events.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Event not found');
    }

    return { message: 'Event deleted' };
  }

  async stats(user: AuthenticatedUser) {
    const statsFilters = this.organizerScope.organizerFilter(
      user,
      events.organizerId,
    );

    if (!this.organizerScope.isAdmin(user) && !this.organizerScope.isOrganizer(user)) {
      throw new NotFoundException('Event not found');
    }

    const [
      totalEventsResult,
      upcomingEventsResult,
      activeEventsResult,
      draftEventsResult,
    ] = await Promise.all([
      this.db.select({ totalItems: count() }).from(events).where(statsFilters),
      this.db
        .select({ totalItems: count() })
        .from(events)
        .where(
          statsFilters
            ? and(statsFilters, eq(events.status, EventStatusValues.UPCOMING))
            : eq(events.status, EventStatusValues.UPCOMING),
        ),
      this.db
        .select({ totalItems: count() })
        .from(events)
        .where(
          statsFilters
            ? and(statsFilters, eq(events.status, EventStatusValues.ACTIVE))
            : eq(events.status, EventStatusValues.ACTIVE),
        ),
      this.db
        .select({ totalItems: count() })
        .from(events)
        .where(
          statsFilters
            ? and(statsFilters, eq(events.status, EventStatusValues.DRAFT))
            : eq(events.status, EventStatusValues.DRAFT),
        ),
    ]);

    return {
      totalEvents: totalEventsResult[0]?.totalItems ?? 0,
      upcomingEvents: upcomingEventsResult[0]?.totalItems ?? 0,
      activeEvents: activeEventsResult[0]?.totalItems ?? 0,
      draftEvents: draftEventsResult[0]?.totalItems ?? 0,
    };
  }

  async recent(query: RecentEventsQueryDto, user: AuthenticatedUser) {
    let recentFilters: SQL | undefined;

    if (user.role === UserRoleValues.ADMIN) {
      recentFilters = undefined;
    } else if (user.role === UserRoleValues.ORGANIZER) {
      recentFilters = eq(events.organizerId, user.sub);
    } else {
      recentFilters = and(
        eq(events.isPublic, true),
        eq(events.status, EventStatusValues.UPCOMING),
      );
    }

    return this.db
      .select({
        id: events.id,
        title: events.title,
        status: events.status,
        eventDate: events.eventDate,
        venue: events.venue,
      })
      .from(events)
      .where(recentFilters)
      .orderBy(desc(events.createdAt))
      .limit(query.limit);
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const [category] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private buildFilters(
    query: ListEventsDto,
    user?: AuthenticatedUser,
  ): SQL | undefined {
    const filters: SQL[] = [];

    if (user) {
      if (user.role === UserRoleValues.ORGANIZER) {
        filters.push(eq(events.organizerId, user.sub));
      } else if (user.role === UserRoleValues.ATTENDEE) {
        filters.push(
          eq(events.isPublic, true),
          eq(events.status, EventStatusValues.UPCOMING),
        );
      }
    } else {
      filters.push(
        eq(events.isPublic, true),
        eq(events.status, EventStatusValues.UPCOMING),
      );
    }

    if (query.search) {
      filters.push(
        or(
          ilike(events.title, `%${query.search}%`),
          ilike(events.venue, `%${query.search}%`),
          ilike(events.description, `%${query.search}%`),
        )!,
      );
    }

    if (query.status) {
      filters.push(eq(events.status, query.status));
    }

    if (query.categoryId) {
      filters.push(eq(events.categoryId, query.categoryId));
    }

    if (query.dateFrom) {
      filters.push(gte(events.eventDate, new Date(query.dateFrom)));
    }

    if (query.dateTo) {
      filters.push(lte(events.eventDate, new Date(query.dateTo)));
    }

    return filters.length > 0 ? and(...filters) : undefined;
  }
}
