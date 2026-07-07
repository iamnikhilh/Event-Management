import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { sessions, sessionSpeakers, speakers } from '../../database/schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(eventId: string, dto: CreateSessionDto) {
    const [createdSession] = await this.db
      .insert(sessions)
      .values({
        eventId,
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

    return this.findOne(eventId, createdSession.id);
  }

  async findAllByEvent(eventId: string) {
    const allSessions = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.eventId, eventId))
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

  async findOne(eventId: string, sessionId: string) {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
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

  async update(eventId: string, sessionId: string, dto: UpdateSessionDto) {
    await this.findOne(eventId, sessionId);

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
      .where(eq(sessions.id, sessionId));

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

    return this.findOne(eventId, sessionId);
  }

  async remove(eventId: string, sessionId: string) {
    await this.findOne(eventId, sessionId);
    await this.db.delete(sessions).where(eq(sessions.id, sessionId));

    return { message: 'Session deleted' };
  }
}
