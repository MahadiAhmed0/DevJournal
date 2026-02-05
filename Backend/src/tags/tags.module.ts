import { Module } from '@nestjs/common';
import { TagsController, EntryTagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  controllers: [TagsController, EntryTagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
