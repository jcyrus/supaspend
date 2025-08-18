import { ApiProperty } from '@nestjs/swagger';

export class Expense {
  @ApiProperty({
    description: 'Expense ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who made this expense',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Wallet ID from which the expense was made',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  wallet_id: string;

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
    description: 'Updated at timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at: string;
}
