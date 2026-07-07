import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { SupabaseModule } from './database/supabase.module';
import { EventsModule } from './modules/events/events.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';

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
  ],
})
export class AppModule {}
