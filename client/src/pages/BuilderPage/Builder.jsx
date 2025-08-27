import React, { useState, useRef, useEffect } from "react";
import { WebContainer } from "@webcontainer/api";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import Header from "../../components/Header/Header";
import FileTree from "../../components/FileTree/FileTree";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import Terminal from "../../components/Terminal/Terminal";
import Chat from "../../components/Chat/Chat";

// A minimal package.json to start the container
const initialFiles = {
  "package.json": {
    file: {
      contents: JSON.stringify(
        {
          name: "webcontainer-app",
          private: true,
          type: "module",
          scripts: {
            dev: "vite",
            start: "vite",
            build: "vite build",
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            "@vitejs/plugin-react": "^4.2.0",
            vite: "^5.0.0",
          },
        },
        null,
        2
      ),
    },
  },
};

const Builder = () => {
  const [files, setFiles] = useState({});
  const [serverUrl, setServerUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const webcontainerInstanceRef = useRef(null);
  const hasBootedRef = useRef(false);

  useEffect(() => {
    if (hasBootedRef.current) return;
    hasBootedRef.current = true;

    const bootWebContainer = async () => {
      try {
        console.log("1. Booting WebContainer...");
        const wc = await WebContainer.boot();
        webcontainerInstanceRef.current = wc;

        console.log("2. Mounting initial files...");
        await wc.mount(initialFiles);

        console.log("3. Container is ready.");
        setIsContainerReady(true);

        wc.on("server-ready", (port, url) => {
          console.log(`4. Server is ready at: ${url}`);
          setServerUrl(url);
          setIsServerRunning(true);
        });
      } catch (error) {
        console.error("Error during WebContainer boot:", error);
      }
    };

    bootWebContainer();

    return () => {
      if (webcontainerInstanceRef.current) {
        console.log("Tearing down WebContainer instance...");
        webcontainerInstanceRef.current.teardown();
      }
    };
  }, []);

  const handleFileSelect = (filePath) => {
    setSelectedFile(filePath);
  };

  const handleCodeChange = async (value, fileName = selectedFile) => {
    if (fileName && webcontainerInstanceRef.current) {
      // Update local state
      const newFiles = { ...files };
      newFiles[fileName] = { content: value };
      setFiles(newFiles);

      try {
        // Write to WebContainer filesystem
        await webcontainerInstanceRef.current.fs.writeFile(fileName, value);
      } catch (error) {
        console.error("Error writing file to WebContainer:", error);
      }
    }
  };

  const createDirectoryStructure = async (filePath) => {
    const pathParts = filePath.split("/");
    pathParts.pop(); // Remove filename

    let currentPath = "";
    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      try {
        await webcontainerInstanceRef.current.fs.mkdir(currentPath, {
          recursive: true,
        });
      } catch (error) {
        // Directory might already exist, which is fine
      }
    }
  };

  const installDependencies = async (packageJsonContent) => {
    try {
      const packageJson = JSON.parse(packageJsonContent);
      if (packageJson.dependencies || packageJson.devDependencies) {
        console.log("Installing dependencies...");
        const installProcess = await webcontainerInstanceRef.current.spawn(
          "npm",
          ["install"]
        );

        installProcess.output.pipeTo(
          new WritableStream({
            write: (data) => console.log("npm install:", data),
          })
        );

        const exitCode = await installProcess.exit;
        if (exitCode !== 0) {
          console.error("npm install failed");
        } else {
          console.log("Dependencies installed successfully");
        }
      }
    } catch (error) {
      console.error("Error installing dependencies:", error);
    }
  };

  const startDevServer = async () => {
    try {
      console.log("Starting development server...");
      const devProcess = await webcontainerInstanceRef.current.spawn("npm", [
        "run",
        "dev",
      ]);

      devProcess.output.pipeTo(
        new WritableStream({
          write: (data) => console.log("dev server:", data),
        })
      );
    } catch (error) {
      console.error("Error starting dev server:", error);
    }
  };

  const handleCodeGenerated = async (response) => {
    if (!response || !response.files || !webcontainerInstanceRef.current) {
      console.error("Invalid response or WebContainer not ready");
      return;
    }

    setIsLoading(true);

    try {
      const newFiles = response.files;
      let hasPackageJson = false;

      // First, create all directories and write all files
      for (const [filename, fileData] of Object.entries(newFiles)) {
        // Create directory structure if needed
        await createDirectoryStructure(filename);

        // Get file content - handle both string and object formats
        let content = "";
        if (typeof fileData === "string") {
          content = fileData;
        } else if (fileData && typeof fileData.content === "string") {
          content = fileData.content;
        } else if (fileData && typeof fileData === "object") {
          // Handle the format from your prompt: { file: { contents: "..." } }
          content =
            fileData.file?.contents || JSON.stringify(fileData, null, 2);
        }

        // Write file to WebContainer
        await webcontainerInstanceRef.current.fs.writeFile(filename, content);

        if (filename === "package.json") {
          hasPackageJson = true;
        }
      }

      // Update React state with processed files
      const processedFiles = {};
      for (const [filename, fileData] of Object.entries(newFiles)) {
        let content = "";
        if (typeof fileData === "string") {
          content = fileData;
        } else if (fileData && typeof fileData.content === "string") {
          content = fileData.content;
        } else if (fileData && typeof fileData === "object") {
          content =
            fileData.file?.contents || JSON.stringify(fileData, null, 2);
        }

        processedFiles[filename] = { content };
      }

      setFiles(processedFiles);

      // Install dependencies if package.json exists
      if (hasPackageJson) {
        const packageJsonContent =
          processedFiles["package.json"]?.content ||
          newFiles["package.json"]?.file?.contents ||
          newFiles["package.json"];

        if (packageJsonContent) {
          await installDependencies(packageJsonContent);
        }
      }

      // Start dev server after a short delay
      setTimeout(() => {
        startDevServer();
      }, 2000);

      // Select the main application file to display in the editor
      const mainFiles = [
        "src/App.jsx",
        "src/App.js",
        "src/main.jsx",
        "src/index.js",
        "index.html",
        "app.js",
        "server.js",
      ];

      const firstFile =
        mainFiles.find((f) => processedFiles[f]) ||
        Object.keys(processedFiles)[0];

      if (firstFile) {
        setSelectedFile(firstFile);
      }
    } catch (error) {
      console.error("Error processing generated code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <Header />
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-lg">Generating project...</div>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={25} minSize={20}>
            <Chat onCodeGenerated={handleCodeGenerated} />
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-600" />
          <Panel defaultSize={20} minSize={15}>
            <FileTree
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              files={files}
            />
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-600" />
          <Panel>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <CodeEditor
                  code={files[selectedFile]?.content || ""}
                  onChange={handleCodeChange}
                  serverUrl={serverUrl}
                  isServerRunning={isServerRunning}
                  selectedFile={selectedFile}
                  files={files}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-600" />
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
