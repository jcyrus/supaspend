import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Expense } from './expense.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

@Entity('users')
export class User {
  @ApiProperty({
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  @Column({ unique: true })
  username: string;

  @Column({ nullable: true, select: false })
  password_hash?: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
    nullable: true,
  })
  @Column({ nullable: true })
  display_name?: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  @Column({ nullable: true })
  avatar_url?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    default: UserRole.USER,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'ID of the user who created this user',
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  @Column({ nullable: true })
  created_by?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @OneToMany(() => User, (user) => user.creator)
  created_users?: User[];

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets?: Wallet[];

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses?: Expense[];

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
