# Arrow.dev

A web-based AI-powered code playground that combines natural language processing with interactive code editing and execution.

## Features

- **AI Code Generation**: Describe what you want to build and get generated code
- **Interactive Editor**: Monaco Editor with syntax highlighting
- **Multi-Environment Execution**: Run code in browser, Node.js, or Vite
- **WebContainer Integration**: Full Node.js environment in the browser
- **Chat Interface**: Conversational AI interactions with history
- **Live Preview**: Instant preview of web applications

## Setup

1. **Server Setup**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Add your GEMINI_API_KEY to .env
   npm start
   ```

2. **Client Setup**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Environment Variables**:
   - Server: Add your Google Gemini API key to `server/.env`
   - Client: The API URL is configured in `client/.env`

## Usage

1. Start both server and client
2. Navigate to the home page
3. Describe what you want to build in natural language
4. Get AI-generated code and interact with it in the builder
5. Run, edit, and preview your code in real-time

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Monaco Editor, WebContainer
- **Backend**: Node.js, Express, Google Gemini AI
- **Tools**: xterm.js for terminal, React Router for navigation
