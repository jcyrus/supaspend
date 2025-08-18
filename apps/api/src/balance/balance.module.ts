import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [BalanceController],
  providers: [SupabaseService],
})
export class BalanceModule {}
