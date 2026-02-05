import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,

} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase/supabase.service';
import { SignUpDto, SignInDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  private async isUsernameTaken(username: string): Promise<boolean> {
    const supabaseAdmin = this.supabaseService.getAdminClient();
    
    if (!supabaseAdmin) {
      // Fallback: can't check without admin client, allow signup
      return false;
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error || !data) {
      return false;
    }

    return data.users.some(
      (user) => 
        user.user_metadata?.username?.toLowerCase() === username.toLowerCase() ||
        user.user_metadata?.display_name?.toLowerCase() === username.toLowerCase()
    );
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, username } = signUpDto;
    const supabase = this.supabaseService.getClient();

    // Check if username is already taken
    const usernameTaken = await this.isUsernameTaken(username);
    if (usernameTaken) {
      throw new ConflictException('Username is already taken');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
          username: username,
        },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Sign up successful. Please check your email for verification.',
      user: data.user,
      session: data.session,
    };
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      message: 'Sign in successful',
      user: data.user,
      session: data.session,
    };
  }

  async signOut(accessToken: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.auth.admin.signOut(accessToken);

    if (error) {
      // Try regular signout if admin signout fails
      const { error: regularError } = await supabase.auth.signOut();
      if (regularError) {
        throw new BadRequestException(regularError.message);
      }
    }

    return {
      message: 'Sign out successful',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const supabase = this.supabaseService.getClient();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl}/reset-password`,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Password reset email sent. Please check your inbox.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, accessToken: string) {
    const { password } = resetPasswordDto;
    const supabase = this.supabaseService.getClient();

    // Set the session using the access token from the reset password link
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    });

    if (sessionError) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Password reset successful. You can now sign in with your new password.',
    };
  }

  async refreshToken(refreshToken: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      message: 'Token refreshed successfully',
      session: data.session,
    };
  }

  async getProfile(accessToken: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      user: data.user,
    };
  }

  async updateProfile(
    accessToken: string,
    updateData: { username?: string; email?: string },
  ) {
    const supabase = this.supabaseService.getClient();

    // Check if new username is already taken (if being changed)
    if (updateData.username) {
      const usernameTaken = await this.isUsernameTaken(updateData.username);
      if (usernameTaken) {
        // Get current user to check if it's their own username
        const { data: currentUser } = await supabase.auth.getUser(accessToken);
        const currentUsername = currentUser?.user?.user_metadata?.username || currentUser?.user?.user_metadata?.display_name;
        if (currentUsername?.toLowerCase() !== updateData.username.toLowerCase()) {
          throw new ConflictException('Username is already taken');
        }
      }
    }

    // Set session to make authenticated request
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    });

    const updatePayload: { email?: string; data?: { display_name?: string; username?: string } } = {};

    if (updateData.email) {
      updatePayload.email = updateData.email;
    }

    if (updateData.username) {
      updatePayload.data = {
        display_name: updateData.username,
        username: updateData.username,
      };
    }

    const { data, error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Profile updated successfully',
      user: data.user,
    };
  }
}
