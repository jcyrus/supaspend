import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UserWithBalance } from '../entities';

/**
 * AdminUsersController
 *
 * Endpoints for admin/superadmin user management.
 *
 * All endpoints require a Bearer token in the Authorization header.
 *
 * Example usage:
 *
 *   # Create user (admin/superadmin only)
 *   curl -X POST -H "Authorization: Bearer <admin_token>" -H "Content-Type: application/json" \
 *     -d '{"email":"user@example.com","password":"secret123","username":"user1","role":"user","currency":"USD"}' \
 *     http://localhost:4444/admin/users
 *
 *   # Delete user (superadmin only)
 *   curl -X DELETE -H "Authorization: Bearer <superadmin_token>" http://localhost:4444/admin/users/<user_id>
 *
 *   # Get emails for user IDs (admin/superadmin only)
 *   curl -H "Authorization: Bearer <admin_token>" "http://localhost:4444/admin/users/emails?userIds=<id1>,<id2>"
 *
 *   # Get users with balances (admin/superadmin only)
 *   curl -H "Authorization: Bearer <admin_token>" "http://localhost:4444/admin/users-with-balances"
 */
@ApiTags('Admin Users')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post('users')
  @Roles('admin', 'superadmin')
  async createUser(@Req() req: any, @Body() body: CreateAdminUserDto) {
    const admin = this.supabase.getAdminClient();
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { username: body.username },
      });
    if (authError || !authData.user) {
      return { error: authError?.message || 'Failed to create user' };
    }
    await new Promise((r) => setTimeout(r, 800));
    const { error: upsertError } = await admin.from('users').upsert(
      {
        id: authData.user.id,
        username: body.username,
        role: body.role,
        created_by: req.user?.id as string,
      },
      { onConflict: 'id' },
    );
    if (upsertError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: 'Profile update failed: ' + upsertError.message };
    }
    try {
      const { error: walletError } = await admin.rpc('admin_create_wallet', {
        p_user_id: authData.user.id,
        p_currency: body.currency,
        p_name: body.walletName || `${body.currency} Wallet`,
        p_is_default: true,
      });
      if (walletError) throw new Error(walletError.message);
    } catch (e) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: 'Failed to create wallet: ' + (e as Error).message };
    }
    return {
      message: `User ${body.email} created successfully with ${body.currency} wallet`,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: body.username,
        role: body.role,
        currency: body.currency,
        walletName: body.walletName || `${body.currency} Wallet`,
      },
    };
  }

  @Delete('users/:id')
  @Roles('superadmin')
  async deleteUser(@Param('id') id: string) {
    const admin = this.supabase.getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return { error: error.message };
    return { message: 'User deleted successfully' };
  }

  @Get('users/emails')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get user emails by IDs' })
  @ApiResponse({
    status: 200,
    description: 'User emails retrieved successfully',
  })
  async getEmails(@Query('userIds') userIds?: string) {
    if (!userIds) return { error: 'User IDs are required' };
    const admin = this.supabase.getAdminClient();
    const emails: Record<string, string> = {};
    for (const id of userIds.split(',')) {
      try {
        const { data } = await admin.auth.admin.getUserById(id);
        if (data.user?.email) emails[id] = data.user.email;
        else emails[id] = 'Email not available';
      } catch {
        emails[id] = 'Email not available';
      }
    }
    return { emails };
  }

  @Get('users-with-balances')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get all users with their wallet balances' })
  @ApiResponse({
    status: 200,
    description: 'Users with balances retrieved successfully',
    type: [UserWithBalance],
  })
  async getUsersWithBalances(@Req() req: any) {
    const admin = this.supabase.getAdminClient();

    try {
      // Get users created by this admin (or all if superadmin)
      const { data: userData, error: userError } = await admin
        .from('users')
        .select(
          `
          id,
          username,
          role,
          created_at,
          wallets (
            id,
            currency,
            name,
            is_default,
            created_at
          )
        `,
        )
        .eq('created_by', req.user?.id);

      if (userError) {
        return { error: 'Failed to fetch users: ' + userError.message };
      }

      const usersWithBalances: UserWithBalance[] = [];

      for (const user of userData || []) {
        // Get email from auth.users
        let email = 'Loading...';
        try {
          const { data: authData } = await admin.auth.admin.getUserById(
            user.id,
          );
          email = authData.user?.email || 'Email not available';
        } catch {
          email = 'Email not available';
        }

        // Calculate wallet balances using get_wallet_balance function
        const walletsWithBalance: any[] = [];
        let totalBalance = 0;

        for (const wallet of user.wallets || []) {
          try {
            const { data: balanceData, error: balanceError } = await admin.rpc(
              'get_wallet_balance',
              { target_wallet_id: wallet.id },
            );

            const balance = balanceError ? 0 : balanceData || 0;
            walletsWithBalance.push({
              id: wallet.id,
              currency: wallet.currency,
              name: wallet.name,
              is_default: wallet.is_default,
              balance: Number(balance),
            });
            totalBalance += Number(balance);
          } catch {
            walletsWithBalance.push({
              id: wallet.id,
              currency: wallet.currency,
              name: wallet.name,
              is_default: wallet.is_default,
              balance: 0,
            });
          }
        }

        usersWithBalances.push({
          user_id: user.id,
          username: user.username,
          role: user.role,
          balance: totalBalance,
          email,
          created_at: user.created_at,
          wallets: walletsWithBalance,
        });
      }

      return {
        success: true,
        data: {
          users: usersWithBalances,
        },
      };
    } catch (error) {
      console.error('Error fetching users with balances:', error);
      return {
        success: false,
        error: 'Failed to fetch users with balances',
      };
    }
  }
}
