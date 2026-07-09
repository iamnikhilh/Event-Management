import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { OrganizerScopeService } from '../../common/services/organizer-scope.service';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { speakers } from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';

@Injectable()
export class SpeakersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly organizerScope: OrganizerScopeService,
  ) {}

  async create(dto: CreateSpeakerDto, user: AuthenticatedUser) {
    const [createdSpeaker] = await this.db
      .insert(speakers)
      .values({
        organizerId: user.sub,
        name: dto.name.trim(),
        title: dto.title.trim(),
        company: dto.company.trim(),
        bio: dto.bio?.trim(),
        photoUrl: dto.photoUrl,
      })
      .returning();

    return createdSpeaker;
  }

  async findAll(user: AuthenticatedUser) {
    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      speakers.organizerId,
    );

    if (organizerFilter) {
      return this.db.select().from(speakers).where(organizerFilter);
    }

    return this.db.select().from(speakers);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      speakers.organizerId,
    );
    const conditions = [eq(speakers.id, id)];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const [speaker] = await this.db
      .select()
      .from(speakers)
      .where(and(...conditions))
      .limit(1);

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    return speaker;
  }

  async update(id: string, dto: UpdateSpeakerDto, user: AuthenticatedUser) {
    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      speakers.organizerId,
    );
    const conditions = [eq(speakers.id, id)];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const updated = await this.db
      .update(speakers)
      .set({
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.company ? { company: dto.company.trim() } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio?.trim() } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning({ id: speakers.id });

    if (!updated.length) {
      throw new NotFoundException('Speaker not found');
    }

    return this.findOne(id, user);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      speakers.organizerId,
    );
    const conditions = [eq(speakers.id, id)];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const deleted = await this.db
      .delete(speakers)
      .where(and(...conditions))
      .returning({ id: speakers.id });

    if (!deleted.length) {
      throw new NotFoundException('Speaker not found');
    }

    return { message: 'Speaker deleted' };
  }
}
