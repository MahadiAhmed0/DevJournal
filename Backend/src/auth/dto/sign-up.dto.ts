import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'johndoe', description: 'Unique username (3-30 chars, alphanumeric and underscores only)' })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username: string;
}
