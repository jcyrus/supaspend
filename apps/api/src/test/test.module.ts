import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [TestController],
})
export class TestModule {}
