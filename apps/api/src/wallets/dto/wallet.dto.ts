import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { CurrencyType } from '../../entities/wallet.entity';

export class CreateWalletDto {
  @ApiProperty({
    description: 'User ID who will own this wallet',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: 'Wallet currency',
    enum: CurrencyType,
    example: CurrencyType.USD,
  })
  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @ApiProperty({
    description: 'Wallet name',
    example: 'My USD Wallet',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Whether this should be the default wallet',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateWalletDto {
  @ApiProperty({
    description: 'Wallet ID to update',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  walletId: string;

  @ApiProperty({
    description: 'Action to perform',
    enum: ['update', 'setDefault'],
    example: 'update',
  })
  @IsString()
  action: 'update' | 'setDefault';

  @ApiProperty({
    description: 'New wallet name (required for update action)',
    example: 'Updated Wallet Name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'User ID (required for setDefault action)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class SetDefaultWalletDto {
  @ApiProperty({
    description: 'Wallet ID to set as default',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  walletId: string;

  @ApiProperty({
    description: 'Action to perform',
    enum: ['setDefault'],
    example: 'setDefault',
  })
  @IsString()
  action: 'setDefault';

  @ApiProperty({
    description: 'User ID who owns the wallet',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  userId: string;
}
