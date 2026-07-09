import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { OrganizerScopeService } from '../../common/services/organizer-scope.service';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { sponsors } from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';

const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

@Injectable()
export class SponsorsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly organizerScope: OrganizerScopeService,
  ) {}

  async create(
    eventId: string,
    dto: CreateSponsorDto,
    user: AuthenticatedUser,
  ) {
    const organizerId = await this.organizerScope.verifyEventManageAccess(
      eventId,
      user,
    );

    const [createdSponsor] = await this.db
      .insert(sponsors)
      .values({
        eventId,
        organizerId,
        name: dto.name.trim(),
        logoUrl: dto.logoUrl,
        website: dto.website?.trim(),
        tier: dto.tier,
      })
      .returning();

    return createdSponsor;
  }

  async findAllByEvent(eventId: string, user: AuthenticatedUser) {
    await this.organizerScope.verifyEventReadAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      sponsors.organizerId,
    );
    const whereClause = organizerFilter
      ? and(eq(sponsors.eventId, eventId), organizerFilter)
      : eq(sponsors.eventId, eventId);

    const allSponsors = await this.db
      .select()
      .from(sponsors)
      .where(whereClause);

    return allSponsors.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
  }

  async findOne(
    eventId: string,
    sponsorId: string,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventReadAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      sponsors.organizerId,
    );
    const conditions = [
      eq(sponsors.id, sponsorId),
      eq(sponsors.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const [sponsor] = await this.db
      .select()
      .from(sponsors)
      .where(and(...conditions))
      .limit(1);

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    return sponsor;
  }

  async update(
    eventId: string,
    sponsorId: string,
    dto: UpdateSponsorDto,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      sponsors.organizerId,
    );
    const conditions = [
      eq(sponsors.id, sponsorId),
      eq(sponsors.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const updated = await this.db
      .update(sponsors)
      .set({
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.website !== undefined ? { website: dto.website?.trim() } : {}),
        ...(dto.tier ? { tier: dto.tier } : {}),
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning({ id: sponsors.id });

    if (!updated.length) {
      throw new NotFoundException('Sponsor not found');
    }

    return this.findOne(eventId, sponsorId, user);
  }

  async remove(
    eventId: string,
    sponsorId: string,
    user: AuthenticatedUser,
  ) {
    await this.organizerScope.verifyEventManageAccess(eventId, user);

    const organizerFilter = this.organizerScope.organizerFilter(
      user,
      sponsors.organizerId,
    );
    const conditions = [
      eq(sponsors.id, sponsorId),
      eq(sponsors.eventId, eventId),
    ];
    if (organizerFilter) {
      conditions.push(organizerFilter);
    }

    const deleted = await this.db
      .delete(sponsors)
      .where(and(...conditions))
      .returning({ id: sponsors.id });

    if (!deleted.length) {
      throw new NotFoundException('Sponsor not found');
    }

    return { message: 'Sponsor deleted' };
  }
}
