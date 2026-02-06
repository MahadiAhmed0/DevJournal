import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySnippetDto {
  @ApiPropertyOptional({
    example: 'typescript',
    description: 'Filter by programming language',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  language?: string;

  @ApiPropertyOptional({
    example: 'johndoe',
    description: 'Filter by username',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  user?: string;

  @ApiPropertyOptional({
    example: 'fetch api',
    description: 'Search by title, code or description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page (max 50)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
