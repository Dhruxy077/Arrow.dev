# Supabase Setup Guide

This guide will help you set up Supabase for Arrow.dev.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project

## Setup Steps

### 1. Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Arrow.dev (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be created (takes ~2 minutes)

### 2. Run the Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the entire contents of `supabase/schema.sql`
5. Paste it into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. Wait for all queries to complete successfully

### 3. Get Your API Keys

1. In your Supabase project dashboard, click on "Settings" (gear icon)
2. Click on "API" in the left sidebar
3. You'll see:
   - **Project URL**: Copy this (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**: Copy this (starts with `eyJ...`)

### 4. Configure Environment Variables

1. In the `client/` directory, create a `.env` file (if it doesn't exist)
2. Add the following variables:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from step 3.

### 5. Enable Email Authentication (Optional)

If you want users to sign up with email:

1. Go to "Authentication" → "Providers" in your Supabase dashboard
2. Enable "Email" provider
3. Configure email templates if desired

### 6. Test the Setup

1. Start your development server
2. Try to create a project
3. Check the browser console for any Supabase-related errors
4. Check your Supabase dashboard → "Table Editor" → "projects" to see if data is being saved

## Row Level Security (RLS)

The schema includes comprehensive RLS policies:

- **Users**: Can only view/update their own profile
- **Projects**: Users can only access their own projects (unless public)
- **Chat Messages**: Users can only view messages for their own projects
- **Shared Projects**: Anyone can view shared projects by token

## Troubleshooting

### "Supabase environment variables are not set"

- Make sure your `.env` file is in the `client/` directory
- Restart your development server after adding environment variables
- Check that variable names start with `VITE_`

### "User must be authenticated to create projects"

- Make sure authentication is enabled in Supabase
- Check that the user is signed in
- Verify RLS policies are correctly set up

### "Failed to create project"

- Check the browser console for detailed error messages
- Verify your Supabase project is active
- Ensure the schema has been run successfully

## Additional Configuration

### Enable Storage (Optional)

If you want to store files/images:

1. Go to "Storage" in Supabase dashboard
2. Create a new bucket (e.g., "project-assets")
3. Set up RLS policies for the bucket

### Enable Realtime (Optional)

Realtime subscriptions are already configured in the code. To enable:

1. Go to "Database" → "Replication" in Supabase dashboard
2. Enable replication for the `projects` table

## Security Notes

- Never commit your `.env` file to version control
- The `anon` key is safe to use in client-side code (it's protected by RLS)
- For server-side operations, use the `service_role` key (keep it secret!)

