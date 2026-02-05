import { ApiProperty } from '@nestjs/swagger';

export class EntryResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'My First Journal Entry' })
  title: string;

  @ApiProperty({ example: '# Hello World\n\nThis is my first entry...' })
  content: string;

  @ApiProperty({ example: 'A brief summary', nullable: true })
  summary: string | null;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: '2026-02-05T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-05T12:00:00.000Z' })
  updatedAt: Date;
}

export class PaginatedEntriesDto {
  @ApiProperty({ type: [EntryResponseDto] })
  data: EntryResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
