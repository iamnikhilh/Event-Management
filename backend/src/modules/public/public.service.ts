import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, ne, count, ilike, asc } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import {
  events,
  categories,
  sessions,
  sponsors,
  ticketTypes,
  speakers,
  sessionSpeakers,
  EventStatusValues,
} from '../../database/schema';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { ListPublicEventsDto } from './dto/list-public-events.dto';

@Injectable()
export class PublicService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findAllPublicEvents(query: ListPublicEventsDto) {
    try {
      const { page, limit, search } = query;
      const offset = (page - 1) * limit;

      const filters: Parameters<typeof and>[] = [
        eq(events.isPublic, true),
        ne(events.status, EventStatusValues.DRAFT),
      ];

      if (search) {
        filters.push(ilike(events.title, `%${search}%`));
      }

      const whereClause = and(...filters);

      let totalItems = 0;
      try {
        const countResult = await this.db
          .select({ totalItems: count() })
          .from(events)
          .where(whereClause);

        totalItems = countResult[0]?.totalItems || 0;
      } catch (countError) {
        console.error('Count query error:', countError);
        totalItems = 0;
      }

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
          category: {
            id: categories.id,
            name: categories.name,
          },
        })
        .from(events)
        .innerJoin(categories, eq(events.categoryId, categories.id))
        .where(whereClause)
        .orderBy(asc(events.eventDate))
        .limit(limit)
        .offset(offset);

      return {
        data,
        meta: buildPaginationMeta(page, limit, totalItems),
      };
    } catch (error) {
      console.error('findAllPublicEvents error:', error);
      throw error;
    }
  }

  async findPublicEventBySlug(slug: string) {
    const [event] = await this.db
      .select()
      .from(events)
      .where(
        and(
          eq(events.slug, slug),
          eq(events.isPublic, true),
          ne(events.status, EventStatusValues.DRAFT),
        ),
      )
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    console.log('Found event:', event.id);

    const eventSessions = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.eventId, event.id))
      .orderBy(asc(sessions.startTime));

    const sessionsWithSpeakers = await Promise.all(
      eventSessions.map(async (session) => {
        const sessionSpeakersList = await this.db
          .select({
            id: speakers.id,
            name: speakers.name,
            title: speakers.title,
            company: speakers.company,
            bio: speakers.bio,
            photoUrl: speakers.photoUrl,
          })
          .from(sessionSpeakers)
          .innerJoin(speakers, eq(sessionSpeakers.speakerId, speakers.id))
          .where(eq(sessionSpeakers.sessionId, session.id));

        return {
          ...session,
          speakers: sessionSpeakersList,
        };
      }),
    );

    const eventSponsors = await this.db
      .select()
      .from(sponsors)
      .where(eq(sponsors.eventId, event.id));

    const eventTicketTypes = await this.db
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.eventId, event.id));

    console.log('Event ID for ticket query:', event.id);
    console.log('Event ticket types found:', eventTicketTypes);
    console.log('Ticket types query - looking for eventId:', event.id);

    const category = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, event.categoryId))
      .limit(1);

    const result = {
      ...event,
      category: category[0],
      sessions: sessionsWithSpeakers,
      sponsors: eventSponsors,
      ticketTypes: eventTicketTypes,
    };

    console.log('Full event response with ticketTypes:', result.ticketTypes);

    return result;
  }
}
