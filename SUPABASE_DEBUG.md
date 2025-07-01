# Supabase 400 Error Troubleshooting Guide

## 🔍 **Diagnosing the 400 Bad Request Error**

The error `POST https://tagelcmwqukvhyvocfpb.supabase.co/auth/v1/signup 400 (Bad Request)` typically indicates a Supabase configuration issue.

## 🔧 **Solutions to Try**

### **1. Check Supabase Authentication Settings**

Go to your [Supabase Dashboard](https://tagelcmwqukvhyvocfpb.supabase.co/project/tagelcmwqukvhyvocfpb/auth/settings):

1. **Authentication → Settings**
2. **Check these settings:**
   - ✅ **Enable email confirmations:** Should be **DISABLED** for testing
   - ✅ **Enable phone confirmations:** Should be **DISABLED** for testing  
   - ✅ **Double confirm email changes:** Should be **DISABLED** for testing
   - ✅ **Enable secure email change:** Should be **DISABLED** for testing

### **2. Check User Management Settings**

In **Authentication → Settings → User Management:**
- ✅ **Allow new users to sign up:** Should be **ENABLED**
- ✅ **Minimum password length:** Should be **6** or less (our demo uses 6 chars)

### **3. Check Site URL Configuration**

In **Authentication → URL Configuration:**
- **Site URL:** Add `http://localhost:4928` (your dev server)
- **Redirect URLs:** Add `http://localhost:4928` 

### **4. Verify API Keys**

In **Settings → API:**
- Make sure you're using the **anon/public** key (not the service_role key)
- Current key in use: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **5. Test with Simpler Signup**

Let's try a minimal signup to isolate the issue.

## 🧪 **Quick Test Steps**

1. **Disable Email Confirmation:**
   - Go to Supabase Dashboard → Auth → Settings
   - Turn OFF "Enable email confirmations"
   - Save changes

2. **Try Manual Test:**
   - Use a simple email like `test@test.com`
   - Use password `123456`
   - Try signup

3. **Check Network Tab:**
   - Open Chrome DevTools → Network
   - Try signup and see the full request/response

## 🔄 **Alternative: Test with Direct Supabase**

If the above doesn't work, let's test the Supabase connection directly by creating a simple test component.

Would you like me to:
1. ❓ Create a debug component to test Supabase directly?
2. ❓ Update the signup to handle specific error codes?
3. ❓ Add more detailed error logging?

## 📝 **Most Common Causes**

1. **Email confirmation enabled** (most common)
2. **Site URL not configured**
3. **New user signup disabled** 
4. **Password requirements not met**
5. **Project URL or API key incorrect**

Try disabling email confirmations first - that's usually the culprit! 🎯
