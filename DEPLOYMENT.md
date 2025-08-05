# DEPLOYMENT CHECKLIST

## Before Deployment

### 1. Database Setup ✅

- [ ] Run `COMPLETE_SETUP.sql` in Supabase SQL Editor
- [ ] Verify no errors in SQL execution
- [ ] Create first admin account

### 2. Environment Variables ✅

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Build Verification ✅

- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] No linting errors

### 4. Features Testing ✅

- [ ] Login/logout works
- [ ] Admin can create users
- [ ] User management page accessible to admins
- [ ] Reports show admin view toggle
- [ ] Navigation shows admin items for admins

## Post-Deployment

### 1. Admin Setup

```sql
-- Promote first user to admin
SELECT public.change_user_role('your-email@example.com', 'admin');

-- Verify setup
SELECT * FROM public.get_user_info('your-email@example.com');
```

### 2. Test Admin Features

- [ ] Create a test user as admin
- [ ] Verify user appears in "Manage Users"
- [ ] Check admin reports show user data
- [ ] Test CSV export includes user info

### 3. Security Verification

- [ ] Regular users cannot access admin pages
- [ ] Users only see their own data
- [ ] Admins only see their created users
- [ ] RLS policies working correctly

## Troubleshooting

### Common Issues

1. **Build Errors**: Check for TypeScript/ESLint issues
2. **Auth Errors**: Verify Supabase environment variables
3. **Profile Errors**: Auto-creation should handle missing profiles
4. **Permission Errors**: Ensure `COMPLETE_SETUP.sql` ran completely

### Debug Commands

```sql
-- Check user exists
SELECT * FROM auth.users WHERE email = 'your-email@example.com';

-- Check profile exists
SELECT * FROM public.users WHERE id = 'user-id';

-- Test admin functions
SELECT * FROM public.get_admin_users('admin-user-id');
```

## Handover Notes

### For New Developers

1. **Single Migration**: Only run `COMPLETE_SETUP.sql` - it contains everything
2. **Authentication-Only**: Platform accessible only by authenticated users
3. **Admin Features**: Navigation dynamically shows admin items
4. **Role Management**: Use `change_user_role()` function for promotions

### Key Files

- `COMPLETE_SETUP.sql`: Complete database setup
- `src/lib/auth-utils.ts`: Enhanced auth with auto-profile creation
- `src/components/AuthGuard.tsx`: Authentication protection
- `src/app/admin/users/page.tsx`: Admin-only user creation interface

### Architecture Decisions

- **RLS Policies**: Ensure data isolation between users/admins
- **Auto-Profile Creation**: Prevents "user not found" errors
- **Admin Tracking**: `created_by` field tracks admin relationships
- **Role Hierarchy**: user < admin < superadmin
