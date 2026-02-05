import { ApiProperty } from '@nestjs/swagger';

/**
 * Public profile response - excludes private fields like email
 */
export class PublicProfileDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: 'Full-stack developer passionate about building great products', nullable: true })
  bio: string | null;

  @ApiProperty({ example: 'https://github.com/johndoe', nullable: true })
  githubUrl: string | null;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', nullable: true })
  linkedinUrl: string | null;

  @ApiProperty({ example: '2026-02-05T12:00:00.000Z' })
  createdAt: Date;

  // Note: entries and snippets will be added when those modules are available
  // @ApiProperty({ type: [EntryResponseDto], required: false })
  // entries?: EntryResponseDto[];
  
  // @ApiProperty({ type: [SnippetResponseDto], required: false })
  // snippets?: SnippetResponseDto[];
}
