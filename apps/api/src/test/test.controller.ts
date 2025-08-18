import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

@ApiTags('test')
@Controller('test')
export class TestController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get('users-with-balances')
  @ApiOperation({ summary: 'Test endpoint for users with balances (no auth)' })
  @ApiResponse({
    status: 200,
    description: 'List of users with their balances',
  })
  async getUsersWithBalances() {
    const admin = this.supabase.getAdminClient();

    try {
      // Get all users
      const { data: userData, error: userError }: any = await admin
        .from('users')
        .select('id, username, role, created_at')
        .limit(5); // Limit to 5 for testing

      if (userError) {
        throw new Error(`User query error: ${userError.message}`);
      }

      // Get all wallets
      const { data: walletData, error: walletError }: any = await admin
        .from('wallets')
        .select('id, user_id, currency, name, is_default')
        .limit(10); // Limit to 10 for testing

      if (walletError) {
        throw new Error(`Wallet query error: ${walletError.message}`);
      }

      return {
        success: true,
        data: {
          users: userData || [],
          wallets: walletData || [],
        },
        message:
          'Test endpoint working - users and wallets fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Test endpoint failed',
      };
    }
  }

  @Get('wallets')
  @ApiOperation({ summary: 'Test endpoint for wallets (no auth)' })
  @ApiResponse({
    status: 200,
    description: 'List of all wallets',
  })
  async getWallets() {
    const admin = this.supabase.getAdminClient();

    const { data, error }: any = await admin
      .from('wallets')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []) as any[];
  }

  @Get('database-connection')
  @ApiOperation({ summary: 'Test database connection' })
  @ApiResponse({
    status: 200,
    description: 'Database connection status',
  })
  async testDatabaseConnection() {
    try {
      const admin = this.supabase.getAdminClient();

      // Simple query to test connection
      const { error }: any = await admin
        .from('users')
        .select('count')
        .limit(1)
        .single();

      if (error) {
        return {
          status: 'error',
          message: error.message,
          details: error,
        };
      }

      return {
        status: 'success',
        message: 'Database connection working',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
