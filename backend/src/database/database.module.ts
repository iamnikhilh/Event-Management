import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { DATABASE_CONNECTION } from './database.constants';
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        
        const pool = new Pool({
          connectionString: configService.getOrThrow<string>('DATABASE_URL'),
          ssl: isProduction
            ? {
                rejectUnauthorized: false,
              }
            : false,
          // Aggressive pooling for Supabase compatibility
          max: 5, // Very conservative - Supabase limits connections
          min: 1,
          idleTimeoutMillis: 10000, // Close idle connections quickly
          connectionTimeoutMillis: 20000, // Give it time to retry
          application_name: 'event-management-api',
          keepAlive: true,
          statement_timeout: 30000, // 30s timeout per query
        });

        // Enhanced error logging
        pool.on('error', (err) => {
          console.error('❌ Unexpected database pool error:', {
            message: err.message,
            stack: err.stack,
          });
        });

        pool.on('connect', () => {
          console.log('✅ New database connection established');
        });

        pool.on('remove', () => {
          console.log('� Database connection closed');
        });

        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
