import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './user.entity';
import { Currency } from './wallet.entity';

export class WalletWithBalance {
  @ApiProperty({
    description: 'Wallet ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Wallet currency',
    enum: Currency,
    example: Currency.USD,
  })
  currency: Currency;

  @ApiProperty({
    description: 'Wallet name',
    example: 'My USD Wallet',
  })
  name: string;

  @ApiProperty({
    description: 'Whether this is the default wallet',
    example: true,
  })
  is_default: boolean;

  @ApiProperty({
    description: 'Current wallet balance',
    example: 150.5,
  })
  balance: number;
}

export class UserWithBalance {
  @ApiProperty({
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Total balance across all wallets',
    example: 300.75,
  })
  balance: number;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Array of user wallets with balances',
    type: [WalletWithBalance],
  })
  wallets: WalletWithBalance[];
}

export class AdminUserExpense {
  @ApiProperty({
    description: 'Expense ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  expense_id: string;

  @ApiProperty({
    description: 'User ID who made the expense',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'john@example.com',
  })
  user_email: string;

  @ApiProperty({
    description: 'Date of the expense',
    example: '2023-01-01',
  })
  date: string;

  @ApiProperty({
    description: 'Amount of the expense',
    example: 25.5,
  })
  amount: number;

  @ApiProperty({
    description: 'Category of the expense',
    example: 'Food',
  })
  category: string;

  @ApiProperty({
    description: 'Description of the expense',
    example: 'Lunch at restaurant',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Wallet ID used for the expense',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  wallet_id: string;

  @ApiProperty({
    description: 'Currency of the wallet',
    enum: Currency,
    example: Currency.USD,
  })
  currency: Currency;
}
