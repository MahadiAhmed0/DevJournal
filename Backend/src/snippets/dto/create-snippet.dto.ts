import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
  IsIn,
} from 'class-validator';

const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'scala',
  'html',
  'css',
  'scss',
  'sql',
  'bash',
  'shell',
  'json',
  'yaml',
  'xml',
  'markdown',
  'plaintext',
] as const;

export class CreateSnippetDto {
  @ApiProperty({
    example: 'React useEffect Hook',
    description: 'Title of the code snippet',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'useEffect(() => {\n  // effect\n  return () => cleanup();\n}, [deps]);',
    description: 'The code content',
  })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty({
    example: 'typescript',
    description: 'Programming language',
    enum: SUPPORTED_LANGUAGES,
  })
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES, { message: 'Invalid programming language' })
  language: string;

  @ApiPropertyOptional({
    example: 'A template for React useEffect with cleanup',
    description: 'Optional description',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the snippet is publicly visible',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Optional entry ID to associate with',
  })
  @IsOptional()
  @IsUUID()
  entryId?: string;
}
