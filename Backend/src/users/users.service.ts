import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a unique username from email.
   * If the base username exists, appends random digits until unique.
   */
  private async generateUniqueUsername(email: string): Promise<string> {
    // Extract base username from email (part before @)
    const baseUsername = email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_]/g, '_') // Replace invalid chars with underscore
      .toLowerCase()
      .slice(0, 20); // Limit length to allow room for random suffix

    // Check if base username is available
    const existingUser = await this.prisma.user.findUnique({
      where: { username: baseUsername },
    });

    if (!existingUser) {
      return baseUsername;
    }

    // If taken, append random digits until we find a unique one
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const randomSuffix = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const candidateUsername = `${baseUsername}${randomSuffix}`;

      const exists = await this.prisma.user.findUnique({
        where: { username: candidateUsername },
      });

      if (!exists) {
        return candidateUsername;
      }

      attempts++;
    }

    // Fallback: use timestamp
    return `${baseUsername}${Date.now()}`;
  }

  /**
   * Finds an existing user or creates a new one from Supabase auth data.
   * Used for just-in-time provisioning on first login.
   */
  async findOrCreateFromSupabase(supabaseUser: {
    id: string;
    email?: string;
    user_metadata?: { name?: string; full_name?: string; display_name?: string; username?: string };
  }) {
    const email = supabaseUser.email;

    if (!email) {
      throw new Error('Supabase user must have an email');
    }

    // First, check if user exists by ID (preferred - same as Supabase auth ID)
    let user = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (user) {
      return user;
    }

    // Check by email as fallback
    user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      return user;
    }

    // User doesn't exist - create new one
    const metadata = supabaseUser.user_metadata || {};
    const name =
      metadata.name ||
      metadata.full_name ||
      metadata.display_name ||
      email.split('@')[0];

    // Check if Supabase has a username, otherwise generate one
    let username = metadata.username;
    if (username) {
      // Verify it's unique
      const existingWithUsername = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existingWithUsername) {
        username = await this.generateUniqueUsername(email);
      }
    } else {
      username = await this.generateUniqueUsername(email);
    }

    // Create the user with the same ID as Supabase auth
    return this.prisma.user.create({
      data: {
        id: supabaseUser.id,
        email,
        name,
        username,
      },
    });
  }

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get public profile by username - excludes private fields like email
   * Will include public entries and snippets when those modules are ready
   */
  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        createdAt: true,
        // When entries/snippets relations are added:
        // entries: { where: { isPublic: true } },
        // snippets: { where: { isPublic: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    // Verify user exists
    await this.findById(userId);

    // Check username uniqueness if username is being updated
    if (data.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        username: data.username,
        avatar: data.avatar,
        bio: data.bio,
        githubUrl: data.githubUrl,
        linkedinUrl: data.linkedinUrl,
      },
    });

    return updatedUser;
  }

  async createUser(data: { id: string; email: string; name: string; username: string }) {
    return this.prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
        username: data.username,
      },
    });
  }
}
