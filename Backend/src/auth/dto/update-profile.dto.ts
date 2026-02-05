import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'johndoe', required: false, description: 'Unique username (3-30 chars)' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}
