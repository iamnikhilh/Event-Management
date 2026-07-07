import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { sponsors } from '../../database/schema';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';

const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

@Injectable()
export class SponsorsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(eventId: string, dto: CreateSponsorDto) {
    const [createdSponsor] = await this.db
      .insert(sponsors)
      .values({
        eventId,
        name: dto.name.trim(),
        logoUrl: dto.logoUrl,
        website: dto.website?.trim(),
        tier: dto.tier,
      })
      .returning();

    return createdSponsor;
  }

  async findAllByEvent(eventId: string) {
    const allSponsors = await this.db
      .select()
      .from(sponsors)
      .where(eq(sponsors.eventId, eventId));

    return allSponsors.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
  }

  async findOne(eventId: string, sponsorId: string) {
    const [sponsor] = await this.db
      .select()
      .from(sponsors)
      .where(eq(sponsors.id, sponsorId))
      .limit(1);

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    return sponsor;
  }

  async update(eventId: string, sponsorId: string, dto: UpdateSponsorDto) {
    await this.findOne(eventId, sponsorId);

    await this.db
      .update(sponsors)
      .set({
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.website !== undefined ? { website: dto.website?.trim() } : {}),
        ...(dto.tier ? { tier: dto.tier } : {}),
        updatedAt: new Date(),
      })
      .where(eq(sponsors.id, sponsorId));

    return this.findOne(eventId, sponsorId);
  }

  async remove(eventId: string, sponsorId: string) {
    await this.findOne(eventId, sponsorId);
    await this.db.delete(sponsors).where(eq(sponsors.id, sponsorId));

    return { message: 'Sponsor deleted' };
  }
}
