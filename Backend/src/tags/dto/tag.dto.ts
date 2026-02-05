import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, ArrayMinSize, MaxLength, MinLength, Matches, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateTagDto {
  @ApiProperty({
    example: 'javascript',
    description: 'Tag name (lowercase, alphanumeric with hyphens/underscores)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Tag name can only contain letters, numbers, underscores, and hyphens' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  name: string;
}

export class TagEntriesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class AddTagsDto {
  @ApiProperty({
    example: ['javascript', 'typescript', 'nestjs'],
    description: 'Array of tag names to add',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(50, { each: true })
  @Matches(/^[a-zA-Z0-9_-]+$/, { each: true, message: 'Tags can only contain letters, numbers, underscores, and hyphens' })
  tags: string[];
}

export class RemoveTagsDto {
  @ApiProperty({
    example: ['javascript'],
    description: 'Array of tag names to remove',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tags: string[];
}

export class UpdateTagsDto {
  @ApiProperty({
    example: ['react', 'frontend', 'web'],
    description: 'Complete list of tags - replaces all existing tags',
  })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Matches(/^[a-zA-Z0-9_-]+$/, { each: true, message: 'Tags can only contain letters, numbers, underscores, and hyphens' })
  tags: string[];
}
