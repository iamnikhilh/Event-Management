import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, count, desc, eq, ilike } from 'drizzle-orm';

import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { categories, events } from '../../database/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(dto: CreateCategoryDto) {
    const normalizedName = dto.name.trim();
    const [existing] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, normalizedName))
      .limit(1);

    if (existing) {
      throw new ConflictException('Category name already exists');
    }

    const [category] = await this.db
      .insert(categories)
      .values({
        name: normalizedName,
      })
      .returning();

    return category;
  }

  async list(query: ListCategoriesDto) {
    const { page, limit, search, sortBy = 'createdAt', sortOrder } = query;
    const offset = (page - 1) * limit;
    const filter = search ? ilike(categories.name, `%${search}%`) : undefined;

    const [{ totalItems }] = await this.db
      .select({ totalItems: count() })
      .from(categories)
      .where(filter);

    const sortableColumns = {
      name: categories.name,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
    } as const;
    const sortColumn = sortableColumns[sortBy] ?? categories.createdAt;
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const data = await this.db
      .select()
      .from(categories)
      .where(filter)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(categoryId: string) {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(categoryId: string, dto: UpdateCategoryDto) {
    await this.findOne(categoryId);

    const normalizedName = dto.name?.trim();

    if (normalizedName) {
      const [existing] = await this.db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, normalizedName))
        .limit(1);

      if (existing && existing.id !== categoryId) {
        throw new ConflictException('Category name already exists');
      }
    }

    const [category] = await this.db
      .update(categories)
      .set({
        ...(normalizedName ? { name: normalizedName } : {}),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    return category;
  }

  async remove(categoryId: string) {
    await this.findOne(categoryId);

    const [{ totalItems }] = await this.db
      .select({ totalItems: count() })
      .from(events)
      .where(eq(events.categoryId, categoryId));

    if (totalItems > 0) {
      throw new ConflictException(
        'Cannot delete category with associated events',
      );
    }

    await this.db.delete(categories).where(eq(categories.id, categoryId));

    return { message: 'Category deleted' };
  }
}
