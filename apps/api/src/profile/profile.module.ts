import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [ProfileController],
  providers: [SupabaseService],
})
export class ProfileModule {}
