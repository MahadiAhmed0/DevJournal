import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { TagsService } from './tags.service';
import { AddTagsDto, RemoveTagsDto, UpdateTagsDto, TagResponseDto, CreateTagDto, TagEntriesQueryDto } from './dto';
import { SupabaseAuthGuard } from '../auth/guards';
import { CurrentPrismaUser } from '../auth/decorators';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({ status: 201, description: 'Tag created', type: TagResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTag(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    return this.tagsService.createTag(createTagDto.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'List of tags', type: [TagResponseDto] })
  async getAllTags(): Promise<TagResponseDto[]> {
    return this.tagsService.getAllTags();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular tags' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max tags to return (default 20)' })
  @ApiResponse({ status: 200, description: 'Popular tags with usage count' })
  async getPopularTags(@Query('limit') limit?: number) {
    return this.tagsService.getPopularTags(limit || 20);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tags by name' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 10)' })
  @ApiResponse({ status: 200, description: 'Matching tags', type: [TagResponseDto] })
  async searchTags(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ): Promise<TagResponseDto[]> {
    return this.tagsService.searchTags(query || '', limit || 10);
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get tag by name' })
  @ApiParam({ name: 'name', description: 'Tag name (slug)' })
  @ApiResponse({ status: 200, description: 'Tag found' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async getTagByName(@Param('name') name: string) {
    return this.tagsService.findByName(name);
  }

  @Get(':name/entries')
  @ApiOperation({ summary: 'Get public entries for a tag' })
  @ApiParam({ name: 'name', description: 'Tag name (slug)' })
  @ApiResponse({ status: 200, description: 'Paginated public entries with this tag' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async getTagEntries(
    @Param('name') name: string,
    @Query() query: TagEntriesQueryDto,
  ) {
    return this.tagsService.getEntriesByTagName(name, query.page, query.limit);
  }

  @Delete(':name')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiParam({ name: 'name', description: 'Tag name (slug)' })
  @ApiResponse({ status: 200, description: 'Tag deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async deleteTag(@Param('name') name: string) {
    return this.tagsService.deleteTag(name);
  }
}

@ApiTags('Entry Tags')
@Controller('entries/:entryId/tags')
export class EntryTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add tags to an entry' })
  @ApiParam({ name: 'entryId', description: 'Entry UUID' })
  @ApiResponse({ status: 200, description: 'Tags added, returns entry with tags' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your entry' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async addTags(
    @Param('entryId') entryId: string,
    @CurrentPrismaUser() user: User,
    @Body() addTagsDto: AddTagsDto,
  ) {
    return this.tagsService.addTagsToEntry(entryId, user.id, addTagsDto.tags);
  }

  @Put()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace all tags on an entry' })
  @ApiParam({ name: 'entryId', description: 'Entry UUID' })
  @ApiResponse({ status: 200, description: 'Tags updated, returns entry with tags' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your entry' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async updateTags(
    @Param('entryId') entryId: string,
    @CurrentPrismaUser() user: User,
    @Body() updateTagsDto: UpdateTagsDto,
  ) {
    return this.tagsService.updateEntryTags(entryId, user.id, updateTagsDto.tags);
  }

  @Delete()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove tags from an entry' })
  @ApiParam({ name: 'entryId', description: 'Entry UUID' })
  @ApiResponse({ status: 200, description: 'Tags removed, returns entry with remaining tags' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your entry' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async removeTags(
    @Param('entryId') entryId: string,
    @CurrentPrismaUser() user: User,
    @Body() removeTagsDto: RemoveTagsDto,
  ) {
    return this.tagsService.removeTagsFromEntry(entryId, user.id, removeTagsDto.tags);
  }
}
