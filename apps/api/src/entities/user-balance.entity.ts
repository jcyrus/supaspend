import { ApiProperty } from '@nestjs/swagger';

export class UserBalance {
  @ApiProperty({
    description: 'Balance ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID for this balance',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Wallet ID for this balance',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  wallet_id: string;

  @ApiProperty({
    description: 'Current balance amount',
    example: 150.0,
  })
  balance: number;

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
