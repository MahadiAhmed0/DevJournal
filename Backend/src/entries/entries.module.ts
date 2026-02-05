import { Module } from '@nestjs/common';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [EntriesController],
  providers: [EntriesService],
  exports: [EntriesService],
})
export class EntriesModule {}
