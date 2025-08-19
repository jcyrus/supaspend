import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { CurrencyType } from '../entities/wallet.entity';

/**
 * WalletsController
 *
 * Endpoints for wallet management.
 *
 * Example usage:
 *   # Get wallets for a user
 *   curl -H "Authorization: Bearer <admin_token>" "http://localhost:4444/admin/wallets?userId=<user_id>"
 *
 *   # Create a wallet
 *   curl -X POST -H "Authorization: Bearer <admin_token>" -H "Content-Type: application/json" \
 *     -d '{"user_id":"<user_id>","currency":"USD","name":"My USD Wallet"}' \
 *     http://localhost:4444/admin/wallets
 */
@ApiTags('Admin Wallets')
@Controller('admin/wallets')
@UseGuards(AuthGuard, RolesGuard)
export class WalletsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get wallets for a user' })
  @ApiResponse({
    status: 200,
    description: 'Wallets retrieved successfully',
  })
  async getWallets(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId parameter is required' };
    }

    const admin = this.supabase.getAdminClient();

    try {
      // Get user wallets with balances
      const { data: wallets, error } = await admin
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        return { error: 'Failed to fetch wallets: ' + error.message };
      }

      // Calculate balances for each wallet
      const walletsWithBalances: any[] = [];
      for (const wallet of wallets || []) {
        try {
          const { data: balance, error: balanceError } = await admin.rpc(
            'get_wallet_balance',
            { target_wallet_id: wallet.id },
          );

          walletsWithBalances.push({
            ...wallet,
            balance: balanceError ? 0 : Number(balance || 0),
          });
        } catch {
          walletsWithBalances.push({
            ...wallet,
            balance: 0,
          });
        }
      }

      return {
        success: true,
        data: { wallets: walletsWithBalances },
      };
    } catch (error) {
      console.error('Error fetching wallets:', error);
      return { error: 'Failed to fetch wallets' };
    }
  }

  @Post()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiResponse({
    status: 201,
    description: 'Wallet created successfully',
  })
  async createWallet(@Body() createWalletDto: any) {
    const admin = this.supabase.getAdminClient();

    try {
      // Validate currency
      if (
        !Object.values(CurrencyType).includes(
          createWalletDto.currency as CurrencyType,
        )
      ) {
        return {
          error: 'Invalid currency. Must be USD, VND, IDR, or PHP',
        };
      }

      // Use the admin_create_wallet function
      const { data: wallet, error } = await admin.rpc('admin_create_wallet', {
        p_user_id: createWalletDto.user_id,
        p_currency: createWalletDto.currency,
        p_name: createWalletDto.name,
        p_is_default: createWalletDto.is_default || false,
      });

      if (error) {
        return { error: 'Failed to create wallet: ' + error.message };
      }

      return {
        success: true,
        data: {
          message: 'Wallet created successfully',
          wallet,
        },
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      return { error: 'Failed to create wallet' };
    }
  }

  @Put()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update wallet or set default' })
  @ApiResponse({
    status: 200,
    description: 'Wallet updated successfully',
  })
  async updateWallet(@Body() body: any) {
    const admin = this.supabase.getAdminClient();

    try {
      const { walletId, action, userId, name } = body;

      if (!walletId) {
        return { error: 'walletId is required' };
      }

      if (action === 'setDefault') {
        if (!userId) {
          return { error: 'userId is required for setDefault action' };
        }

        // First, set all wallets for this user to not default
        await admin
          .from('wallets')
          .update({ is_default: false })
          .eq('user_id', userId);

        // Then set the specified wallet as default
        const { error } = await admin
          .from('wallets')
          .update({ is_default: true })
          .eq('id', walletId)
          .eq('user_id', userId);

        if (error) {
          return { error: 'Failed to set default wallet: ' + error.message };
        }

        return {
          success: true,
          data: { message: 'Default wallet updated' },
        };
      } else if (action === 'update') {
        if (!name) {
          return { error: 'name is required for update action' };
        }

        const { data: wallet, error } = await admin
          .from('wallets')
          .update({ name })
          .eq('id', walletId)
          .select()
          .single();

        if (error) {
          return { error: 'Failed to update wallet: ' + error.message };
        }

        return {
          success: true,
          data: { message: 'Wallet updated', wallet },
        };
      } else {
        return {
          error: "Invalid action. Must be 'setDefault' or 'update'",
        };
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      return { error: 'Failed to update wallet' };
    }
  }

  @Delete()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Delete a wallet' })
  @ApiResponse({
    status: 200,
    description: 'Wallet deleted successfully',
  })
  async deleteWallet(@Query('walletId') walletId: string) {
    if (!walletId) {
      return { error: 'walletId parameter is required' };
    }

    const admin = this.supabase.getAdminClient();

    try {
      // Check if wallet exists and get its details
      const { data: wallet, error: fetchError } = await admin
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (fetchError || !wallet) {
        return { error: 'Wallet not found' };
      }

      // Don't allow deletion of default wallet if user has other wallets
      if (wallet.is_default) {
        const { data: otherWallets, error: countError } = await admin
          .from('wallets')
          .select('id')
          .eq('user_id', wallet.user_id)
          .neq('id', walletId);

        if (!countError && otherWallets && otherWallets.length > 0) {
          return {
            error:
              'Cannot delete default wallet. Set another wallet as default first.',
          };
        }
      }

      const { error } = await admin.from('wallets').delete().eq('id', walletId);

      if (error) {
        return { error: 'Failed to delete wallet: ' + error.message };
      }

      return {
        success: true,
        data: { message: 'Wallet deleted successfully' },
      };
    } catch (error) {
      console.error('Error deleting wallet:', error);
      return { error: 'Failed to delete wallet' };
    }
  }
}
