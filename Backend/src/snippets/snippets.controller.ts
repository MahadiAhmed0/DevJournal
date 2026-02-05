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
import { SnippetsService } from './snippets.service';
import { CreateSnippetDto, UpdateSnippetDto, QuerySnippetDto } from './dto';
import { SupabaseAuthGuard } from '../auth/guards';
import { CurrentPrismaUser } from '../auth/decorators';
import { SupabaseService } from '../common/supabase/supabase.service';

@ApiTags('Snippets')
@Controller('snippets')
export class SnippetsController {
  constructor(
    private readonly snippetsService: SnippetsService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new code snippet' })
  @ApiResponse({ status: 201, description: 'Snippet created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentPrismaUser() user: User,
    @Body() createSnippetDto: CreateSnippetDto,
  ) {
    return this.snippetsService.create(user.id, createSnippetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all public snippets with optional filters' })
  @ApiQuery({ name: 'language', required: false, description: 'Filter by programming language (e.g., typescript, python)' })
  @ApiQuery({ name: 'user', required: false, description: 'Filter by username' })
  @ApiResponse({ status: 200, description: 'List of public snippets' })
  async findAllPublic(@Query() query: QuerySnippetDto) {
    return this.snippetsService.findAllPublic(query);
  }

  @Get('my')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all snippets for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of snippets' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMySnippets(@CurrentPrismaUser() user: User) {
    return this.snippetsService.findMySnippets(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get snippet by ID (public visible to all, private only to owner)' })
  @ApiParam({ name: 'id', description: 'Snippet UUID' })
  @ApiResponse({ status: 200, description: 'Snippet found' })
  @ApiResponse({ status: 404, description: 'Snippet not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
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

    return this.snippetsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a snippet' })
  @ApiParam({ name: 'id', description: 'Snippet UUID' })
  @ApiResponse({ status: 200, description: 'Snippet updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your snippet' })
  @ApiResponse({ status: 404, description: 'Snippet not found' })
  async update(
    @Param('id') id: string,
    @CurrentPrismaUser() user: User,
    @Body() updateSnippetDto: UpdateSnippetDto,
  ) {
    return this.snippetsService.update(id, user.id, updateSnippetDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a snippet' })
  @ApiParam({ name: 'id', description: 'Snippet UUID' })
  @ApiResponse({ status: 200, description: 'Snippet deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your snippet' })
  @ApiResponse({ status: 404, description: 'Snippet not found' })
  async remove(
    @Param('id') id: string,
    @CurrentPrismaUser() user: User,
  ) {
    return this.snippetsService.remove(id, user.id);
  }
}
