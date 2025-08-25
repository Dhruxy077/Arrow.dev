import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { WebContainer } from "@webcontainer/api";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import Header from "../../components/Header/Header";
import FileTree from "../../components/FileTree/FileTree";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import Terminal from "../../components/Terminal/Terminal";
import Chat from "../../components/Chat/Chat";

const Builder = () => {
  const location = useLocation();
  const { userInput, aiResponse } = location.state || {};
  
  const [files, setFiles] = useState({
    'index.html': {
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to your app!</h1>
        <p>Start building something amazing...</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`
    },
    'style.css': {
      content: `body {
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
}`
    },
    'script.js': {
      content: `console.log('App loaded successfully!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
});`
    }
  });
  const [serverUrl, setServerUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState("index.html");
  const [isServerRunning, setIsServerRunning] = useState(false);
  const webcontainerInstanceRef = useRef(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const didBootRef = useRef(false);

  // Update code with AI response when available
  useEffect(() => {
    if (aiResponse) {
      if (typeof aiResponse === 'object' && aiResponse.files) {
        // Structured response from backend
        const newFiles = {};
        Object.keys(aiResponse.files).forEach(fileName => {
          newFiles[fileName] = {
            content: aiResponse.files[fileName].content || aiResponse.files[fileName]
          };
        });
        setFiles(newFiles);
        // Set the first file as selected
        const firstFile = Object.keys(newFiles)[0];
        if (firstFile) {
          setSelectedFile(firstFile);
        }
      } else {
        // Fallback for plain text response
        const codeMatch = aiResponse.match(/```(?:javascript|js|html|css)?\n?([\s\S]*?)```/);
        if (codeMatch) {
          setFiles(prev => ({
            ...prev,
            [selectedFile]: { content: codeMatch[1].trim() }
          }));
        }
      }
    }
  }, [aiResponse]);

  // Convert files to WebContainer format
  const getWebContainerFiles = () => {
    const webContainerFiles = {};
    Object.keys(files).forEach(fileName => {
      webContainerFiles[fileName] = {
        file: {
          contents: files[fileName].content
        }
      };
    });
    
    // Add package.json if not present
    if (!webContainerFiles['package.json']) {
      webContainerFiles['package.json'] = {
        file: {
          contents: JSON.stringify({
            name: "webcontainer-app",
            type: "module",
            dependencies: {
              "express": "latest"
            },
            scripts: {
              "start": "node server.js"
            }
          }, null, 2)
        }
      };
    }
    
    // Add server.js if not present
    if (!webContainerFiles['server.js']) {
      webContainerFiles['server.js'] = {
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

const PORT = 3111;
server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});`
        }
      };
    }
    
    return webContainerFiles;
  };

  useEffect(() => {
    if (didBootRef.current) return;
    didBootRef.current = true;
    
    if (webcontainerInstanceRef.current) return;
    
    const bootWebContainer = async () => {
      console.log("Booting WebContainer...");
      const wc = await WebContainer.boot();
      webcontainerInstanceRef.current = wc;
      await wc.mount(getWebContainerFiles());

      const installProcess = await wc.spawn("npm", ["install"]);
      installProcess.output.pipeTo(
        new WritableStream({ write: (data) => console.log(data) })
      );
      await installProcess.exit;

      setIsContainerReady(true);

      const startProcess = await wc.spawn("npm", ["run", "start"]);
      startProcess.output.pipeTo(
        new WritableStream({ write: (data) => console.log(data) })
      );
      
      wc.on("server-ready", (port, url) => {
        setServerUrl(url);
        setIsServerRunning(true);
      });
    };
    
    bootWebContainer();
    
    return () => {
      if (webcontainerInstanceRef.current) {
        webcontainerInstanceRef.current.teardown();
      }
    };
  }, [files]);

  useEffect(() => {
    const updateFile = async () => {
      if (webcontainerInstanceRef.current && isContainerReady && selectedFile && files[selectedFile]) {
        await webcontainerInstanceRef.current.fs.writeFile(`/${selectedFile}`, files[selectedFile].content);
      }
    };
    updateFile();
  }, [files, selectedFile, isContainerReady]);

  const handleFileSelect = (filePath) => {
    setSelectedFile(filePath);
  };

  const handleCodeChange = (value, fileName = selectedFile) => {
    if (fileName) {
      setFiles(prev => ({
        ...prev,
        [fileName]: { content: value || "" }
      }));
    }
  };

  const handleCodeGenerated = (response) => {
    if (typeof response === 'object' && response.files) {
      // Structured response
      const newFiles = {};
      Object.keys(response.files).forEach(fileName => {
        newFiles[fileName] = {
          content: response.files[fileName].content || response.files[fileName]
        };
      });
      setFiles(newFiles);
      
      // Set the first file as selected
      const firstFile = Object.keys(newFiles)[0];
      if (firstFile) {
        setSelectedFile(firstFile);
      }
    } else if (typeof response === 'string') {
      // Fallback for plain text
      const codeMatch = response.match(/```(?:javascript|js|jsx|html|css)?\n?([\s\S]*?)```/);
      if (codeMatch) {
        setFiles(prev => ({
          ...prev,
          [selectedFile]: { content: codeMatch[1].trim() }
        }));
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <Header />
      
      <div className="flex-1 flex">
        <PanelGroup direction="horizontal">
          {/* Chat Panel */}
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <Chat onCodeGenerated={handleCodeGenerated} />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />
          
          {/* File Tree Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={25}>
            <FileTree 
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              files={files}
            />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />
          
          {/* Main Content Panel */}
          <Panel defaultSize={55}>
            <PanelGroup direction="vertical">
              {/* Code Editor Panel */}
              <Panel defaultSize={70} minSize={30}>
                <CodeEditor
                  code={files[selectedFile]?.content || ''}
                  onChange={handleCodeChange}
                  serverUrl={serverUrl}
                  isServerRunning={isServerRunning}
                  selectedFile={selectedFile}
                  files={files}
                />
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-600 transition-colors" />
              
              {/* Terminal Panel */}
              <Panel defaultSize={30} minSize={20}>
                <Terminal
                  webcontainerInstance={webcontainerInstanceRef.current}
                  isContainerReady={isContainerReady}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Builder;