import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = Symbol('SUPABASE_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createClient(
          configService.getOrThrow<string>('SUPABASE_URL'),
          configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          },
        ),
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
