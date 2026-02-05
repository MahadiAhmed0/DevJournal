import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: 'Full-stack developer', nullable: true })
  bio: string | null;

  @ApiProperty({ example: 'https://github.com/johndoe', nullable: true })
  githubUrl: string | null;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', nullable: true })
  linkedinUrl: string | null;

  @ApiProperty({ example: '2026-02-05T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-05T12:00:00.000Z' })
  updatedAt: Date;
}
