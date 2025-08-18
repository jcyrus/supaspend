import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { SupabaseService } from '../supabase/supabase.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [AdminUsersController],
  providers: [SupabaseService, RolesGuard],
})
export class AdminModule {}
