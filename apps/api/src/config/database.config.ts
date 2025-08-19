import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Expense } from '../entities/expense.entity';
import { FundTransaction } from '../entities/fund-transaction.entity';
import { ExpenseEditHistory } from '../entities/expense-edit-history.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'supaspend',
  entities: [User, Wallet, Expense, FundTransaction, ExpenseEditHistory],
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  synchronize: true, // Force synchronize
  logging: true, // Force logging
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};
