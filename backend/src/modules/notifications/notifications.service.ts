import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, count, desc } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { notifications, NotificationType } from '../../database/schema';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
  ) {
    const [notification] = await this.db
      .insert(notifications)
      .values({
        userId,
        type,
        title: title.trim(),
        message: message.trim(),
        isRead: false,
      })
      .returning();

    return notification;
  }

  async findAllByUser(userId: string, query: ListNotificationsDto) {
    const { page, limit, isRead } = query;
    const offset = (page - 1) * limit;

    const filters: Parameters<typeof and>[] = [eq(notifications.userId, userId)];

    if (isRead !== undefined) {
      filters.push(eq(notifications.isRead, isRead));
    }

    const whereClause = and(...filters);

    const [{ totalItems }] = await this.db
      .select({ totalItems: count() })
      .from(notifications)
      .where(whereClause);

    const data = await this.db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .limit(1);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return { message: 'All notifications marked as read' };
  }
}
