# Database Setup

This directory contains all database-related files for SupaSpend.

## Files

### `DATABASE_SETUP.sql`

Complete database schema and setup script for production deployment.

- All tables, enums, and indexes
- Security functions with RLS policies
- User management triggers
- Wallet creation functions
- Transaction management

### `validate_database_setup.sql`

Validation script to test database setup completion.

- Table existence checks
- Function availability tests
- Trigger functionality verification
- RLS policy validation
- Sample data insertion tests

## Usage

### New Database Setup

```bash
# Using Supabase CLI (recommended)
supabase db reset

# Or directly with psql
psql -h your-db-host -U postgres -d your-database -f database/DATABASE_SETUP.sql
```

### Validate Setup

```bash
psql -h your-db-host -U postgres -d your-database -f database/validate_database_setup.sql
```

## Development vs Production

- **Development**: Use Supabase CLI migrations in `supabase/migrations/`
- **Production**: Use the consolidated `DATABASE_SETUP.sql` script

## Migration Strategy

1. **Development**: Make changes via Supabase CLI
2. **Export Changes**: Export incremental changes
3. **Update Setup Script**: Consolidate into `DATABASE_SETUP.sql`
4. **Production Deploy**: Apply via Supabase Dashboard SQL Editor
