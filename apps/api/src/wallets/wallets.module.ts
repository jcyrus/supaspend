import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [WalletsController],
  providers: [SupabaseService],
})
export class WalletsModule {}
