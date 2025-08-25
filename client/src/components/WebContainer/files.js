export const files = {
  'index.js': {
    file: {
      contents: `import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Serve static files
app.use(express.static('.'));

// Basic HTML template
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WebContainer App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center;
          max-width: 500px;
        }
        h1 {
          color: #333;
          margin-bottom: 1rem;
        }
        p {
          color: #666;
          line-height: 1.6;
        }
        .status {
          background: #e8f5e8;
          color: #2d5a2d;
          padding: 10px;
          border-radius: 5px;
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 WebContainer is Running!</h1>
        <p>Your development environment is ready. You can now edit your code and see changes in real-time.</p>
        <div class="status">
          ✅ Server is active on port 3111
        </div>
      </div>
    </body>
    </html>
  \`);
});

const PORT = 3111;
server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});`
    }
  },
  'package.json': {
    file: {
      contents: `{
  "name": "webcontainer-app",
  "type": "module",
  "dependencies": {
    "express": "latest"
  },
  "scripts": {
    "start": "node index.js"
  }
}`
    }
  }
};