import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, MaxLength, MinLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'johndoe', required: false, description: 'Unique username (3-30 chars, alphanumeric and underscores only)' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ example: 'Full-stack developer passionate about building great products', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ example: 'https://github.com/johndoe', required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;
}
