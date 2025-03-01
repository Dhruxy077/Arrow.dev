import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import webContainerService from "../WebContainer.js/webcontainerService";

const CodeEditorWithPreview = () => {
  // State management
  const [activeTab, setActiveTab] = useState("code");
  const [code, setCode] = useState('console.log("Hello world!");');
  const [editorOptions, setEditorOptions] = useState({
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    roundedSelection: false,
    automaticLayout: true,
    theme: "vs-dark",
    padding: { top: 16 },
  });

  // Additional states for WebContainer
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [serverUrl, setServerUrl] = useState(null);
  const [executionMode, setExecutionMode] = useState("browser"); // 'browser' or 'node' or 'vite'
  const [isLoading, setIsLoading] = useState(false);

  // References
  const previewIframeRef = useRef(null);
  const editorRef = useRef(null);
  const terminalRef = useRef(null);
  const terminalContainerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const shellStartedRef = useRef(false);

  // Initialize WebContainer on component mount
  useEffect(() => {
    const initWebContainer = async () => {
      // Setup WebContainer event listeners
      webContainerService.addEventListener("ready", () => {
        console.log("WebContainer is ready");
        setIsContainerReady(true);

        // Initialize with a sample file
        webContainerService.writeFiles({
          "index.js": {
            file: {
              contents: code,
            },
          },
          "package.json": {
            file: {
              contents: JSON.stringify(
                {
                  name: "code-playground",
                  type: "module",
                  dependencies: {},
                  scripts: {
                    start: "node index.js",
                  },
                },
                null,
                2
              ),
            },
          },
        });

        // Print welcome message to terminal
        if (xtermRef.current) {
          xtermRef.current.writeln("WebContainer initialized and ready!");
          xtermRef.current.writeln(
            "Use the buttons above to run your code or start a server."
          );
          xtermRef.current.writeln("");
        }
      });

      webContainerService.addEventListener("terminalOutput", (data) => {
        if (xtermRef.current) {
          xtermRef.current.write(data);
        }
      });

      webContainerService.addEventListener("serverStarted", (url) => {
        setServerUrl(url);
        setIsLoading(false);

        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\nServer started at: ${url}`);
          xtermRef.current.writeln(
            "Preview is now available in the Preview tab"
          );
        }
      });

      // Initialize the WebContainer if it's not already initialized
      if (!webContainerService.isInitialized) {
        try {
          await webContainerService.boot();
        } catch (error) {
          console.error("Failed to initialize WebContainer:", error);
          if (xtermRef.current) {
            xtermRef.current.writeln(
              `\r\nError initializing WebContainer: ${error.message}`
            );
          }
        }
      } else {
        setIsContainerReady(true);
      }
    };

    initWebContainer();

    return () => {
      // Clean up event listeners when the component unmounts
      webContainerService.removeEventListener("ready", () => {});
      webContainerService.removeEventListener("terminalOutput", () => {});
      webContainerService.removeEventListener("serverStarted", () => {});
    };
  }, []);

  // Setup terminal
  useEffect(() => {
    if (terminalContainerRef.current && !xtermRef.current) {
      // Create terminal instance
      xtermRef.current = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        theme: {
          background: "#1a1a1a",
          foreground: "#f8f8f8",
        },
        convertEol: true,
      });

      // Add fit addon to make terminal resize to container
      fitAddonRef.current = new FitAddon();
      xtermRef.current.loadAddon(fitAddonRef.current);

      // Open terminal in the container element
      xtermRef.current.open(terminalContainerRef.current);

      // Make sure to fit terminal to container
      setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      }, 100);

      // Set up input handling for the terminal
      xtermRef.current.onData((data) => {
        if (isContainerReady && webContainerService.isInitialized) {
          webContainerService.writeInput(data);
        }
      });

      // Handle terminal focus
      terminalContainerRef.current.addEventListener("click", () => {
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      });

      // Handle window resize to fit terminal
      const handleResize = () => {
        if (fitAddonRef.current) {
          setTimeout(() => {
            fitAddonRef.current.fit();
          }, 100);
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Update the code file in WebContainer when code changes
  useEffect(() => {
    if (isContainerReady && code) {
      webContainerService.writeFile("index.js", code).catch((error) => {
        console.error("Failed to write file:", error);
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\nError writing file: ${error.message}`);
        }
      });
    }
  }, [code, isContainerReady]);

  // Start an interactive shell when switching to terminal tab
  useEffect(() => {
    if (
      activeTab === "terminal" &&
      isContainerReady &&
      !shellStartedRef.current
    ) {
      startInteractiveShell();
    }

    // Make sure to fit terminal when tab is active
    if (activeTab === "terminal" && fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current.fit();
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      }, 100);
    }

    // Update iframe content when switching to preview tab
    if (activeTab === "preview" && executionMode === "browser") {
      setTimeout(() => {
        runInBrowser();
      }, 100);
    }
  }, [activeTab, isContainerReady]);

  // Handle editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Function to handle code changes
  const handleEditorChange = (value) => {
    setCode(value || "");
  };

  // Function to start an interactive shell
  const startInteractiveShell = async () => {
    if (!isContainerReady) return;

    try {
      // Only start shell if not already started
      if (!shellStartedRef.current) {
        await webContainerService.startShell();
        shellStartedRef.current = true;
      }

      // Focus the terminal
      if (xtermRef.current) {
        setTimeout(() => {
          xtermRef.current.focus();
          if (fitAddonRef.current) {
            fitAddonRef.current.fit();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to start interactive shell:", error);
      if (xtermRef.current) {
        xtermRef.current.writeln(
          `\r\nError starting interactive shell: ${error.message}`
        );
      }
    }
  };

  // Function to run code in the browser preview
  const runInBrowser = () => {
    if (!previewIframeRef.current) return;

    const iframe = previewIframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // Clear the iframe
    iframeDoc.open();

    // Create HTML with the JavaScript in a script tag
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: white;
              background-color: #1e1e1e;
              padding: 20px;
              margin: 0;
            }
            .output {
              white-space: pre-wrap;
              font-family: 'Courier New', monospace;
            }
            .error {
              color: #f44336;
            }
          </style>
        </head>
        <body>
          <div class="output" id="output"></div>
          <script>
            // Capture console.log output
            const outputDiv = document.getElementById('output');
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            
            console.log = function(...args) {
              originalConsoleLog.apply(console, args);
              const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
              ).join(' ');
              outputDiv.innerHTML += message + '\\n';
            };
            
            console.error = function(...args) {
              originalConsoleError.apply(console, args);
              const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
              ).join(' ');
              const errorElement = document.createElement('div');
              errorElement.className = 'error';
              errorElement.textContent = message + '\\n';
              outputDiv.appendChild(errorElement);
            };
            
            // Execute the user code inside a try-catch
            try {
              ${code}
            } catch (error) {
              console.error(error.message);
            }
          </script>
        </body>
      </html>
    `;

    iframeDoc.write(html);
    iframeDoc.close();
  };

  // Function to run code in Node.js (WebContainer)
  const runInNode = async () => {
    if (!isContainerReady) {
      console.log("WebContainer is not ready yet");
      return;
    }

    // Clear terminal before running command
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln("Running code with Node.js...\r\n");
    }

    try {
      // Run the code with Node.js
      const result = await webContainerService.runCommand("node", ["index.js"]);

      if (result.exit !== 0) {
        console.error("Command failed with exit code:", result.exit);
        if (xtermRef.current) {
          xtermRef.current.writeln(
            `\r\nCommand exited with code ${result.exit}`
          );
        }
      }
    } catch (error) {
      console.error("Failed to run command:", error);
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\nError: ${error.message}`);
      }
    }
  };

  // Start a server in WebContainer
  const startServer = async () => {
    if (!isContainerReady) {
      console.log("WebContainer is not ready yet");
      return;
    }

    setIsLoading(true);

    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln("Setting up Express server...");
    }

    try {
      // Create a random port between 3001-3999 to avoid conflicts
      const port = Math.floor(Math.random() * 999) + 3001;

      // First, create a simple Express server file
      await webContainerService.writeFile(
        "server.js",
        `
        import express from 'express';
        const app = express();
        const port = ${port};
        
        app.get('/', (req, res) => {
          res.send('<h1>Welcome to a WebContainers app! 🎉</h1><p>Welcome to a WebContainers app! 🎉</p><p>Welcome to a WebContainers app! 🎉</p>');
        });
        
        app.listen(port, () => {
          console.log(\`Server running at http://localhost:\${port}\`);
        });
      `
      );

      // Update package.json to include Express
      await webContainerService.writeFile(
        "package.json",
        JSON.stringify(
          {
            name: "code-playground",
            type: "module",
            dependencies: {
              express: "^4.18.2",
            },
            scripts: {
              start: "node server.js",
            },
          },
          null,
          2
        )
      );

      // Install dependencies
      if (xtermRef.current) {
        xtermRef.current.writeln("Installing dependencies...");
      }
      await webContainerService.installDependencies();

      // Start the server
      if (xtermRef.current) {
        xtermRef.current.writeln("Starting server...");
      }
      const url = await webContainerService.startDevServer(
        "npm",
        ["start"],
        port
      );
      setServerUrl(url);
      setActiveTab("preview");
    } catch (error) {
      console.error("Failed to start server:", error);
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\nError: ${error.message}`);
      }
      setIsLoading(false);
    }
  };

  // Start a Vite application
  const startViteApp = async () => {
    if (!isContainerReady) {
      console.log("WebContainer is not ready yet");
      return;
    }

    setIsLoading(true);

    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln("Setting up Vite application...");
    }

    try {
      // Create a random port between 4001-4999 for Vite
      const port = Math.floor(Math.random() * 999) + 4001;

      // Create a basic Vite application
      await webContainerService.writeFiles({
        "index.html": {
          file: {
            contents: `
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Vite App</title>
                </head>
                <body>
                  <div id="app"></div>
                  <script type="module" src="/main.js"></script>
                </body>
              </html>
            `,
          },
        },
        "main.js": {
          file: {
            contents: code,
          },
        },
        "package.json": {
          file: {
            contents: JSON.stringify(
              {
                name: "vite-project",
                private: true,
                version: "0.0.0",
                type: "module",
                scripts: {
                  dev: `vite --port ${port} --host`,
                  build: "vite build",
                  preview: "vite preview",
                },
                devDependencies: {
                  vite: "^4.4.0",
                },
              },
              null,
              2
            ),
          },
        },
      });

      // Install dependencies
      if (xtermRef.current) {
        xtermRef.current.writeln("Installing Vite and dependencies...");
      }
      await webContainerService.installDependencies();

      // Start the Vite dev server
      if (xtermRef.current) {
        xtermRef.current.writeln("Starting Vite development server...");
      }
      const url = await webContainerService.startDevServer(
        "npx",
        ["vite", "--host", "--port", port.toString()],
        port
      );
      setServerUrl(url);
      setActiveTab("preview");
    } catch (error) {
      console.error("Failed to start Vite application:", error);
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\nError: ${error.message}`);
      }
      setIsLoading(false);
    }
  };

  // Run code when the "Run in Browser" button is clicked
  const handleRunInBrowser = () => {
    setActiveTab("preview");
    setTimeout(() => {
      runInBrowser();
    }, 100);
  };

  // Define TabButton component
  const TabButton = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: "10px 15px",
        backgroundColor: isActive ? "#2d2d2d" : "transparent",
        color: isActive ? "white" : "#ccc",
        border: "none",
        borderRight: "1px solid #333",
        cursor: "pointer",
        outline: "none",
        fontSize: "14px",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e1e",
      }}
    >
      {/* Tabs header */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #333",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>
          <TabButton
            label="Code"
            isActive={activeTab === "code"}
            onClick={() => setActiveTab("code")}
          />
          <TabButton
            label="Preview"
            isActive={activeTab === "preview"}
            onClick={() => {
              setActiveTab("preview");
              // Add a small delay to ensure the tab switch happens before running
              setTimeout(() => {
                if (executionMode === "browser") {
                  runInBrowser();
                }
              }, 100);
            }}
          />
          <TabButton
            label="Terminal"
            isActive={activeTab === "terminal"}
            onClick={() => {
              setActiveTab("terminal");
              // Ensure terminal is fitted to its container after tab switch
              setTimeout(() => {
                if (fitAddonRef.current) {
                  fitAddonRef.current.fit();
                }
                if (xtermRef.current) {
                  xtermRef.current.focus();
                }
              }, 100);
            }}
          />
        </div>

        <div
          style={{ display: "flex", alignItems: "center", marginRight: "10px" }}
        >
          {/* Execution mode selector */}
          <select
            value={executionMode}
            onChange={(e) => setExecutionMode(e.target.value)}
            style={{
              backgroundColor: "#2d2d2d",
              color: "white",
              border: "1px solid #444",
              borderRadius: "4px",
              padding: "4px 8px",
              marginRight: "10px",
              fontSize: "14px",
            }}
          >
            <option value="browser">Browser</option>
            <option value="node">Node.js</option>
            <option value="vite">Vite App</option>
          </select>

          {/* WebContainer actions */}
          {isContainerReady && (
            <>
              <button
                onClick={
                  executionMode === "browser"
                    ? handleRunInBrowser
                    : executionMode === "node"
                    ? runInNode
                    : startViteApp
                }
                disabled={isLoading}
                style={{
                  backgroundColor: "#2d2d2d",
                  color: isLoading ? "#999" : "white",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  marginRight: "10px",
                  fontSize: "14px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading
                  ? "Working..."
                  : executionMode === "browser"
                  ? "Run in Browser"
                  : executionMode === "node"
                  ? "Run in Node"
                  : "Start Vite App"}
              </button>

              <button
                onClick={startServer}
                disabled={isLoading}
                style={{
                  backgroundColor: "#2d2d2d",
                  color: isLoading ? "#999" : "white",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "14px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Working..." : "Start Express Server"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content area with fixed layout */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Top section with tabs */}
        <div style={{ flex: 1, display: "flex", position: "relative" }}>
          {/* Code Editor */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: activeTab === "code" ? "block" : "none",
            }}
          >
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={editorOptions}
              theme="vs-dark"
            />
          </div>

          {/* Preview Area */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: activeTab === "preview" ? "block" : "none",
              backgroundColor: "#1e1e1e",
              overflow: "auto",
            }}
          >
            {isLoading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "white",
                  flexDirection: "column",
                }}
              >
                <div
                  className="loader"
                  style={{
                    border: "5px solid #f3f3f3",
                    borderTop: "5px solid #3498db",
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    animation: "spin 2s linear infinite",
                    marginBottom: "20px",
                  }}
                ></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <div>Loading your application...</div>
              </div>
            )}

            {/* Server URL display */}
            {serverUrl && !isLoading && (
              <div
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  backgroundColor: "#2d2d2d",
                  borderRadius: "4px",
                  color: "white",
                }}
              >
                Server running at:{" "}
                <a
                  href={serverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4fc3f7" }}
                >
                  {serverUrl}
                </a>
              </div>
            )}

            {/* iframe for preview */}
            <iframe
              ref={previewIframeRef}
              title="Code Preview"
              style={{
                width: "100%",
                height: serverUrl ? "calc(100% - 60px)" : "100%",
                border: "none",
                backgroundColor: "#1e1e1e",
              }}
            />
          </div>

          {/* Terminal Area */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: activeTab === "terminal" ? "block" : "none",
              padding: "10px",
              backgroundColor: "#1a1a1a",
            }}
          >
            <div
              ref={terminalContainerRef}
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#1a1a1a",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorWithPreview;
