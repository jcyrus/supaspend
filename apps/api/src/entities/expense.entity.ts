import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Wallet } from './wallet.entity';
import { ExpenseEditHistory } from './expense-edit-history.entity';

@Entity('expenses')
export class Expense {
  @ApiProperty({
    description: 'Expense ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User ID who made this expense',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.expenses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Wallet ID from which the expense was made',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Column()
  wallet_id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.expenses)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @ApiProperty({
    description: 'Date of the expense',
    example: '2023-01-01',
  })
  @Column('date')
  date: string;

  @ApiProperty({
    description: 'Amount of the expense',
    example: 25.5,
  })
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Category of the expense',
    example: 'Food',
  })
  @Column()
  category: string;

  @ApiProperty({
    description: 'Description of the expense',
    example: 'Lunch at restaurant',
    nullable: true,
  })
  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => ExpenseEditHistory, (history) => history.expense)
  edit_history?: ExpenseEditHistory[];

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn()
  updated_at: Date;
}
