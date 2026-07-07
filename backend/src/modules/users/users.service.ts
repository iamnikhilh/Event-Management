import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { count, desc, ilike, or, sql } from 'drizzle-orm';

import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { users } from '../../database/schema';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async me(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(sql`${users.id} = ${userId}`)
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const [user] = await this.db
      .update(users)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(sql`${users.id} = ${userId}`)
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async list(query: PaginationQueryDto) {
    const { page, limit, search, sortOrder } = query;
    const offset = (page - 1) * limit;

    const filters = search
      ? or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
        )
      : undefined;

    const [{ totalItems }] = await this.db
      .select({ totalItems: count() })
      .from(users)
      .where(filters);

    const orderBy =
      sortOrder === 'asc' ? users.createdAt : desc(users.createdAt);
    const data = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(filters)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }
}
