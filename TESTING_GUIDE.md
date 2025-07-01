# Supabase Authentication Testing Guide

## Quick Setup and Testing

### 1. First Run
When you start the app (`npm run dev`), you'll see the login screen.

### 2. Create Demo Accounts
Since this is a fresh Supabase setup, you need to create accounts first:

1. Click "Don't have an account? Sign up"
2. Create these demo accounts:
   - **Email:** `admin@example.com`
   - **Password:** `123456`
   - **Username:** `admin`

3. Create a second account:
   - **Email:** `user@example.com`
   - **Password:** `123456`
   - **Username:** `user`

### 3. Login Testing
After creating accounts:
1. Switch back to login mode
2. Use the "Admin Demo" or "User Demo" buttons to auto-fill
3. Click "Sign In"

### 4. Features to Test
- ✅ Session persistence (restart the app, stay logged in)
- ✅ Role assignment (admin@ emails get admin role)
- ✅ User profile dropdown
- ✅ Logout functionality
- ✅ Route protection (try accessing routes without login)

### 5. Supabase Dashboard
Check your [Supabase Dashboard](https://tagelcmwqukvhyvocfpb.supabase.co) to see:
- Registered users
- Authentication logs
- Session management

## Common Issues & Solutions

### Email Confirmation
If Supabase requires email confirmation:
1. Go to Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations" for testing
3. Or check your email for confirmation links

### Password Requirements
Default Supabase password requirements:
- Minimum 6 characters
- The demo uses `123456` which meets this requirement

### Network Issues
If authentication fails:
1. Check internet connection
2. Verify Supabase project URL and API key
3. Check browser console for errors

## Production Notes

For production deployment:
1. Enable email confirmation
2. Set up custom email templates
3. Configure password requirements
4. Set up Row Level Security (RLS)
5. Add proper error logging
6. Implement password reset flow

## Next Steps

1. **Test the basic flow** with the demo accounts
2. **Explore Supabase dashboard** to see user data
3. **Customize roles** in `AuthContext.tsx`
4. **Add more features** like profile management
5. **Set up email verification** in production
