import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'javascript' })
  name: string;

  @ApiProperty({ example: '2026-02-05T12:00:00.000Z' })
  createdAt: Date;
}
