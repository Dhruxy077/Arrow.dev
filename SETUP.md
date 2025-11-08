# Arrow.dev Setup Guide

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- An OpenRouter API key (free tier available)

## Step 1: Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep this secret!)

4. Go to SQL Editor and run the schema from `supabase/schema.sql`

## Step 2: Environment Variables

### Client Setup

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Server Setup

Create `server/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Step 3: Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

## Step 4: Run the Application

### Terminal 1 - Server
```bash
cd server
npm start
```

### Terminal 2 - Client
```bash
cd client
npm run dev
```

## Step 5: Access the Application

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

✅ AI-Powered Code Generation
✅ In-Browser Development Environment (WebContainer)
✅ Multi-file Code Editor with Syntax Highlighting
✅ Live Preview with Hot Reload
✅ Terminal Support
✅ Chat Interface with History
✅ Project Management (Save/Load/Fork/Share)
✅ Supabase Authentication
✅ Real-time Collaboration (coming soon)
✅ Project Export as ZIP

## Troubleshooting

### WebContainer not initializing
- Ensure you're using a modern browser (Chrome/Edge recommended)
- Check browser console for errors
- Try refreshing the page

### Supabase connection issues
- Verify your environment variables are set correctly
- Check that the schema has been run in Supabase SQL Editor
- Ensure RLS policies are enabled

### AI generation not working
- Verify your OpenRouter API key is set
- Check server logs for API errors
- Some free models may have rate limits

## Production Deployment

1. Build the client:
```bash
cd client
npm run build
```

2. Set production environment variables
3. Deploy server to a hosting service (Railway, Render, etc.)
4. Deploy client build to Vercel, Netlify, or similar
5. Update CORS settings in server for production domain

