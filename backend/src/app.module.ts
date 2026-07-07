import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { SupabaseModule } from './database/supabase.module';
import { EventsModule } from './modules/events/events.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SpeakersModule } from './modules/speakers/speakers.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SponsorsModule } from './modules/sponsors/sponsors.module';
import { TicketTypesModule } from './modules/ticket-types/ticket-types.module';
import { AttendeesModule } from './modules/attendees/attendees.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    EventsModule,
    SpeakersModule,
    SessionsModule,
    SponsorsModule,
    TicketTypesModule,
    AttendeesModule,
    NotificationsModule,
    AnalyticsModule,
    PublicModule,
  ],
})
export class AppModule {}
