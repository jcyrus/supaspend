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
import { Expense } from './expense.entity';
import { FundTransaction } from './fund-transaction.entity';

export enum CurrencyType {
  USD = 'USD',
  VND = 'VND',
  IDR = 'IDR',
  PHP = 'PHP',
}

@Entity('wallets')
export class Wallet {
  @ApiProperty({
    description: 'Wallet ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User ID who owns this wallet',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.wallets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Currency type',
    enum: CurrencyType,
    example: CurrencyType.USD,
  })
  @Column({
    type: 'enum',
    enum: CurrencyType,
  })
  currency: CurrencyType;

  @ApiProperty({
    description: 'Wallet name',
    example: 'Main Wallet',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Is this the default wallet for the currency',
    example: true,
  })
  @Column({ default: false })
  is_default: boolean;

  @OneToMany(() => Expense, (expense) => expense.wallet)
  expenses?: Expense[];

  @OneToMany(() => FundTransaction, (transaction) => transaction.wallet)
  fund_transactions?: FundTransaction[];

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
