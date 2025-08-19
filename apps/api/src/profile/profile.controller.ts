import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

class UpdateProfileDto {
  username!: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

/**
 * ProfileController
 *
 * Endpoints for retrieving and updating the authenticated user's profile.
 *
 * All endpoints require a Bearer token in the Authorization header.
 *
 * Example usage:
 *
 *   # Get profile
 *   curl -H "Authorization: Bearer <access_token>" http://localhost:4444/profile
 *
 *   # Update profile
 *   curl -X PUT -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
 *     -d '{"username":"newname","display_name":"New Name","avatar_url":"https://..."}' \
 *     http://localhost:4444/profile
 */
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async getProfile(@Req() req: any) {
    return {
      profile: req.userProfile,
      email: req.user?.email,
    };
  }

  @Put()
  async updateProfile(@Req() req: any, @Body() body: UpdateProfileDto) {
    if (!body.username || !body.username.trim()) {
      return { error: 'Username is required' };
    }
    const admin = this.supabase.getAdminClient();
    const { data, error } = await admin
      .from('users')
      .update({
        username: body.username.trim(),
        display_name: body.display_name?.trim() || null,
        avatar_url: body.avatar_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) {
      if (error.code === '23505' && error.message?.includes('username')) {
        return {
          error:
            'Username is already taken. Please choose a different username.',
          statusCode: 400,
        };
      }
      return { error: 'Failed to update profile', details: error.message };
    }
    return { message: 'Profile updated successfully', profile: data };
  }
}
