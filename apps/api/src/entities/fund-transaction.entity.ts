import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  EXPENSE = 'expense',
  FUND_IN = 'fund_in',
  FUND_OUT = 'fund_out',
}

@Entity('fund_transactions')
export class FundTransaction {
  @ApiProperty({
    description: 'Fund transaction ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Wallet ID involved in the transaction',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Column()
  wallet_id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.fund_transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @ApiProperty({
    description: 'Admin user ID who performed the transaction',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Column()
  admin_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.FUND_IN,
  })
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transaction_type: TransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: 100,
  })
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Monthly allowance',
    nullable: true,
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Balance before transaction',
    example: 50,
  })
  @Column('decimal', { precision: 12, scale: 2 })
  balance_before: number;

  @ApiProperty({
    description: 'Balance after transaction',
    example: 150,
  })
  @Column('decimal', { precision: 12, scale: 2 })
  balance_after: number;

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
