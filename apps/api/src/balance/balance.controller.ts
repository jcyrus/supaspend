import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * BalanceController
 *
 * Endpoints for user balance and transaction management.
 *
 * Example usage:
 *   curl -H "Authorization: Bearer <user_token>" "http://localhost:4444/balance"
 */
@ApiTags('Balance')
@Controller('balance')
@UseGuards(AuthGuard)
export class BalanceController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get user balance and recent transactions' })
  @ApiResponse({
    status: 200,
    description: 'Balance and transactions retrieved successfully',
  })
  async getBalance(@Req() req: any) {
    const admin = this.supabase.getAdminClient();

    try {
      // Get user balance
      const { data: balance, error: balanceError } = await admin.rpc(
        'get_user_balance',
        {
          target_user_id: req.user?.id as string,
        },
      );

      if (balanceError) {
        console.error('Error getting balance:', balanceError);
        return { error: balanceError.message };
      }

      // Get recent transaction history
      const { data: transactions, error: transactionsError } = await admin.rpc(
        'get_user_fund_transactions',
        {
          target_user_id: req.user?.id as string,
          limit_count: 10,
        },
      );

      if (transactionsError) {
        console.error('Error getting transactions:', transactionsError);
        return { error: transactionsError.message };
      }

      return {
        success: true,
        data: {
          balance: balance || 0,
          transactions: transactions || [],
        },
      };
    } catch (error) {
      console.error('Error getting user balance:', error);
      return { error: 'Internal server error' };
    }
  }
}
