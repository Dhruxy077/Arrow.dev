# Arrow.dev 

A fully-featured web-based AI-powered code playground. Build full-stack applications with natural language, edit code in-browser, and deploy instantly.

## 🚀 Features

### AI-Powered Code Generation
- Natural language to full-stack application generation
- Support for multiple frameworks (React, Vue, Angular, Svelte, Node.js, etc.)
- Intelligent file structure creation
- Dependency management and package.json generation
- Real-time streaming of AI responses with visual feedback
- Context-aware code modifications and iterations

### In-Browser Development Environment
- Full WebContainer integration for running code in-browser
- Multi-file code editor with Monaco Editor and syntax highlighting
- File tree navigation with create/edit/delete operations
- Live preview with hot-reload functionality
- Multiple terminal instances support
- Package installation (npm/yarn) in browser
- File upload and import capabilities

### Chat Interface
- Persistent chat history per project (Supabase-backed)
- Message streaming with typing indicators
- Code block rendering with syntax highlighting
- Code block copy functionality
- Ability to reference specific files in chat (@filename.js)
- Export chat conversations
- Clear chat functionality

### Project Management
- Create new projects from prompts
- Save and restore project state (Supabase)
- Fork/duplicate existing projects
- Export projects as ZIP files
- Share projects via unique URLs
- Project templates library
- Auto-save every 30 seconds

### Authentication & Collaboration
- Supabase authentication (email/password, OAuth ready)
- User profiles and project ownership
- Real-time subscriptions for collaborative features
- Row Level Security (RLS) policies
- Project sharing with permissions

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- An OpenRouter API key ([openrouter.ai](https://openrouter.ai))

## 🛠️ Setup

### Step 1: Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep secret!)
3. Go to **SQL Editor** and run the schema from `supabase/schema.sql`

### Step 2: Environment Variables

#### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Server (`server/.env`)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 3: Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Step 4: Run the Application

**Terminal 1 - Server:**
```bash
cd server
npm start
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

### Step 5: Access

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📖 Usage

1. **Create a Project**: Describe what you want to build in natural language
2. **AI Generation**: Watch as the AI generates your full-stack application
3. **Edit Code**: Use the Monaco editor to modify files
4. **Live Preview**: See changes instantly in the preview pane
5. **Terminal**: Run commands, install packages, start servers
6. **Chat**: Iterate on your project with AI assistance
7. **Save & Share**: Projects are automatically saved and can be shared

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editor
- **WebContainer API** - In-browser Node.js runtime
- **xterm.js** - Terminal emulator
- **Supabase JS** - Database and auth
- **React Router** - Navigation
- **React Markdown** - Chat rendering

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **OpenRouter API** - AI model access
- **Supabase** - Database and auth backend

## 🐛 Troubleshooting

### WebContainer not initializing
- Use a modern browser (Chrome/Edge recommended)
- Check browser console for errors
- Ensure WebContainer API is supported

### Supabase connection issues
- Verify environment variables are set correctly
- Check that schema has been run in Supabase SQL Editor
- Ensure RLS policies are enabled

### AI generation not working
- Verify OpenRouter API key is set
- Check server logs for API errors
- Free models may have rate limits

## 🚢 Production Deployment

1. **Build the client:**
```bash
cd client
npm run build
```

2. Set production environment variables
3. Deploy server to hosting (Railway, Render, etc.)
4. Deploy client build to Vercel, Netlify, or similar
5. Update CORS settings in server for production domain

## 📝 Project Structure

```
Arrow.dev/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API & Supabase services
│   │   ├── hooks/          # Custom React hooks
│   │   └── pages/          # Page components
│   └── package.json
├── server/                 # Node.js backend
│   ├── controller/         # Route handlers
│   ├── services/           # Business logic
│   ├── routes/             # API routes
│   └── package.json
├── supabase/
│   └── schema.sql          # Database schema
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [WebContainer](https://webcontainers.io)
- Powered by [OpenRouter](https://openrouter.ai)
- Database by [Supabase](https://supabase.com)
