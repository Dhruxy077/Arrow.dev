import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { WebContainer } from "@webcontainer/api";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { files as initialFiles } from "../../components/WebContainer/files.js";
import Header from "../../components/Header/Header";
import FileTree from "../../components/FileTree/FileTree";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import Terminal from "../../components/Terminal/Terminal";

const Builder = () => {
  const location = useLocation();
  const { userInput, aiResponse } = location.state || {};
  
  const [code, setCode] = useState(initialFiles["index.js"].file.contents);
  const [serverUrl, setServerUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState("index.js");
  const [isServerRunning, setIsServerRunning] = useState(false);
  const webcontainerInstanceRef = useRef(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const didBootRef = useRef(false);

  // Update code with AI response when available
  useEffect(() => {
    if (aiResponse) {
      // Try to extract code from AI response
      const codeMatch = aiResponse.match(/```(?:javascript|js)?\n?([\s\S]*?)```/);
      if (codeMatch) {
        setCode(codeMatch[1].trim());
      } else {
        // If no code blocks found, use the response as is (might be plain code)
        setCode(aiResponse);
      }
    }
  }, [aiResponse]);

  useEffect(() => {
    if (didBootRef.current) return;
    didBootRef.current = true;
    
    if (webcontainerInstanceRef.current) return;
    
    const bootWebContainer = async () => {
      console.log("Booting WebContainer...");
      const wc = await WebContainer.boot();
      webcontainerInstanceRef.current = wc;
      await wc.mount(initialFiles);

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
  }, []);

  useEffect(() => {
    const updateFile = async () => {
      if (webcontainerInstanceRef.current && isContainerReady) {
        await webcontainerInstanceRef.current.fs.writeFile("/index.js", code);
      }
    };
    updateFile();
  }, [code, isContainerReady]);

  const handleFileSelect = (filePath) => {
    setSelectedFile(filePath);
    // In a real implementation, you would load the file content here
    console.log("Selected file:", filePath);
  };

  const handleCodeChange = (value) => {
    setCode(value || "");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header />
      
      <div className="flex-1 flex">
        <PanelGroup direction="horizontal">
          {/* File Tree Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <FileTree 
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />
          
          {/* Main Content Panel */}
          <Panel defaultSize={80}>
            <PanelGroup direction="vertical">
              {/* Code Editor Panel */}
              <Panel defaultSize={70} minSize={30}>
                <CodeEditor
                  code={code}
                  onChange={handleCodeChange}
                  serverUrl={serverUrl}
                  isServerRunning={isServerRunning}
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