import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateEntryDto {
  @ApiProperty({ example: 'Updated Title', required: false })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiProperty({ example: '# Updated Content\n\nNew content here...', required: false })
  @IsString()
  @IsOptional()
  @MinLength(1)
  content?: string;

  @ApiProperty({ example: 'Updated summary', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
