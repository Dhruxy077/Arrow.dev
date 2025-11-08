# Quick Start Guide

## 🚀 Setup Environment Variables

### Step 1: Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project (or use existing)
2. Navigate to **Project Settings > API**
3. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)
   - **service_role key** (long string, keep this secret!)

### Step 2: Get OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up/login and navigate to **Keys**
3. Create a new API key and copy it

### Step 3: Configure Environment Variables

#### Client Configuration (`client/.env`)

Open `client/.env` and replace the placeholder values:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Server Configuration (`server/.env`)

Open `server/.env` and replace the placeholder values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENROUTER_API_KEY=sk-or-v1-xxxxx...
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 4: Set Up Supabase Database

1. In your Supabase project, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run it in the SQL Editor
4. This creates all necessary tables and policies

### Step 5: Start the Application

**Terminal 1 - Start Server:**
```bash
cd server
npm install  # if not already done
npm start
```

**Terminal 2 - Start Client:**
```bash
cd client
npm install  # if not already done
npm run dev
```

### Step 6: Access the App

Open [http://localhost:5173](http://localhost:5173) in your browser.

## ✅ Verification

After setting up, you should see:
- ✅ No Supabase warnings in the browser console
- ✅ Server running on port 5000
- ✅ Client running on port 5173
- ✅ Application loads without errors

## 🆘 Troubleshooting

### "Supabase environment variables are not set"
- Make sure you've created `client/.env` and `server/.env` files
- Verify the variable names are correct (must start with `VITE_` for client)
- Restart the dev server after changing .env files

### "supabaseUrl is required" error
- Check that `VITE_SUPABASE_URL` is set in `client/.env`
- Make sure there are no extra spaces or quotes around the values
- Restart the Vite dev server

### Database errors
- Make sure you've run the SQL schema in Supabase
- Verify your Supabase credentials are correct
- Check that RLS policies are enabled


