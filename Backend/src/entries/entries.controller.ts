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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
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

@ApiTags('Entries')
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

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
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get entry by ID (own or public)' })
  @ApiParam({ name: 'id', description: 'Entry UUID' })
  @ApiResponse({ status: 200, description: 'Entry found', type: EntryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentPrismaUser() user: User,
  ): Promise<EntryResponseDto> {
    return this.entriesService.findOne(id, user.id);
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
}
