import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
