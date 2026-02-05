import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    // Verify user exists
    await this.findById(userId);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatar: data.avatar,
        bio: data.bio,
        githubUrl: data.githubUrl,
        linkedinUrl: data.linkedinUrl,
      },
    });

    return updatedUser;
  }

  async createUser(data: { email: string; name: string; username: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        username: data.username,
      },
    });
  }
}
