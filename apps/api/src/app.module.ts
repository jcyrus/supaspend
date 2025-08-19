import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { ProfileModule } from './profile/profile.module';
import { AdminModule } from './admin/admin.module';
import { BalanceModule } from './balance/balance.module';
import { WalletsModule } from './wallets/wallets.module';
import { TestModule } from './test/test.module';
import { AuthModule } from './auth/auth.module';
import { typeOrmConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    HealthModule,
    AuthModule,
    ProfileModule,
    AdminModule,
    BalanceModule,
    WalletsModule,
    TestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
