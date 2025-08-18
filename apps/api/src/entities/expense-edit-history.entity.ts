import { ApiProperty } from '@nestjs/swagger';

export class ExpenseEditHistory {
  @ApiProperty({
    description: 'Edit history ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Expense ID that was edited',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  expense_id: string;

  @ApiProperty({
    description: 'User ID who made the edit',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  edited_by: string;

  @ApiProperty({
    description: 'Previous data before edit',
    example: { amount: 25.0, category: 'Food' },
  })
  previous_data: Record<string, any>;

  @ApiProperty({
    description: 'New data after edit',
    example: { amount: 30.0, category: 'Food' },
  })
  new_data: Record<string, any>;

  @ApiProperty({
    description: 'Timestamp when the edit was made',
    example: '2023-01-01T00:00:00.000Z',
  })
  edited_at: string;

  @ApiProperty({
    description: 'Reason for the edit',
    example: 'Corrected amount',
    nullable: true,
  })
  reason?: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: string;
}
