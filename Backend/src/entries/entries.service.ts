import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntryDto, UpdateEntryDto, QueryEntryDto } from './dto';

@Injectable()
export class EntriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createEntryDto: CreateEntryDto) {
    return this.prisma.entry.create({
      data: {
        title: createEntryDto.title,
        content: createEntryDto.content,
        summary: createEntryDto.summary,
        isPublic: createEntryDto.isPublic ?? false,
        userId,
      },
    });
  }

  async findMyEntries(userId: string, query: QueryEntryDto) {
    const { page = 1, limit = 10, isPublic, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.entry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.entry.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Allow access if entry is public or belongs to the user
    if (!entry.isPublic && entry.userId !== userId) {
      throw new ForbiddenException('You do not have access to this entry');
    }

    return entry;
  }

  async findOneOwned(id: string, userId: string) {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this entry');
    }

    return entry;
  }

  async update(id: string, userId: string, updateEntryDto: UpdateEntryDto) {
    // Verify ownership
    await this.findOneOwned(id, userId);

    return this.prisma.entry.update({
      where: { id },
      data: {
        title: updateEntryDto.title,
        content: updateEntryDto.content,
        summary: updateEntryDto.summary,
        isPublic: updateEntryDto.isPublic,
      },
    });
  }

  async remove(id: string, userId: string) {
    // Verify ownership
    await this.findOneOwned(id, userId);

    await this.prisma.entry.delete({
      where: { id },
    });

    return { message: 'Entry deleted successfully' };
  }

  // Public access - for public entries only
  async findPublicEntry(id: string) {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
      include: {
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

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (!entry.isPublic) {
      throw new NotFoundException('Entry not found');
    }

    return entry;
  }

  // Get public entries for a user profile
  async findPublicEntriesByUser(userId: string, query: QueryEntryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.entry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.entry.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
