import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateEntryDto {
  @ApiProperty({ example: 'My First Journal Entry', description: 'Entry title' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '# Hello World\n\nThis is my first entry...', description: 'Entry content in markdown' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({ example: 'A brief summary of my entry', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({ example: false, default: false, description: 'Whether the entry is publicly visible' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
