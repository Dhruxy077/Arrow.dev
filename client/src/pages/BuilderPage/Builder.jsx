// src/pages/BuilderPage/Builder.jsx

import React, { useState, useRef, useEffect } from "react";
import { WebContainer } from "@webcontainer/api";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel } from "react-resizable-panels";
import { Folder, Code, Eye } from "lucide-react";
import { files as initialFiles } from "../../components/WebContainer/files.js";
import TerminalPanel from "../../components/WebContainer/TerminalPanel.jsx";

const Builder = () => {
  const [code, setCode] = useState(initialFiles["index.js"].file.contents);
  const [mainView, setMainView] = useState("code");
  const [serverUrl, setServerUrl] = useState("");
  const webcontainerInstanceRef = useRef(null);
  // --- 1. ADD NEW STATE ---
  const [isContainerReady, setIsContainerReady] = useState(false);

  useEffect(() => {
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

      // --- 2. SET STATE TO TRUE AFTER INSTALL ---
      setIsContainerReady(true);

      const startProcess = await wc.spawn("npm", ["run", "start"]);
      startProcess.output.pipeTo(
        new WritableStream({ write: (data) => console.log(data) })
      );
      wc.on("server-ready", (port, url) => {
        setServerUrl(url);
      });
    };
    bootWebContainer();
    return () => {
      webcontainerInstanceRef.current?.teardown();
    };
  }, []);

  useEffect(() => {
    const updateFile = async () => {
      if (webcontainerInstanceRef.current) {
        await webcontainerInstanceRef.current.fs.writeFile("/index.js", code);
      }
    };
    updateFile();
  }, [code]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <PanelGroup direction="horizontal" className="flex-grow">
        <Panel defaultSize={15} minSize={10}>
          <div className="flex flex-col h-full bg-gray-800 p-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Folder size={20} /> Files
            </h2>
          </div>
        </Panel>
        <Panel defaultSize={85}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={70} minSize={20}>
              <div className="flex flex-col h-full bg-gray-800">
                <div className="flex-shrink-0 flex gap-2 p-2 border-b border-gray-700">
                  <button
                    onClick={() => setMainView("code")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded ${
                      mainView === "code" ? "bg-blue-600" : "hover:bg-gray-700"
                    }`}
                  >
                    <Code size={16} /> Code
                  </button>
                  <button
                    onClick={() => setMainView("preview")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded ${
                      mainView === "preview"
                        ? "bg-blue-600"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    <Eye size={16} /> Preview
                  </button>
                </div>
                <div className="flex-grow relative">
                  {mainView === "code" && (
                    <Editor
                      height="100%"
                      theme="vs-dark"
                      defaultLanguage="javascript"
                      value={code}
                      onChange={(val) => setCode(val || "")}
                    />
                  )}
                  {mainView === "preview" && (
                    <iframe
                      src={serverUrl}
                      className="w-full h-full bg-white"
                      title="Preview"
                    />
                  )}
                </div>
              </div>
            </Panel>
            <Panel defaultSize={30} minSize={10}>
              {/* --- 3. PASS THE NEW STATE AS A PROP --- */}
              <TerminalPanel
                webcontainerInstance={webcontainerInstanceRef.current}
                isContainerReady={isContainerReady}
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Builder;
