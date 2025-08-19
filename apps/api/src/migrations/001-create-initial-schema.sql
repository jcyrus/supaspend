-- Create enums
CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE currency_type_enum AS ENUM ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW', 'BRL', 'ZAR', 'RUB', 'MXN', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP', 'PHP', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'ETB', 'KES', 'UGX', 'TZS', 'RWF', 'GHS', 'NGN', 'XOF', 'XAF', 'CDF', 'AOA', 'ZMW', 'BWP', 'SZL', 'LSL', 'NAD', 'MZN', 'MGA', 'KMF', 'SCR', 'MUR', 'MVR', 'LKR', 'PKR', 'BDT', 'NPR', 'BTN', 'AFN', 'IRR', 'IQD', 'SYP', 'YER', 'AZN', 'GEL', 'AMD', 'TMT', 'UZS', 'KGS', 'TJS', 'KZT', 'MNT', 'LAK', 'KHR', 'VND', 'THB', 'MYR', 'IDR', 'BND', 'MMK', 'PGK', 'FJD', 'SBD', 'VUV', 'WST', 'TOP', 'NZD', 'TVD', 'AUD');
CREATE TYPE transaction_type_enum AS ENUM ('deposit', 'withdrawal', 'transfer');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url VARCHAR(255),
    role user_role_enum NOT NULL DEFAULT 'user',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    currency currency_type_enum NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Create fund_transactions table
CREATE TABLE fund_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID,
    to_user_id UUID NOT NULL,
    from_wallet_id UUID,
    to_wallet_id UUID NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type transaction_type_enum NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (from_wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)
);

-- Create expense_edit_history table
CREATE TABLE expense_edit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL,
    old_amount DECIMAL(15,2),
    new_amount DECIMAL(15,2),
    old_description TEXT,
    new_description TEXT,
    old_category VARCHAR(100),
    new_category VARCHAR(100),
    old_date DATE,
    new_date DATE,
    edited_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_currency ON wallets(currency);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_wallet_id ON expenses(wallet_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_fund_transactions_from_user ON fund_transactions(from_user_id);
CREATE INDEX idx_fund_transactions_to_user ON fund_transactions(to_user_id);
CREATE INDEX idx_expense_edit_history_expense_id ON expense_edit_history(expense_id);
