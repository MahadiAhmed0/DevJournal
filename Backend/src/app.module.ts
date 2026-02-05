import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { EntriesModule } from './entries/entries.module';
import { TagsModule } from './tags/tags.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    PrismaModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    EntriesModule,
    TagsModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
