import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayMinSize, MaxLength, MinLength, Matches } from 'class-validator';

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
