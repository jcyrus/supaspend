import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
  FUND_IN = 'fund_in',
  FUND_OUT = 'fund_out',
  EXPENSE = 'expense',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export class FundTransaction {
  @ApiProperty({
    description: 'Transaction ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID for this transaction',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Wallet ID for this transaction',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  wallet_id: string;

  @ApiProperty({
    description: 'Admin ID who performed this transaction',
    example: '550e8400-e29b-41d4-a716-446655440003',
    nullable: true,
  })
  admin_id?: string;

  @ApiProperty({
    description: 'Type of transaction',
    enum: TransactionType,
    example: TransactionType.FUND_IN,
  })
  transaction_type: TransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: 100.0,
  })
  amount: number;

  @ApiProperty({
    description: 'Balance before this transaction',
    example: 50.0,
  })
  previous_balance: number;

  @ApiProperty({
    description: 'Balance after this transaction',
    example: 150.0,
  })
  new_balance: number;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Monthly allowance',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Related expense ID if this is an expense transaction',
    example: '550e8400-e29b-41d4-a716-446655440004',
    nullable: true,
  })
  expense_id?: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: string;
}
