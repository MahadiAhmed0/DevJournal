import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Decorator to extract the Prisma User from the request.
 * The user is attached by SupabaseAuthGuard after just-in-time provisioning.
 * 
 * Usage:
 *   @Get('profile')
 *   @UseGuards(SupabaseAuthGuard)
 *   getProfile(@CurrentPrismaUser() user: User) {
 *     return user;
 *   }
 */
export const CurrentPrismaUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.prismaUser as User;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
