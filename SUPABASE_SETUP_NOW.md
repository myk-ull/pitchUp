# ✅ Your Supabase is Connected! 

## Next Steps - Set Up Your Database (5 minutes)

Your app is now connected to Supabase! Here's what to do next:

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/vnpthgebmzywkvnljmts

### Step 2: Run the Database Setup
1. Click **"SQL Editor"** in the left sidebar (looks like `< >`
2. Click **"New Query"** button (green button)
3. Copy ALL the text from the file `supabase/01_create_tables.sql`
4. Paste it in the SQL Editor
5. Click **"Run"** button (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 3: Set Up Security
1. Still in SQL Editor, click **"New Query"** again
2. Copy ALL the text from `supabase/02_row_level_security.sql`
3. Paste and click **"Run"**
4. You should see "Success. No rows returned"

### Step 4: Set Up Storage
1. Click **"New Query"** one more time
2. Copy ALL text from `supabase/03_storage_setup.sql`
3. Paste and click **"Run"**
4. You should see "Success. No rows returned"

### Step 5: Fix Profile Creation (Important!)
1. Click **"New Query"** again
2. Copy ALL text from `supabase/04_fix_profiles.sql`
3. Paste and click **"Run"**
4. This ensures all users get proper profiles for the friends system

### Step 6: Verify Everything Worked
1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - profiles
   - pitches
   - friendships
   - reactions

### Step 7: Test Your App!
1. Go to http://localhost:3001
2. Click "Sign Up"
3. Enter:
   - Email: any email (can be fake like test@test.com)
   - Password: at least 6 characters
4. Click Sign Up
5. You'll see "Check your email" message (but for testing, just sign in)
6. Click "Sign In" and use same email/password
7. You're in! 🎉

### Troubleshooting

**If you see "Invalid API Key":**
- The app hasn't restarted yet. Wait 10 seconds and refresh

**If sign up says "User already exists":**
- Just sign in with those credentials instead

**If SQL gives errors:**
- Make sure you copied the ENTIRE file contents
- Run them in order (01 first, then 02, then 03)

---

## 🎊 Success Check

You know it's working when:
- ✅ You can sign up with a new email
- ✅ You can sign in 
- ✅ You see "Pitch Up" main screen after login
- ✅ You can press Ctrl+Shift+D to see debug panel
- ✅ Sign out button (logout icon) works

## Your App is Running At:
http://localhost:3001

## Your Supabase Dashboard:
https://supabase.com/dashboard/project/vnpthgebmzywkvnljmts