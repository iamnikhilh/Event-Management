import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'organizer',
  'viewer',
]);
export const eventStatusEnum = pgEnum('event_status', [
  'draft',
  'upcoming',
  'active',
  'completed',
  'cancelled',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').default('organizer').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    refreshTokenHash: text('refresh_token_hash'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex('users_email_unique_idx').on(table.email),
  }),
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex('categories_name_unique_idx').on(table.name),
  }),
);

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    venue: varchar('venue', { length: 255 }).notNull(),
    eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
    capacity: integer('capacity').notNull(),
    status: eventStatusEnum('status').default('draft').notNull(),
    bannerImage: text('banner_image'),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusIdx: index('events_status_idx').on(table.status),
    categoryIdx: index('events_category_idx').on(table.categoryId),
    eventDateIdx: index('events_event_date_idx').on(table.eventDate),
    searchIdx: index('events_search_idx').using(
      'gin',
      sql`to_tsvector('simple', ${table.title} || ' ' || ${table.venue} || ' ' || ${table.description})`,
    ),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  category: one(categories, {
    fields: [events.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
}));

export const UserRoleValues = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  VIEWER: 'viewer',
} as const;

export const EventStatusValues = {
  DRAFT: 'draft',
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
