import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSnippetDto, UpdateSnippetDto } from './dto';

@Injectable()
export class SnippetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createSnippetDto: CreateSnippetDto) {
    // If entryId provided, verify user owns the entry
    if (createSnippetDto.entryId) {
      const entry = await this.prisma.entry.findUnique({
        where: { id: createSnippetDto.entryId },
      });

      if (!entry) {
        throw new NotFoundException('Entry not found');
      }

      if (entry.userId !== userId) {
        throw new ForbiddenException('You can only add snippets to your own entries');
      }
    }

    return this.prisma.codeSnippet.create({
      data: {
        title: createSnippetDto.title,
        code: createSnippetDto.code,
        language: createSnippetDto.language,
        description: createSnippetDto.description,
        isPublic: createSnippetDto.isPublic ?? false,
        userId,
        entryId: createSnippetDto.entryId,
      },
    });
  }

  async findMySnippets(userId: string) {
    return this.prisma.codeSnippet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        entry: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async findAllPublic() {
    return this.prisma.codeSnippet.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      include: {
        entry: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId?: string | null) {
    const snippet = await this.prisma.codeSnippet.findUnique({
      where: { id },
      include: {
        entry: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!snippet) {
      throw new NotFoundException('Snippet not found');
    }

    // Public snippets are visible to anyone
    if (snippet.isPublic) {
      return snippet;
    }

    // Private snippets: only the owner can view
    if (!userId || snippet.userId !== userId) {
      throw new NotFoundException('Snippet not found');
    }

    return snippet;
  }

  private async findOneOwned(id: string, userId: string) {
    const snippet = await this.prisma.codeSnippet.findUnique({
      where: { id },
    });

    if (!snippet) {
      throw new NotFoundException('Snippet not found');
    }

    if (snippet.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this snippet');
    }

    return snippet;
  }

  async update(id: string, userId: string, updateSnippetDto: UpdateSnippetDto) {
    // Verify ownership
    await this.findOneOwned(id, userId);

    // If changing entryId, verify ownership of new entry
    if (updateSnippetDto.entryId) {
      const entry = await this.prisma.entry.findUnique({
        where: { id: updateSnippetDto.entryId },
      });

      if (!entry) {
        throw new NotFoundException('Entry not found');
      }

      if (entry.userId !== userId) {
        throw new ForbiddenException('You can only add snippets to your own entries');
      }
    }

    return this.prisma.codeSnippet.update({
      where: { id },
      data: {
        title: updateSnippetDto.title,
        code: updateSnippetDto.code,
        language: updateSnippetDto.language,
        description: updateSnippetDto.description,
        isPublic: updateSnippetDto.isPublic,
        entryId: updateSnippetDto.entryId,
      },
      include: {
        entry: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Verify ownership
    await this.findOneOwned(id, userId);

    await this.prisma.codeSnippet.delete({
      where: { id },
    });

    return { message: 'Snippet deleted successfully' };
  }
}
