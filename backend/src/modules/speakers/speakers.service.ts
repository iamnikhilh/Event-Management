import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { speakers } from '../../database/schema';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';

@Injectable()
export class SpeakersService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(dto: CreateSpeakerDto) {
    const [createdSpeaker] = await this.db
      .insert(speakers)
      .values({
        name: dto.name.trim(),
        title: dto.title.trim(),
        company: dto.company.trim(),
        bio: dto.bio?.trim(),
        photoUrl: dto.photoUrl,
      })
      .returning();

    return createdSpeaker;
  }

  async findAll() {
    return this.db.select().from(speakers);
  }

  async findOne(id: string) {
    const [speaker] = await this.db
      .select()
      .from(speakers)
      .where(eq(speakers.id, id))
      .limit(1);

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    return speaker;
  }

  async update(id: string, dto: UpdateSpeakerDto) {
    await this.findOne(id);

    await this.db
      .update(speakers)
      .set({
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.company ? { company: dto.company.trim() } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio?.trim() } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(speakers.id, id));

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.delete(speakers).where(eq(speakers.id, id));

    return { message: 'Speaker deleted' };
  }
}
