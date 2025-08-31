# 🚀 Pitch Up - Quick Setup Guide

## Prerequisites
- Node.js installed
- Supabase account (free at https://supabase.com)

## Step 1: Set Up Supabase (5 minutes)

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub or email
4. Click "New Project"
5. Fill in:
   - Name: `pitch-up`
   - Database Password: **SAVE THIS!**
   - Region: Choose closest to you
6. Click "Create new project"

### 1.2 Get Your API Keys
1. Go to Settings (gear icon) → API
2. Copy these values:
   - Project URL: `https://xxxxx.supabase.co`
   - anon public key: `eyJhbGc...`

### 1.3 Set Up Database
1. Click "SQL Editor" in left sidebar
2. Run each SQL file in order:
   - Copy contents of `supabase/01_create_tables.sql`
   - Paste in SQL Editor
   - Click "Run"
   - Repeat for `02_row_level_security.sql`
   - Repeat for `03_storage_setup.sql`

## Step 2: Configure the App (2 minutes)

### 2.1 Create Environment File
1. In the `pitch-up` folder, create a file named `.env`
2. Add your Supabase credentials:
```
REACT_APP_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```
3. Replace with your actual values from Step 1.2

### 2.2 Install Dependencies
```bash
npm install
```

## Step 3: Run the App (1 minute)

```bash
npm start
```

The app will open at http://localhost:3000

## Step 4: Test It Out!

### 4.1 Create an Account
1. Click "Sign Up"
2. Enter email and password
3. Check your email for confirmation link
4. Click the link to confirm

### 4.2 Sign In
1. Use your email and password
2. You're now in the app!

### 4.3 Test Recording (Debug Mode)
1. Press `Ctrl+Shift+D` to open debug panel
2. Click "Trigger Notification"
3. Click "Record Your Pitch"
4. Allow microphone access
5. Record a short audio message
6. Click "Post Pitch"

## Troubleshooting

### "Invalid API Key"
- Double-check you copied the correct key
- Make sure it's the `anon` key, not `service` key
- Restart the app after adding .env file

### "User already exists"
- Check your email for confirmation
- Or try signing in instead

### Can't record audio
- Make sure browser has microphone permission
- Try Chrome or Firefox

### Database errors
- Make sure you ran all 3 SQL files
- Check tables exist in Supabase Table Editor

## What's Working Now

✅ User authentication (sign up/sign in/sign out)
✅ Protected routes (must be logged in)
✅ Audio recording interface
✅ Debug panel for testing
✅ Database ready for storing pitches
✅ Row Level Security enabled

## Next Steps

To make the app fully functional, you'll want to:
1. Connect audio recording to save in Supabase storage
2. Load and display pitches in the feed
3. Add friend connections
4. Set up real notification scheduling

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check the `SUPABASE_AUTH_GUIDE.md` for detailed explanations