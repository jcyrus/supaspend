import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Expense } from './expense.entity';

@Entity('expense_edit_history')
export class ExpenseEditHistory {
  @ApiProperty({
    description: 'Edit history ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Expense ID that was edited',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Column()
  expense_id: string;

  @ManyToOne(() => Expense, (expense) => expense.edit_history)
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @ApiProperty({
    description: 'User ID who made the edit',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Column()
  edited_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'edited_by' })
  editor: User;

  @ApiProperty({
    description: 'Previous data before edit',
    example: { amount: 25.0, category: 'Food' },
  })
  @Column('jsonb')
  previous_data: Record<string, any>;

  @ApiProperty({
    description: 'New data after edit',
    example: { amount: 30.0, category: 'Food' },
  })
  @Column('jsonb')
  new_data: Record<string, any>;

  @ApiProperty({
    description: 'Reason for the edit',
    example: 'Corrected amount',
    nullable: true,
  })
  @Column({ nullable: true })
  reason?: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @CreateDateColumn()
  created_at: Date;
}
