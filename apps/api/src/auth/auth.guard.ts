import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface RequestUserProfile {
  id: string;
  username: string;
  role: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = auth.slice('Bearer '.length).trim();
    const user = await this.supabase.getUserFromAccessToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    const admin = this.supabase.getAdminClient();
    const { data: profile, error } = await admin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error || !profile) {
      throw new UnauthorizedException('User profile not found');
    }
    req.user = user;
    req.userProfile = profile as RequestUserProfile;
    return true;
  }
}
