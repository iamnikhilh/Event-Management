import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, asc, and } from 'drizzle-orm';

import { OrganizerScopeService } from '../../common/services/organizer-scope.service';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { sessions, sessionSpeakers, speakers } from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly organizerScope: OrganizerScopeService,
  ) {}

  async create(
    eventId: string,
    dto: CreateSessionDto,
    user: AuthenticatedUser,
  ) {
    const organizerId = await this.organizerScope.verifyEventManageAccess(
      eventId,
      user,
    );

    const [createdSession] = await this.db
      .insert(sessions)
      .values({
        eventId,
        organizerId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        track: dto.track?.trim(),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      })
      .returning();

    if (dto.speakerIds && dto.speakerIds.length > 0) {
      await this.db.insert(sessionSpeakers).values(
        dto.speakerIds.map((speakerId) => ({
          sessionId: createdSession.id,
          speakerId,
        })),
      );
    }

    return this.findOne(eventId, createdSession.id, user);
  }

  async findAllByEvent(eventId: string, user: AuthenticatedUser) {
    await this.organizerScope.verifyEventReadAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      sessions.organizerId,
    );
    const whereClause = organizerFilter
      ? and(eq(sessions.eventId, eventId), organizerFilter)
      : eq(sessions.eventId, eventId);

    const allSessions = await this.db
      .select()
      .from(sessions)
      .where(whereClause)
      .orderBy(asc(sessions.startTime));

    const sessionsWithSpeakers = await Promise.all(
      allSessions.map(async (session) => {
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

    return sessionsWithSpeakers;
  }

  async findOne(
    eventId: string,
    sessionId: string,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventReadAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      sessions.organizerId,
    );
    const conditions = [
      eq(sessions.id, sessionId),
      eq(sessions.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const [session] = await this.db
      .select()
      .from(sessions)
      .where(and(...conditions))
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

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
  }

  async update(
    eventId: string,
    sessionId: string,
    dto: UpdateSessionDto,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      sessions.organizerId,
    );
    const conditions = [
      eq(sessions.id, sessionId),
      eq(sessions.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const existing = await this.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(...conditions))
      .limit(1);

    if (!existing.length) {
      throw new NotFoundException('Session not found');
    }

    await this.db
      .update(sessions)
      .set({
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() }
          : {}),
        ...(dto.track !== undefined ? { track: dto.track?.trim() } : {}),
        ...(dto.startTime ? { startTime: new Date(dto.startTime) } : {}),
        ...(dto.endTime ? { endTime: new Date(dto.endTime) } : {}),
        updatedAt: new Date(),
      })
      .where(and(...conditions));

    if (dto.speakerIds) {
      await this.db
        .delete(sessionSpeakers)
        .where(eq(sessionSpeakers.sessionId, sessionId));

      if (dto.speakerIds.length > 0) {
        await this.db.insert(sessionSpeakers).values(
          dto.speakerIds.map((speakerId) => ({
            sessionId,
            speakerId,
          })),
        );
      }
    }

    return this.findOne(eventId, sessionId, user);
  }

  async remove(
    eventId: string,
    sessionId: string,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      sessions.organizerId,
    );
    const conditions = [
      eq(sessions.id, sessionId),
      eq(sessions.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const deleted = await this.db
      .delete(sessions)
      .where(and(...conditions))
      .returning({ id: sessions.id });

    if (!deleted.length) {
      throw new NotFoundException('Session not found');
    }

    return { message: 'Session deleted' };
  }
}
