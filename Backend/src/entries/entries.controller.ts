import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
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
import { Request } from 'express';
import { EntriesService } from './entries.service';
import {
  CreateEntryDto,
  UpdateEntryDto,
  QueryEntryDto,
  EntryResponseDto,
  PaginatedEntriesDto,
} from './dto';
import { SupabaseAuthGuard } from '../auth/guards';
import { CurrentPrismaUser } from '../auth/decorators';
import { SupabaseService } from '../common/supabase/supabase.service';
import { GeminiService } from '../ai/gemini.service';

@ApiTags('Entries')
@Controller('entries')
export class EntriesController {
  constructor(
    private readonly entriesService: EntriesService,
    private readonly supabaseService: SupabaseService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all public entries' })
  @ApiResponse({ status: 200, description: 'List of public entries', type: PaginatedEntriesDto })
  async findAllPublic(@Query() query: QueryEntryDto): Promise<PaginatedEntriesDto> {
    return this.entriesService.findAllPublicEntries(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search public entries by title or content' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Matching public entries', type: PaginatedEntriesDto })
  async searchPublic(
    @Query('q') searchQuery: string,
    @Query() query: QueryEntryDto,
  ): Promise<PaginatedEntriesDto> {
    return this.entriesService.searchPublicEntries(searchQuery || '', query);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new entry' })
  @ApiResponse({ status: 201, description: 'Entry created', type: EntryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentPrismaUser() user: User,
    @Body() createEntryDto: CreateEntryDto,
  ): Promise<EntryResponseDto> {
    return this.entriesService.create(user.id, createEntryDto);
  }

  @Get('my')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all entries for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of entries', type: PaginatedEntriesDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyEntries(
    @CurrentPrismaUser() user: User,
    @Query() query: QueryEntryDto,
  ): Promise<PaginatedEntriesDto> {
    return this.entriesService.findMyEntries(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entry by ID (public entries visible to all, private only to owner)' })
  @ApiParam({ name: 'id', description: 'Entry UUID' })
  @ApiResponse({ status: 200, description: 'Entry found', type: EntryResponseDto })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<EntryResponseDto> {
    // Try to get user from token if provided (optional auth)
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const supabase = this.supabaseService.getClient();
        const { data } = await supabase.auth.getUser(token);
        if (data.user) {
          userId = data.user.id;
        }
      } catch {
        // Token invalid or expired - proceed as unauthenticated
      }
    }

    return this.entriesService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an entry' })
  @ApiParam({ name: 'id', description: 'Entry UUID' })
  @ApiResponse({ status: 200, description: 'Entry updated', type: EntryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your entry' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async update(
    @Param('id') id: string,
    @CurrentPrismaUser() user: User,
    @Body() updateEntryDto: UpdateEntryDto,
  ): Promise<EntryResponseDto> {
    return this.entriesService.update(id, user.id, updateEntryDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an entry' })
  @ApiParam({ name: 'id', description: 'Entry UUID' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your entry' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async remove(
    @Param('id') id: string,
    @CurrentPrismaUser() user: User,
  ) {
    return this.entriesService.remove(id, user.id);
  }

  @Post(':id/summarize')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI summary for an entry' })
  @ApiParam({ name: 'id', description: 'Entry UUID' })
  @ApiResponse({ status: 200, description: 'Summary generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your entry' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async summarize(
    @Param('id') id: string,
    @CurrentPrismaUser() user: User,
  ) {
    // Verify ownership and get entry
    const entry = await this.entriesService.findOneOwned(id, user.id);

    // Generate summary using Gemini
    const summary = await this.geminiService.generateSummary(entry.content);

    return { summary };
  }
}
