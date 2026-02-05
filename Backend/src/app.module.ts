import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './common/supabase/supabase.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    SupabaseModule,
    AuthModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
