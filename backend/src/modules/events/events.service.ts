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

import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import {
  EventStatusValues,
  categories,
  events,
  users,
} from '../../database/schema';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsDto } from './dto/list-events.dto';
import { RecentEventsQueryDto } from './dto/recent-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(userId: string, dto: CreateEventDto) {
    await this.ensureCategoryExists(dto.categoryId);

    const [createdEvent] = await this.db
      .insert(events)
      .values({
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        venue: dto.venue.trim(),
        eventDate: new Date(dto.eventDate),
        capacity: dto.capacity,
        status: dto.status ?? EventStatusValues.DRAFT,
        bannerImage: dto.bannerImage,
        createdById: userId,
      })
      .returning({ id: events.id });

    return this.findOne(createdEvent.id);
  }

  async list(query: ListEventsDto) {
    const { page, limit, search, sortBy = 'eventDate', sortOrder } = query;
    const offset = (page - 1) * limit;
    const whereClause = this.buildFilters(query);

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
        venue: events.venue,
        eventDate: events.eventDate,
        capacity: events.capacity,
        status: events.status,
        bannerImage: events.bannerImage,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(events)
      .innerJoin(categories, eq(events.categoryId, categories.id))
      .where(
        whereClause ??
          (search
            ? or(
                ilike(events.title, `%${search}%`),
                ilike(events.venue, `%${search}%`),
                ilike(events.description, `%${search}%`),
              )
            : undefined),
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(eventId: string) {
    const [event] = await this.db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        venue: events.venue,
        eventDate: events.eventDate,
        capacity: events.capacity,
        status: events.status,
        bannerImage: events.bannerImage,
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
      .innerJoin(users, eq(events.createdById, users.id))
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(eventId: string, dto: UpdateEventDto) {
    await this.findOne(eventId);

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    await this.db
      .update(events)
      .set({
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description ? { description: dto.description.trim() } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.venue ? { venue: dto.venue.trim() } : {}),
        ...(dto.eventDate ? { eventDate: new Date(dto.eventDate) } : {}),
        ...(dto.capacity ? { capacity: dto.capacity } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.bannerImage !== undefined
          ? { bannerImage: dto.bannerImage }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));

    return this.findOne(eventId);
  }

  async remove(eventId: string) {
    await this.findOne(eventId);
    await this.db.delete(events).where(eq(events.id, eventId));

    return { message: 'Event deleted' };
  }

  async stats() {
    const [
      totalEventsResult,
      upcomingEventsResult,
      activeEventsResult,
      draftEventsResult,
    ] = await Promise.all([
      this.db.select({ totalItems: count() }).from(events),
      this.db
        .select({ totalItems: count() })
        .from(events)
        .where(eq(events.status, EventStatusValues.UPCOMING)),
      this.db
        .select({ totalItems: count() })
        .from(events)
        .where(eq(events.status, EventStatusValues.ACTIVE)),
      this.db
        .select({ totalItems: count() })
        .from(events)
        .where(eq(events.status, EventStatusValues.DRAFT)),
    ]);

    return {
      totalEvents: totalEventsResult[0]?.totalItems ?? 0,
      upcomingEvents: upcomingEventsResult[0]?.totalItems ?? 0,
      activeEvents: activeEventsResult[0]?.totalItems ?? 0,
      draftEvents: draftEventsResult[0]?.totalItems ?? 0,
    };
  }

  async recent(query: RecentEventsQueryDto) {
    return this.db
      .select({
        id: events.id,
        title: events.title,
        status: events.status,
        eventDate: events.eventDate,
        venue: events.venue,
      })
      .from(events)
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

  private buildFilters(query: ListEventsDto): SQL | undefined {
    const filters: SQL[] = [];

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
