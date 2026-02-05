import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

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
