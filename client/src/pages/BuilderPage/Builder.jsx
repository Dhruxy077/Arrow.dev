// client/pages/BuilderPage/Builder.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

// New UI Components
import Header from "../../components/Header/Header";
import FileTree from "../../components/FileTree/FileTree";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import ChatHistory from "../../components/Chat History/ChatHistory";
import MainTabs from "../../components/MainTabs/MainTabs"; // <-- NEW

// Services & Hooks
import {
  showErrorNotification,
  showSuccessNotification,
  generateRequest,
  modifyRequest,
} from "../../services/api";
import {
  parseInitialGeneration,
  parseModification,
} from "../../services/AIResponseParser";
import { useWebContainer } from "../../hooks/useWebContainer";
import { useLocalStorage } from "../../hooks/useLocalStorage";

// Helper function to apply code modifications
function applyUpdate(originalContent, search, replace) {
  const searchLines = search.trimEnd();
  const replaceLines = replace.trimEnd();
  if (originalContent.includes(searchLines)) {
    return originalContent.replace(searchLines, replaceLines);
  } else {
    console.warn("Search block not found, appending code instead.", {
      search,
      replace,
    });
    return originalContent + "\n\n" + replaceLines;
  }
}

const Builder = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- Main State (from localStorage) ---
  const [chats, setChats] = useLocalStorage("chats", []);
  const [activeChatId, setActiveChatId] = useLocalStorage("activeChat", null);

  // --- Derived State ---
  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  const files = activeChat?.generatedCode?.files || {};
  const isFirstMessage =
    !activeChat || Object.keys(activeChat.generatedCode.files).length === 0;

  // --- Local UI State ---
  const [selectedFile, setSelectedFile] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For chat responses
  const [isImporting, setIsImporting] = useState(false); // For project build
  const [generatingStage, setGeneratingStage] = useState(0);

  // --- WebContainer Hook ---
  const {
    container,
    isReady: isContainerReady,
    isServerRunning,
    serverUrl,
    installDependencies,
    startDevServer,
  } = useWebContainer();

  const updateActiveChat = (updateFn) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId ? updateFn(chat) : chat
      )
    );
  };

  // --- CHAT HISTORY HANDLERS ---
  const handleNewChat = (initialPrompt = "") => {
    const newChatId = crypto.randomUUID();
    const newChat = {
      id: newChatId,
      title: initialPrompt ? "New Project..." : "New Project",
      timestamp: new Date().toISOString(),
      messages: [
        {
          id: crypto.randomUUID(),
          type: "assistant",
          content: "Hello! What would you like to build today?",
        },
      ],
      generatedCode: {
        files: {},
      },
    };

    if (initialPrompt) {
      newChat.messages.push({
        id: crypto.randomUUID(),
        type: "user",
        content: initialPrompt,
      });
    }

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setSelectedFile("");
    navigate("/builder", { replace: true });

    if (initialPrompt && isContainerReady) {
      autoGenerate(initialPrompt, newChatId);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    const chat = chats.find((c) => c.id === chatId);
    const files = chat?.generatedCode?.files || {};
    const entryFile =
      Object.keys(files).find((f) => f === "index.html") ||
      Object.keys(files).find((f) => f === "src/main.tsx") ||
      Object.keys(files)[0];
    setSelectedFile(entryFile || "");
  };

  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  useEffect(() => {
    const prompt = location.state?.initialPrompt;
    if (prompt && isContainerReady) {
      handleNewChat(prompt);
    } else if (!activeChatId && chats.length > 0) {
      setActiveChatId(
        chats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
          .id
      );
    } else if (!activeChatId && chats.length === 0) {
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContainerReady, location.state]);

  /**
   * === PHASE 1: Initial Generation ===
   */
  const handleCodeGenerated = useCallback(
    async (chatId, projectName, newFiles) => {
      if (!container) {
        showErrorNotification("WebContainer not ready.");
        setIsLoading(false);
        setIsImporting(false);
        return;
      }

      try {
        setGeneratingStage(2); // "Generating code structure..."
        const packageJsonContent = newFiles["package.json"];
        if (!packageJsonContent) {
          throw new Error("AI did not generate a package.json file.");
        }

        const filesToWrite = { ...newFiles };

        setGeneratingStage(3); // "Writing files..."
        for (const [filename, content] of Object.entries(filesToWrite)) {
          const pathParts = filename.split("/");
          if (pathParts.length > 1) {
            const dir = pathParts.slice(0, -1).join("/");
            await container.fs.mkdir(dir, { recursive: true });
          }
          await container.fs.writeFile(filename, content);
        }

        setGeneratingStage(4); // "Installing dependencies..."
        await installDependencies(filesToWrite["package.json"]);

        setGeneratingStage(5); // "Starting dev server..."
        await startDevServer();

        showSuccessNotification("Project Generated Successfully!");

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  title: projectName,
                  generatedCode: { files: filesToWrite },
                }
              : chat
          )
        );

        const entryFile =
          Object.keys(newFiles).find((f) => f === "index.html") ||
          Object.keys(newFiles).find((f) => f === "src/main.tsx") ||
          Object.keys(newFiles)[0];
        setSelectedFile(entryFile || "");

        setIsImporting(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error processing generated code:", error);
        showErrorNotification("Error processing code", [error.message]);
        setIsImporting(false);
        setIsLoading(false);
      }
    },
    [container, installDependencies, startDevServer, setChats]
  );

  // This function now just triggers the import process
  const autoGenerate = useCallback(
    async (prompt, chatId) => {
      setIsLoading(true);
      setIsImporting(true); // This shows the loading UI in the chat
      setGeneratingStage(1);

      const assistantMessageId = crypto.randomUUID();
      updateActiveChat((chat) => ({
        ...chat,
        messages: [
          ...chat.messages,
          {
            id: assistantMessageId,
            type: "assistant",
            content: "...",
          },
        ],
      }));

      try {
        const rawXML = await generateRequest(prompt);
        const { projectName, files, error } = parseInitialGeneration(rawXML);
        if (error) throw error;

        // Update the message to show the plan
        const plan = `I'll create a new project: **${projectName}**.
        
        I will build it step-by-step:
        - Generate ${Object.keys(files).length} files
        - Install dependencies
        - Start the dev server
        `;
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: plan }
                      : msg
                  ),
                }
              : chat
          )
        );

        // Now, start the actual build
        await handleCodeGenerated(chatId, projectName, files);
      } catch (error) {
        console.error("autoGenerate error:", error);
        const errorContent = `Sorry, I encountered an error: \n\n\`\`\`\n${error.message}\n\`\`\``;
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: errorContent }
                      : msg
                  ),
                }
              : chat
          )
        );
        setIsLoading(false);
        setIsImporting(false);
      }
    },
    [handleCodeGenerated, updateActiveChat, setChats]
  );

  /**
   * === PHASE 3: Incremental Updates ===
   */
  const handleCodeModified = useCallback(
    async (chatId, projectName, updates, newFiles) => {
      // (This logic is fine, but we'll add the inline loading)
      if (!container) {
        showErrorNotification("WebContainer not ready.");
        return;
      }
      setIsLoading(true); // This is for the chat response
      setIsImporting(true); // This shows the "Building..."
      setGeneratingStage(3); // "Writing files..."

      try {
        let updatedFiles = { ...files };
        for (const [filename, content] of Object.entries(newFiles)) {
          const pathParts = filename.split("/");
          if (pathParts.length > 1) {
            const dir = pathParts.slice(0, -1).join("/");
            await container.fs.mkdir(dir, { recursive: true });
          }
          await container.fs.writeFile(filename, content);
          updatedFiles[filename] = content;
        }

        for (const update of updates) {
          const { file, search, replace } = update;
          if (!updatedFiles[file]) continue;
          const originalContent = updatedFiles[file];
          const updatedContent = applyUpdate(originalContent, search, replace);
          await container.fs.writeFile(file, updatedContent);
          updatedFiles[file] = updatedContent;
        }

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  title: projectName,
                  generatedCode: { files: updatedFiles },
                }
              : chat
          )
        );

        if (selectedFile) {
          setSelectedFile("");
          setTimeout(() => setSelectedFile(selectedFile), 0);
        }
        showSuccessNotification("Project Updated!");
      } catch (error) {
        console.error("Error applying modifications:", error);
        showErrorNotification("Error applying code changes", [error.message]);
      } finally {
        setIsLoading(false);
        setIsImporting(false);
      }
    },
    [container, files, selectedFile, activeChatId, setChats]
  );

  // --- Other Handlers ---
  const handleFileSelect = useCallback((filePath) => {
    setSelectedFile(filePath);
  }, []);

  const handleCodeChange = useCallback(
    async (value, fileName = selectedFile) => {
      if (fileName && container) {
        updateActiveChat((chat) => {
          const newFiles = { ...chat.generatedCode.files, [fileName]: value };
          return {
            ...chat,
            generatedCode: { ...chat.generatedCode, files: newFiles },
          };
        });
        try {
          await container.fs.writeFile(fileName, value);
        } catch (error) {
          console.error("Error writing file to WebContainer:", error);
        }
      }
    },
    [selectedFile, container, updateActiveChat]
  );

  const handleAddMessage = (message) => {
    updateActiveChat((chat) => ({
      ...chat,
      messages: [...chat.messages, message],
    }));
  };

  const handleSetMessageContent = (messageId, content) => {
    updateActiveChat((chat) => ({
      ...chat,
      messages: chat.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      ),
    }));
  };

  const handlePublish = () => {
    if (serverUrl) {
      window.open(serverUrl, "_blank");
    } else {
      showErrorNotification("Server is not ready yet.");
    }
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white">
      <Header
        onPublish={handlePublish}
        serverUrl={serverUrl}
        isServerRunning={isServerRunning}
      />

      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Panel 1: Chat History (collapsible) */}
          <Panel defaultSize={20} minSize={20} maxSize={25}>
            <ChatHistory
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
            />
          </Panel>
          <PanelResizeHandle className="w-0.5 bg-neutral-800 hover:bg-blue-600" />

          {/* Panel 2: Chat/Plan */}
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <MainTabs
              // Pass all chat props to the MainTabs component
              initialMessages={activeChat?.messages || []}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              isFirstMessage={isFirstMessage}
              currentFiles={files}
              onCodeGenerated={(projectName, files) =>
                handleCodeGenerated(activeChat.id, projectName, files)
              }
              onCodeModified={(projectName, updates, newFiles) =>
                handleCodeModified(
                  activeChat.id,
                  projectName,
                  updates,
                  newFiles
                )
              }
              onAddMessage={handleAddMessage}
              onSetMessageContent={handleSetMessageContent}
              isImporting={isImporting}
              generatingStage={generatingStage}
            />
          </Panel>
          <PanelResizeHandle className="w-0.5 bg-neutral-800 hover:bg-blue-600" />

          {/* Panel 3: FileTree */}
          <Panel defaultSize={15} minSize={10} maxSize={25}>
            <FileTree
              files={files}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </Panel>
          <PanelResizeHandle className="w-0.5 bg-neutral-800 hover:bg-blue-600" />

          {/* Panel 4: Editor */}
          <Panel defaultSize={40} minSize={20}>
            <CodeEditor
              key={selectedFile}
              fileContent={files[selectedFile] || ""}
              fileName={selectedFile}
              onChange={handleCodeChange}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Builder;
