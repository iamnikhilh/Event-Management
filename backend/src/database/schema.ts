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
  decimal,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'organizer',
  'attendee',
]);
export const eventStatusEnum = pgEnum('event_status', [
  'draft',
  'upcoming',
  'active',
  'completed',
  'cancelled',
]);
export const ticketStatusEnum = pgEnum('ticket_status', [
  'registered',
  'waitlisted',
  'cancelled',
]);
export const sponsorTierEnum = pgEnum('sponsor_tier', [
  'platinum',
  'gold',
  'silver',
  'bronze',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'registration_confirmed',
  'waitlist_promoted',
  'event_update',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').default('attendee').notNull(),
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
    slug: varchar('slug', { length: 255 }).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    venue: varchar('venue', { length: 255 }).notNull(),
    eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
    capacity: integer('capacity').notNull(),
    status: eventStatusEnum('status').default('draft').notNull(),
    bannerImage: text('banner_image'),
    isPublic: boolean('is_public').default(false).notNull(),
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
    slugIdx: index('events_slug_idx').on(table.slug),
    isPublicIdx: index('events_is_public_idx').on(table.isPublic),
    searchIdx: index('events_search_idx').using(
      'gin',
      sql`to_tsvector('simple', ${table.title} || ' ' || ${table.venue} || ' ' || ${table.description})`,
    ),
  }),
);

export const speakers = pgTable('speakers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    track: varchar('track', { length: 255 }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventIdIdx: index('sessions_event_id_idx').on(table.eventId),
    startTimeIdx: index('sessions_start_time_idx').on(table.startTime),
  }),
);

export const sessionSpeakers = pgTable(
  'session_speakers',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    speakerId: uuid('speaker_id')
      .notNull()
      .references(() => speakers.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sessionId, table.speakerId] }),
  }),
);

export const sponsors = pgTable(
  'sponsors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    logoUrl: text('logo_url'),
    website: varchar('website', { length: 255 }),
    tier: sponsorTierEnum('tier').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventIdIdx: index('sponsors_event_id_idx').on(table.eventId),
    tierIdx: index('sponsors_tier_idx').on(table.tier),
  }),
);

export const ticketTypes = pgTable(
  'ticket_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    quantitySold: integer('quantity_sold').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventIdIdx: index('ticket_types_event_id_idx').on(table.eventId),
  }),
);

export const attendees = pgTable(
  'attendees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketTypes.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    status: ticketStatusEnum('status').default('registered').notNull(),
    qrCode: varchar('qr_code', { length: 255 }).notNull().unique(),
    checkedIn: boolean('checked_in').default(false).notNull(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    registeredAt: timestamp('registered_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventIdIdx: index('attendees_event_id_idx').on(table.eventId),
    ticketTypeIdIdx: index('attendees_ticket_type_id_idx').on(
      table.ticketTypeId,
    ),
    userIdIdx: index('attendees_user_id_idx').on(table.userId),
    qrCodeIdx: uniqueIndex('attendees_qr_code_unique_idx').on(table.qrCode),
    statusIdx: index('attendees_status_idx').on(table.status),
  }),
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  notifications: many(notifications),
  attendees: many(attendees),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  category: one(categories, {
    fields: [events.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  sessions: many(sessions),
  sponsors: many(sponsors),
  ticketTypes: many(ticketTypes),
  attendees: many(attendees),
}));

export const speakersRelations = relations(speakers, ({ many }) => ({
  sessions: many(sessionSpeakers),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  event: one(events, {
    fields: [sessions.eventId],
    references: [events.id],
  }),
  speakers: many(sessionSpeakers),
}));

export const sessionSpeakersRelations = relations(
  sessionSpeakers,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionSpeakers.sessionId],
      references: [sessions.id],
    }),
    speaker: one(speakers, {
      fields: [sessionSpeakers.speakerId],
      references: [speakers.id],
    }),
  }),
);

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  event: one(events, {
    fields: [sponsors.eventId],
    references: [events.id],
  }),
}));

export const ticketTypesRelations = relations(ticketTypes, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTypes.eventId],
    references: [events.id],
  }),
  attendees: many(attendees),
}));

export const attendeesRelations = relations(attendees, ({ one }) => ({
  event: one(events, {
    fields: [attendees.eventId],
    references: [events.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [attendees.ticketTypeId],
    references: [ticketTypes.id],
  }),
  user: one(users, {
    fields: [attendees.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const UserRoleValues = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  ATTENDEE: 'attendee',
} as const;

export const EventStatusValues = {
  DRAFT: 'draft',
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const TicketStatusValues = {
  REGISTERED: 'registered',
  WAITLISTED: 'waitlisted',
  CANCELLED: 'cancelled',
} as const;

export const SponsorTierValues = {
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BRONZE: 'bronze',
} as const;

export const NotificationTypeValues = {
  REGISTRATION_CONFIRMED: 'registration_confirmed',
  WAITLIST_PROMOTED: 'waitlist_promoted',
  EVENT_UPDATE: 'event_update',
} as const;

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
export type SponsorTier = (typeof sponsorTierEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Speaker = typeof speakers.$inferSelect;
export type NewSpeaker = typeof speakers.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionSpeaker = typeof sessionSpeakers.$inferSelect;
export type NewSessionSpeaker = typeof sessionSpeakers.$inferInsert;
export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
export type TicketType = typeof ticketTypes.$inferSelect;
export type NewTicketType = typeof ticketTypes.$inferInsert;
export type Attendee = typeof attendees.$inferSelect;
export type NewAttendee = typeof attendees.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
