import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find or create tags by name.
   * Creates new tags if they don't exist.
   */
  async findOrCreateTags(tagNames: string[]) {
    // Normalize tag names (lowercase, trim)
    const normalizedNames = tagNames.map((name) => name.toLowerCase().trim());
    const uniqueNames = [...new Set(normalizedNames)];

    // Find existing tags
    const existingTags = await this.prisma.tag.findMany({
      where: { name: { in: uniqueNames } },
    });

    const existingNames = existingTags.map((t) => t.name);
    const newNames = uniqueNames.filter((name) => !existingNames.includes(name));

    // Create new tags
    if (newNames.length > 0) {
      await this.prisma.tag.createMany({
        data: newNames.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    // Return all tags
    return this.prisma.tag.findMany({
      where: { name: { in: uniqueNames } },
    });
  }

  /**
   * Add tags to an entry.
   * Creates new tags if they don't exist.
   * Skips duplicates.
   */
  async addTagsToEntry(entryId: string, userId: string, tagNames: string[]) {
    // Verify ownership
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this entry');
    }

    // Find or create tags
    const tags = await this.findOrCreateTags(tagNames);

    // Connect tags to entry
    await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        tags: {
          connect: tags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    // Return updated entry with tags
    return this.getEntryWithTags(entryId);
  }

  /**
   * Remove tags from an entry.
   */
  async removeTagsFromEntry(entryId: string, userId: string, tagNames: string[]) {
    // Verify ownership
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this entry');
    }

    // Normalize tag names
    const normalizedNames = tagNames.map((name) => name.toLowerCase().trim());

    // Find tags to disconnect
    const tagsToRemove = await this.prisma.tag.findMany({
      where: { name: { in: normalizedNames } },
    });

    // Disconnect tags from entry
    await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        tags: {
          disconnect: tagsToRemove.map((tag) => ({ id: tag.id })),
        },
      },
    });

    // Return updated entry with tags
    return this.getEntryWithTags(entryId);
  }

  /**
   * Replace all tags on an entry.
   */
  async updateEntryTags(entryId: string, userId: string, tagNames: string[]) {
    // Verify ownership
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this entry');
    }

    // Find or create tags
    const tags = tagNames.length > 0 ? await this.findOrCreateTags(tagNames) : [];

    // Replace all tags (set removes existing and adds new)
    await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        tags: {
          set: tags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    // Return updated entry with tags
    return this.getEntryWithTags(entryId);
  }

  /**
   * Get entry with tags included.
   */
  async getEntryWithTags(entryId: string) {
    return this.prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Get all tags (for autocomplete, etc.)
   */
  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get popular tags (most used)
   */
  async getPopularTags(limit = 20) {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: {
        entries: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
      entryCount: tag._count.entries,
    }));
  }

  /**
   * Search tags by name prefix
   */
  async searchTags(query: string, limit = 10) {
    return this.prisma.tag.findMany({
      where: {
        name: {
          startsWith: query.toLowerCase(),
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }
}
