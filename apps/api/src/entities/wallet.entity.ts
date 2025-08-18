import { ApiProperty } from '@nestjs/swagger';

export enum Currency {
  USD = 'USD',
  VND = 'VND',
  IDR = 'IDR',
  PHP = 'PHP',
}

export class Wallet {
  @ApiProperty({
    description: 'Wallet ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns this wallet',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  user_id: string;

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
    description: 'Whether this is the default wallet for the user',
    example: true,
  })
  is_default: boolean;

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
