import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly serviceClient: SupabaseClient;
  private readonly anonClient: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_ANON_KEY!;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!url || !anon || !service) {
      this.logger.error('Supabase environment variables are not fully set');
      throw new Error('Missing Supabase environment configuration');
    }

    this.serviceClient = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.anonClient = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  getAdminClient(): SupabaseClient {
    return this.serviceClient;
  }

  getAuthenticatedClient(accessToken: string): SupabaseClient {
    // Create a client with the user's access token
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_ANON_KEY!;

    const client = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    return client;
  }

  async getUserFromAccessToken(token: string): Promise<User | null> {
    try {
      const { data, error } = await this.anonClient.auth.getUser(token);
      if (error) {
        this.logger.warn(`getUser error: ${error.message}`);
        return null;
      }
      return data.user ?? null;
    } catch (e) {
      this.logger.error(
        'Failed to fetch user from token',
        e instanceof Error ? e.stack : String(e),
      );
      return null;
    }
  }
}
